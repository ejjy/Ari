# Setu Account Aggregator Integration — Planning Doc

**Status:** Phase 0 scaffold. Routes exist at `/api/aa/*` and gracefully
respond 501 until feature-flag `SETU_ENABLED=1` is set on Railway.

Spec reference: §2 (Account Aggregator row), §4 (`accounts.aa_account_id`,
`ari_users.aa_consent`, `aa_linked_at`), §7 (RBI AA consent requirements),
Sprint 2 DoD.

## What Ari needs from AA

Read-only pull of the user's bank/wallet/credit-card transactions so the
expense parser can auto-populate the ledger. Goal per spec §1: "Account
Aggregator (AA) integration as primary data source — voice input as
fallback."

## The four integration points

1. **Consent creation** — `POST /api/aa/consent`
   Flask -> Setu `POST /consents`. Setu returns a `consentHandle` + a
   redirect URL. We persist the handle on `accounts.aa_account_id` and
   reply with the redirect URL for the mobile web-view.
2. **Consent polling** — `GET /api/aa/consent/<id>`
   Flask -> Setu `GET /consents/<handle>`. On `ACTIVE`, we stamp
   `ari_users.aa_linked_at = now()`.
3. **Webhook** — `POST /api/aa/webhook`
   Setu -> Flask on consent-state-change + FI-data-ready events.
   Authed by a shared secret header `x-setu-signature` matching
   `SETU_WEBHOOK_SECRET`. Must verify the JWS signature in the real impl.
4. **FI data fetch** — `POST /api/aa/fetch/<id>` (not yet stubbed)
   Flask -> Setu `POST /FI/request` -> webhook fires when ready ->
   `POST /FI/fetch/<session>` pulls the data. We pipe every transaction
   through the Gemini parser with `entry_type='aa_sync'` + an
   appropriate merchant override when the bank statement line is clean.

## Env vars to add on Railway once we go live

| Key | Example | Notes |
|-----|---------|-------|
| `SETU_ENABLED` | `1` | Feature flag — routes 501 while unset. |
| `SETU_CLIENT_ID` | `setu-xyz` | Issued by Setu after sandbox onboarding. |
| `SETU_CLIENT_SECRET` | *(secret)* | HMAC signing of outbound requests. |
| `SETU_BASE_URL` | `https://fiu-sandbox.setu.co` | Sandbox; flip to prod when approved. |
| `SETU_WEBHOOK_SECRET` | *(secret)* | Validates inbound webhook requests. |
| `SETU_PURPOSE_CODE` | `101` | Personal finance management — this is the AA-framework purpose code for spending insights. |

## What's already in place

- `backend/routes/aa.py` with all four endpoints, gated behind the flag.
- `ari_users.aa_consent` BOOLEAN + `ari_users.aa_linked_at` TIMESTAMPTZ
  columns from the initial schema migration.
- `accounts` table (spec §4) with `aa_account_id` for the per-account
  consent handle.
- `expenses.entry_type` CHECK constraint already allows `'aa_sync'`.

## Next concrete steps (post-scaffold)

1. Sign up for a Setu FIU sandbox account (https://docs.setu.co/data).
2. Store the `SETU_CLIENT_ID` / `_SECRET` / `_WEBHOOK_SECRET` in Railway.
3. Replace the stub responses in `routes/aa.py` with real `httpx` calls
   against the Setu sandbox. Respect their rate limits (10 rps per IP).
4. Add the webhook signature verifier — Setu docs have the JWS sample.
5. Build the mobile "Link bank" flow: three screens (explainer, bank
   pick, redirect to Setu's consent UI via in-app browser).
6. Test with the Setu sandbox bank ("SRCB"). End-to-end until a fetched
   transaction lands in `expenses` with `entry_type='aa_sync'`.

## Why the scaffold ships before the real integration

- The mobile app needs `GET /api/aa/status` to decide whether to show
  the "Link bank" CTA. Shipping the endpoint now lets the UI land
  first, flipped on by a server-side config change the day Setu
  approves our sandbox access.
- The webhook URL needs to be registered with Setu during onboarding.
  Having it live (even if it just accepts + no-ops) means the
  registration step doesn't block on a deploy later.
- RLS + cascade cleanup already work correctly; nothing about the
  schema changes when we go live.
