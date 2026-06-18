# Ari — Offline-First Persistence & Sync Design

**Sprint:** 2 — "Fast Entry + Forest Reskin"
**Scope:** local write store (Commit 2) + background sync engine (Commit 4); backend contract changes (parallel `ari-backend` PR).
**Supersedes:** `src/hooks/useOfflineCache.ts` (AsyncStorage read-cache).
**Status:** APPROVED FOR BUILD. Decisions D1–D5 locked. Reconciled against the real schema/routes 2026-06-18 (CTO draft + dev review).

> This is the corrected version of the CTO draft. The draft's architecture (local-first boundary, single-flight flush, created_at ordering, LWW trade-off, soft-delete tombstones, idempotency-needs-both-halves, backoff+jitter) was accepted as-is. The seven items below are corrections found by checking the draft against the code on disk; the real schema won where they differed.

---

## 0. The boundary (unchanged from draft)
The local store is the source of truth for the UI; the server is a replica we reconcile toward. Every read renders from local. Every write commits to local first and returns immediately. The network is never in the path of a user action.

---

## 1. Locked decisions

| # | Decision | Resolution |
|---|----------|-----------|
| ID model | A vs B | **A — server accepts the client UUID as canonical `id`.** PK is `db.String(36)` with an app-side `default=_uuid` ([models.py:160](../backend/models.py)); an explicit client value overrides the default. `server_id` column dropped. Client UUIDs via `expo-crypto` `randomUUID()` (already installed, no new dep). |
| `updated_at` authority | server vs client | **Server-stamped** on every write, returned in the response, stored by the client. Avoids clock-skew LWW bugs. **Requires G1 (column does not exist yet).** |
| Seed existing data | yes/no | **Yes**, one-time seed from server on upgrade — but resolve **G6** (no bulk endpoint) first. |
| Delete UX | gesture | **Keep long-press.** Soft-delete tombstone is internal only. |
| Mandatory fields (D4) | relax vs defaults | **Relax the backend**: a create may omit category (stored `uncategorized`) and send empty description. AI/auto-categorize fills category post-save. Reads render an "Uncategorized" bucket. Honors the true 2-tap promise; no fake data. |
| Amount cap (D5) | 1cr vs 100cr | **1 crore (10,000,000 rupees)** enforced identically in keypad, backend `_parse_amount`, and this doc. Rename `MAX_AMOUNT_PAISE` to a rupee-named constant (it was misnamed; app is whole-rupee). |
| Local store (D7) | SQLite vs AsyncStorage | **AsyncStorage behind a `localStore` interface**, not `expo-sqlite`. Right-sized for the data profile, no native module (OTA-able), swappable to SQLite later. Sync architecture is identical either way. See §3. |

---

## 2. Corrections folded in (the draft vs the real code)

**G1 — `expenses` had no `updated_at`. LWW had nothing to compare. [BLOCKER]**
`Transaction` ([models.py:157](../backend/models.py)) has `created_at` only; `to_dict` ([models.py:200](../backend/models.py)) emits no `updatedAt`. Every other table has `updated_at, onupdate=_now`; expenses was the exception.
**Fix:** add `expenses.updated_at` (DateTime tz, `default=_now, onupdate=_now`); expose `updatedAt` in `to_dict`; add `updatedAt` to the frontend `Transaction` type; backfill in prod via the existing `_run_migrations()` startup ALTER. **This lands before the sync engine (Commit 4).**

**G2 — POST was create-only and ignored a client `id`.**
[routes/transactions.py:56](../backend/routes/transactions.py) always inserts a fresh row. **Fix:** accept `data.get("id")` and **upsert on conflict(id)** so a retried create lands once.

**G3 — DELETE 404'd on an unknown id.**
[routes/transactions.py:146](../backend/routes/transactions.py). **Fix:** idempotent — return 200/204 when the row is already gone, so a retried delete doesn't stick as `failed`.

