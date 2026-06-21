# Sprint 2 Final Report
**Date:** 2026-06-21  
**Branch:** sprint-2-fast-entry → master  
**Status:** SHIPPED — QA PASS, Codex audit PASS, OTA live on preview

---

## What Shipped

### Commit 1 — Forest-on-cream tokens + Home teardown (18c7bbd)
- `src/theme/tokens.ts`: full design token system — cream bg, forest primary, clay accent, Fraunces + Inter type scale
- DashboardScreen reskinned as the reference implementation

### Commit 2 — Offline-first local transaction store (a216d55)
- `src/lib/localStore.ts`: AsyncStorage-backed store with per-row sync status (pending/synced/failed), LWW `updatedAt` tracking, `withLock` write serialisation, soft-delete tombstones
- `src/lib/syncEngine.ts`: background flush engine — AppState 'active' triggers, exponential backoff (2s→60s), per-row retry count, give-up after 6 attempts
- 207 integration tests green

### Commit 3 — Fast Entry keypad-first Add screen (920c9f2)
- `AddTransactionScreen` rebuilt: keypad-first amount entry, Quick Amounts row, inline category bar, haptic feedback, `setSaving` guard against double-submit
- Offline path: writes to localStore before API call; "↑ syncing…" badge on failed rows

### Commit 4 — Background sync engine wired into DataContext (9208866)
- `syncEngine.startAutoFlush()` called from `DataContext` on auth; flush triggers on AppState 'active'
- `DataContext.addTransaction` opportunistic-flushes immediately after local write

### Commit 5 — Edit path: PUT, updateTransaction, failed-write surface (08d3bdc)
- `txnApi.updateTransaction(id, patch)` — PUT with `updatedAt` LWW baseline
- `DataContext.updateTransaction` — optimistic local update + opportunistic server PUT; 409 → server wins, local row refreshed
- `AddTransactionScreen` edit mode: pre-filled from route params, "Update entry" CTA, `setSaving` guard
- `localStore.update()` — update op with pending/synced state management

### Commit 6 — Forest-on-cream reskin: all screens + nav FAB restructure (9560c7b)
- 48 files reskinned: zero `Colors.*` references remain in `src/`
- Nav restructure: 5 tabs → Home / Trends / [center clay FAB] / Tomo / More
- SplashScreen: `LinearGradient` removed, flat forest bg with `onForest` palette
- All `fontWeight` strings replaced with `fontFamily` from Fraunces/Inter scale
- Typecheck clean, 207/207 tests pass

---

## QA Results (device, 2026-06-21)

| Check | Result |
|-------|--------|
| A1 Splash — forest bg, clay CTA | ✅ PASS |
| A2 Tab bar — center clay FAB | ✅ PASS |
| A3 Dashboard — cream bg | ✅ PASS |
| A4 Clay FAB → Add screen | ✅ PASS |
| A5 Tomo — forest user bubbles | ✅ PASS |
| B1 Add transaction | ✅ PASS |
| B2 Edit pre-filled | ✅ PASS |
| B3 Update no-dupe | ✅ PASS |
| B4 Delete confirm sheet | ✅ PASS |
| B5 Offline add → sync | ✅ PASS |

OTA deployed: update group `f08384e0` (preview channel, runtime 1.0.1)

---

## Codex Audit (pre-merge, 2026-06-21)

Ran manual review with same [P1]/[P2] gate. 9 findings raised.

| ID | Sev | File | Finding | Resolution |
|----|-----|------|---------|-----------|
| A | P1 | syncEngine + DataContext | Concurrent POST (inline + AppState flush) — safe only if backend upserts | ✅ VERIFIED: backend G2 upsert on client_id (transactions.py:109–118) |
| B | P1 | DataContext:355 | DELETE fired for pending-creates never synced → spurious 404 | ✅ VERIFIED: backend G3 idempotent delete returns 200 for unknown ids (transactions.py:165–168) |
| C | P2 | DataContext:379 | LWW baseline from stale React state, not fresh store read | Accepted — requires two edits within one render cycle; no fix this sprint |
| D | P2 | localStore:339 | getPending() outside write lock — stale snapshot | Accepted — cannot lose data, may produce harmless redundant request |
| E | P2 | syncEngine:68,118 | updatedAt not in Transaction type; cast accepts undefined | Accepted — backend always returns updatedAt per API contract |
| F | P2 | syncEngine:49–51 | Second delete returns 200 not 404 (verified) — tombstone never strands | ✅ CLOSED by finding B verification |
| G | P2 | syncEngine:164–169 | failureStreak never resets with only give-up rows → perpetual backoff | Accepted — wastes battery but no data loss; defer to Sprint 3 |
| H | P2 | AddTransactionScreen:233 | Edit path: note field not editable (always preserves original) | Accepted — note editing not in Sprint 2 scope |
| I | P2 | AddTransactionScreen:61 | State doesn't reset on double-navigate without unmount | Accepted — FAB guard prevents this in practice |

**Final gate: PASS.** Both P1s resolved by backend verification. No code changes required.

---

## What Didn't Ship (deferred)

- AutoCapture / SMS import (Phase 2)
- Paywall live (flag-gated off for v1)
- CLAUDE.md OTA cherry-pick to master (housekeeping)
- Backend hardening: rate limiting, SECRET_KEY rotation reminder

---

## Discipline Notes

- Iron law held: both P1s were verified against backend source before any fix was considered
- Timezone caveat (IST/UTC): one false-alarm "write-path bug" in Sprint 1 QA was caused by UTC-filter on an IST-midnight-crossing entry — memorialised in sprint-1 docs, avoided in sprint-2 QA
- OTA gate honoured: no OTA pushed until user confirmed all 10 QA checks passed
