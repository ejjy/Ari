# Supabase Migration — Plan

**Status:** Phase 1 in progress · **Owner:** Ejaj · **Target cutover:** Sprint 1 end

This document is the single source of truth for the Ari backend moving from
plain Railway Postgres + Flask-issued JWTs to Supabase Postgres + Supabase
Auth. Each phase ships independently. The plan matches Tech Spec v1 §2
("Supabase PostgreSQL — Studio shared project, separate schema from
Darelight") and §7 (RLS for finance data).

---

## Locked decisions (override here)

| # | Decision | Chosen | Confirmed |
|---|---|---|---|
| 1 | Supabase project | **New dedicated Ari project** (not shared with Darelight) | 2026-04-18 |
| 2 | Existing-user strategy | Option B — full dump + re-import (bcrypt hashes transfer) | 2026-04-18 |
| 3 | Auth providers day-1 | Email/password (demo account) + Google OAuth + **Phone OTP** | 2026-04-18 |
| 4 | Table renames | `users`→`ari_users`, `transactions`→`expenses`, `savings_goals`→`goals` (matches spec §4) | 2026-04-18 |
| 5 | App hosting | Flask stays on Railway. Only DB + Auth move to Supabase. | 2026-04-18 |

**Why we're moving at all:** Supabase Auth gives us phone OTP + Google OAuth
in hours instead of the ~2 weeks it takes to build them into Flask +
Twilio + OAuth2-from-scratch. Supabase RLS enforces user-data isolation at
the DB layer — a safety net if a Flask route ever forgets a `WHERE
user_id = ?`. Railway is still hosting the Flask app; only the data plane
moves.

If you disagree with any of the above, annotate the row and ping me — don't
change the SQL without updating this table first.

---

## Phased rollout

### Phase 1 — Schema in Supabase *(code-only, no creds needed)*
**Artifacts:**
- `supabase/migrations/20260418000001_init_schema.sql` — all tables in `public` schema (dedicated project, no namespace collisions)
- `supabase/migrations/20260418000002_rls_policies.sql` — RLS on every user-owned table
- `supabase/migrations/20260418000003_indexes_triggers.sql` — spec §4 indexes + updated_at triggers
- `supabase/README.md` — apply instructions

**Verification:** run each migration against a scratch Supabase project
(cheapest: local `supabase start`). Tables should create, RLS should block
anonymous reads, service-role should see everything.

### Phase 2 — Backend auth cutover *(code)*
- Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` to
  Railway env vars.
- `backend/supabase_client.py` — admin client using service role key
  (bypasses RLS; used for cron jobs and cross-user queries).
- `backend/auth_helpers.py` — rewrite `token_required` to verify Supabase JWT
  against the JWKS endpoint instead of issuing its own. `create_token`
  becomes a shim that calls `supabase.auth.admin.create_user` + returns the
  Supabase-issued JWT so the frontend's `authApi.login/register` contract
  doesn't change on day one.
- `backend/config.py` — `DATABASE_URL` now points at Supabase pooler
  (port 6543 transaction mode).
- All route handlers: `current_user` resolves by `auth.uid() = ari_users.id`
  instead of a Flask JWT subject claim. No business logic change.

### Phase 3 — Data migration *(one-shot script)*
- `scripts/migrate_railway_to_supabase.py`:
  1. Connect to both Railway and Supabase.
  2. For each row in `users`: call `supabase.auth.admin.create_user` with
     `email_confirm=True`, `password_hash=<bcrypt from railway>`. Collect
     the new `auth.users.id` → old `users.id` map.
  3. For each child table (`transactions`, `budgets`, etc.): rewrite
     `user_id` column using the map, insert into the renamed Supabase table.
  4. Dry-run mode (`--dry-run`) prints counts only.
  5. Rollback-friendly: targets an empty `ari` schema; re-runnable by
     truncating and re-importing.

**Gate:** script runs against a scratch Supabase project first. Only after a
clean parity check (row counts + spot queries) does it run against prod.

### Phase 4 — Frontend auth providers *(code)*
- `npm i @supabase/supabase-js @react-native-google-signin/google-signin`
- `src/lib/supabase.ts` — create a single client configured for
  Expo/AsyncStorage session persistence.
- `AuthContext.tsx` rewrite: session is now a Supabase `Session`, not a
  hand-rolled JWT. `apiRequest` reads the token from `supabase.auth.getSession()`.
- `LoginScreen.tsx` — add "Continue with Google" and "Continue with phone"
  buttons.
- `RegisterScreen.tsx` — unchanged UX; submits to same backend endpoint,
  which now creates the user via `supabase.auth.admin.create_user`.
- `PhoneOtpScreen.tsx` *(new)* — 2-step phone OTP flow
  (`signInWithOtp` → `verifyOtp`). Twilio creds go in the Supabase
  dashboard, not the app.

### Phase 5 — Verify & cutover *(ops)*
- 48h shadow mode: Railway DB stays live read-only. New signups write only
  to Supabase; existing logged-in users stay on their Railway token until
  next re-auth.
- Smoke tests: login, add expense, view summary, logout, re-login.
- Monitoring: Sentry for Flask errors, Supabase dashboard for DB health.
- Flip `EXPO_PUBLIC_API_URL` if needed; Railway DB decommissioned only
  after 7 days of clean Supabase operation.

---

## Schema diff summary (current → Supabase)

| Current table | Supabase table (`ari` schema) | Key changes |
|---|---|---|
| `users` | `ari_users` | Drop `password_hash` (moved to `auth.users`); `id` now `UUID` FK to `auth.users(id)`; add spec fields: `monthly_income`, `tier`, `aa_consent`, `aa_linked_at`, `updated_at` |
| `transactions` | `expenses` | Add spec fields: `merchant`, `merchant_id`, `entry_type`, `raw_input`, `parse_source`, `confidence`, `account_id`; `date TEXT` → `expense_date DATE`; `month TEXT` → generated column |
| `budgets` | `budgets` | `limit_amount INTEGER` → `monthly_limit NUMERIC(12,2)`; `month TEXT` → `month DATE` |
| `savings_goals` | `goals` | `current_amount` → `saved_amount`; `is_completed BOOLEAN` → `status TEXT DEFAULT 'active'` |
| *(new)* | `accounts` | Spec §4: bank/cash/wallet/credit accounts with optional `aa_account_id` |
| *(new)* | `coaching_cache` | Spec §4: Gemini briefs cached with `period_start/end` |
| `tax_profiles` | `tax_profiles` | Unchanged shape; app-specific, not in spec |
| `budget_rollovers` | `budget_rollovers` | Unchanged |
| `user_categories` | `user_categories` | Unchanged |
| `todo_notes` | `todo_notes` | Unchanged |
| `feedbacks` | `feedbacks` | Unchanged |

---

## Rollback

Every phase is individually reversible:
- **Phase 1:** drop `ari` schema (DDL-only, no data).
- **Phase 2:** revert `auth_helpers.py` + `config.py` diffs; `DATABASE_URL`
  back to Railway string. No destructive DB changes at this step.
- **Phase 3:** truncate the `ari` schema tables; Railway DB untouched.
- **Phase 4:** revert frontend diff; backend still accepts Flask JWTs
  because Phase 2 shim kept them working.
- **Phase 5:** flip env var back to Railway. Supabase data gets stale but
  survives for later re-run.

The high-risk windows are Phase 3 (data copy — verify with dry-run first)
and the final flip in Phase 5 (brief user-visible downtime; schedule at
low-traffic hour).