**G4 — local schema was too thin; it dropped `description` (server NOT NULL) and all parse metadata.**
Server requires `description` ([models.py:165](../backend/models.py), [routes:59](../backend/routes/transactions.py)); the kept voice/AI path (D1) also produces `merchant, entry_type, raw_input, parse_source, confidence` ([api/transactions.ts:14](../src/api/transactions.ts)). **Fix:** local table must persist those for round-trip fidelity (full schema in §3). `tags / is_recurring / recurrence_rule / income_source` are explicitly **out of scope for offline writes** this sprint (the keypad path never sets them); the AA/recurring paths remain online-only.

**G5 — server required a valid category + description, colliding with "amount + direction only."**
Resolved by D4 (relax backend).

**G6 — the seed migration has no bulk endpoint.**
`getTransactions(month?)` and `GET /` are month-scoped ([api/transactions.ts:4](../src/api/transactions.ts)). **Fix:** add `GET /transactions?all=1` (or cursor-paginated) for the one-time seed; until then, seed by iterating the last 12 months. Decide at backend-PR time; not a Commit 2 blocker (a fresh install just starts empty and backfills as the user uses it).

**G7 — budget alerts turn a sync backlog into push spam.**
Each expense create fires `check_budget_thresholds` inline ([routes:133](../backend/routes/transactions.py)). Flushing N offline expenses = N budget pushes for old spends. **Fix:** the create path takes a `backfill`/`suppressAlerts` flag set by the sync engine; alerts only fire for live (foreground) creates.

---

## 3. Local store (AsyncStorage behind a `localStore` interface — D7)

**Decision D7:** the on-device store is AsyncStorage (already a dependency), not `expo-sqlite`. For this app's data profile (single-user; a heavy user ≈ 600 rows/year, ~1 MB over 5 years) a load-all-into-memory + filter-in-JS model is fast, and it keeps the feature OTA-able with no native module. AsyncStorage on Android is itself SQLite-backed, so we lose nothing structural. `localStore.ts` exposes a storage-agnostic interface so we can swap to `expo-sqlite` later if a real user's volume ever justifies indexed queries — the sync engine and DataContext never see the backing store.

Persisted under one AsyncStorage key (`ari_txn_store_v1`) as a JSON array of records; writes go through an in-memory mutex so concurrent saves can't clobber the blob. Each record:

```ts
interface LocalTxn {
  id: string;            // client UUID v4 (canonical; ID model A)
  amount: number;        // whole rupees, cap 10_000_000 (1 crore)
  type: 'expense' | 'income';
  category: string | null;       // 'uncategorized' until AI/user sets it (D4)
  description: string;            // server is NOT NULL (G4) — default ''
  note: string;
  date: string;                   // 'YYYY-MM-DD'; same key on the wire
  // parse provenance — kept because D1 keeps voice/AI (G4)
  merchant: string | null;
  entryType: 'manual' | 'voice';
  rawInput: string | null;
  parseSource: 'local' | 'fuzzy' | 'ai' | 'aa';
  confidence: number | null;
  // timestamps
  createdAt: string;              // ISO 8601 UTC
  updatedAt: string;              // server-authoritative once synced (G1)
  // sync control (LOCAL ONLY — never sent as domain data)
  syncStatus: 'synced' | 'pending' | 'failed';
  op: 'create' | 'update' | 'delete';
  deleted: boolean;               // tombstone
  retryCount: number;
  lastError: string | null;
}
```

Explicitly **out of scope for offline writes** this sprint (online-only paths set them; the keypad flow never does): `tags`, `isRecurring`/`recurrenceRule`, `incomeSource`, `parentRecurringId`, `accountId`, `merchantId`. The local store ignores them; if the server returns them on a seed/read they're dropped from the local mirror.

`month` is **not stored** (server derives it). The read layer derives it as `date.slice(0,7)` for month-scoped queries (Budget/Trends). A separate KV key holds `schema_version` + `last_sync_at`. `useOfflineCache` is removed once reads come from `localStore`. No two caches in parallel.

---

## 4. `sync_status` lifecycle (unchanged from draft)
`pending` = local truth not yet on server (always retryable). `failed` = last attempt errored: network/5xx → backoff-eligible auto-retry; 4xx → stop, surface, no blind retry. `synced` = agree as of last `updated_at`; any new local edit → `pending` with `op='update'`. `retry_count`/`last_error` drive the UI tag and backoff.

---

## 5. Sync engine (`src/lib/syncEngine.ts`)
- **Triggers:** app foreground (`AppState`), connectivity regained (`@react-native-community/netinfo`), opportunistic flush after each local write when online, and a 60s foreground safety interval.
- **Flush (single-flight):** in-memory lock; select `pending`/backoff-eligible `failed` ordered by `created_at ASC`; dispatch by `op` (`create`→POST upsert, `update`→PUT, `delete`→DELETE then drop the tombstone); on success `synced` + clear error; on failure classify (network/5xx→backoff, 4xx→surface). Batch cap 50/flush. Update `meta.last_sync_at`. Sync creates carry the `suppressAlerts` flag (G7).
- **Backoff:** exponential + jitter (~2/4/8/16s … cap 5min), `retry_count` drives the exponent.

---

## 6. Conflict handling — LWW on server-stamped `updated_at` (unchanged)
Local `updated_at` newer → server accepts. Older → server returns 409 + current row; client overwrites local, marks `synced`. Documented limitation: LWW can silently drop one side of a true concurrent edit. Acceptable for single-user personal finance; revisit if shared ledgers (deferred udhaar) land.

---

## 7. Backend contract (parallel `ari-backend` PR)

| Endpoint | Behaviour |
|----------|-----------|
| `POST /transactions` | Accept client `id`; **upsert on `id`** (idempotent). Accept null/empty category (store `uncategorized`) and empty description (D4). Validate `amount` integer in `[1, 10_000_000]` (D5), `type` in enum. Accept optional `suppressAlerts` (G7). Return stored row incl. server `updatedAt` (G1). |
| `PUT /transactions/:id` | Update; LWW compare `updated_at`; 409 + current row if client stale. Same validation. (Commit 5.) |
| `DELETE /transactions/:id` | Idempotent — already-deleted/unknown returns 200/204 (G3). |
| `GET /transactions?all=1` | Bulk/paginated fetch for the one-time seed (G6). |
| all | Stamp `updated_at` server-side; return it. Add `expenses.updated_at` via `_run_migrations()` (G1). |

---

## 8. Sequencing
- **Commit 2 (mobile, can start now):** local AsyncStorage-backed store (`localStore.ts`, D7) + `DataContext` reads from local + opportunistic flush over today's existing POST/DELETE. Works standalone; a fresh install starts empty and backfills through use.
- **Backend PR (before Commit 4):** G1 (`updated_at`), G2 (upsert), G3 (idempotent delete), G5 (relax), G7 (suppressAlerts), G6 (bulk seed). Without G1+G2 the sync engine isn't trustworthy.
- **Commit 4 (mobile):** sync engine + NetInfo, once the backend PR is live.
- **Commit 5:** edit path (`PUT` + `updateTransaction` + edit UI).

---

## 9. Definition of done (offline portion)
- Airplane mode → create 3, edit 1, delete 1 → instant, tagged pending, survive an app kill.
- Reconnect → all five reconcile, tags flip to synced, **zero duplicates**, server matches device.
- Retried create (kill mid-flush) → exactly one row server-side (idempotency holds).
- Stale-edit conflict → server wins, local converges, no crash, no infinite retry.
- Syncing a backlog fires no stale budget pushes (G7).
- `useOfflineCache` removed; `localStore` (AsyncStorage) is the single source of truth.
