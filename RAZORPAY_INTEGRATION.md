# Razorpay Subscriptions — Integration Guide

**Status:** code shipped, awaiting Razorpay account + plan creation.

Spec reference: §2 (Payments row), Sprint 3 ("Razorpay subscription
paywall"), §1 revenue target (₹99 pilot → ₹129 Pro at scale, ₹249 Family).

## Activating payments — one-time setup

### 1. Razorpay account + KYC

Sign up at https://dashboard.razorpay.com. Complete Business Details,
Bank Details, Stakeholders, and GST (if applicable). Until KYC is
approved, the account runs in **Test Mode** with fake card numbers —
that's enough to validate the flow end-to-end.

### 2. Create subscription plans

Dashboard → **Subscriptions** → **Plans** → Create Plan. Create three:

| Key | Interval | Amount (paise) | Name |
|-----|----------|----------------|------|
| pilot | monthly, billing_cycle=1 | 9900 (₹99) | Ari Pilot |
| pro | monthly, billing_cycle=1 | 12900 (₹129) | Ari Pro |
| family | monthly, billing_cycle=1 | 24900 (₹249) | Ari Family |

Copy the `plan_<hash>` identifier for each — that's what goes into the
Railway env vars below.

### 3. Generate API keys

Dashboard → **Account & Settings → API Keys** → Generate. Capture the
Key ID (public) + Key Secret (private).

### 4. Configure the webhook

Dashboard → **Account & Settings → Webhooks** → Add New:

- URL: `https://web-production-7c65f.up.railway.app/api/billing/webhook`
- Secret: generate 32 random chars (keep safe — we verify every inbound request)
- Events: subscribe to `subscription.activated`, `subscription.charged`,
  `subscription.cancelled`, `subscription.halted`, `subscription.paused`,
  `subscription.resumed`, `subscription.completed`, `payment.failed`

### 5. Set Railway env vars

```bash
cd backend
railway variables \
  --set "RAZORPAY_KEY_ID=rzp_test_xxx" \
  --set "RAZORPAY_KEY_SECRET=<secret>" \
  --set "RAZORPAY_WEBHOOK_SECRET=<webhook_secret>" \
  --set "RAZORPAY_PLAN_ID_PILOT=plan_xxx" \
  --set "RAZORPAY_PLAN_ID_PRO=plan_yyy" \
  --set "RAZORPAY_PLAN_ID_FAMILY=plan_zzz"
```

Railway auto-redeploys. `/api/billing/status` goes from `configured:false`
to `configured:true` once the vars propagate.

## What's wired up already

### Backend

- `POST /api/billing/subscription {plan}` — creates a Razorpay
  subscription bound to the signed-in user's customer record. Returns
  `{subscriptionId, keyId}` — what the mobile SDK needs to open checkout.
- `POST /api/billing/subscription/cancel` — `cancel_at_cycle_end=1` so
  the user keeps access through the end of the paid period.
- `POST /api/billing/webhook` — HMAC signature verified; updates
  `ari_users.tier` + `subscription_status`; appends to
  `subscription_events` for audit. Idempotent via Razorpay event id.
- `GET /api/billing/plans` — public catalog (no server config needed).
- `GET /api/billing/status` — current user's state.

### Mobile

- `src/screens/PaywallScreen.tsx` — three-plan picker, opens Razorpay
  checkout via `react-native-razorpay`, refreshes `/me` on success.
- `Settings` → **Upgrade to Ari Pro** menu item (label flips to "Ari Pilot"
  etc. once subscribed).
- `src/api/billing.ts` — typed client.

## Test Mode checklist

With `rzp_test_*` keys, Razorpay lets you pay with the test card
`4111 1111 1111 1111`, any future expiry, any CVV, OTP `123456`.

1. Open Paywall, pick **Pilot**.
2. Tap Subscribe → Razorpay checkout opens with `₹99/month`.
3. Enter test card → 3DS OTP `123456` → success.
4. Within 2–3 seconds Razorpay fires `subscription.activated` to the
   webhook. `ari_users.tier` should flip to `'pilot'`.
5. Settings menu label changes to **Ari Pilot** after a `/me` refresh.
6. Check the audit trail:
   ```sql
   SELECT event_type, razorpay_event_id, received_at
     FROM subscription_events
    WHERE user_id = '<demo user id>'
    ORDER BY received_at DESC;
   ```
7. Cancel from Settings → Paywall → Razorpay cancels at cycle end; the
   tier keeps showing until `tier_valid_until` passes.

## Production cutover

1. Complete Razorpay KYC.
2. Swap `rzp_test_*` keys for `rzp_live_*` on Railway.
3. Recreate the three plans in Live Mode (plan IDs differ from Test).
4. Update the three `RAZORPAY_PLAN_ID_*` env vars.
5. Re-register the production webhook URL + secret (Test and Live
   webhooks are independent).

## Where to look when it breaks

- Webhook returns 401 → `RAZORPAY_WEBHOOK_SECRET` mismatch between
  Railway and the Razorpay dashboard.
- Subscription creates but never activates → Razorpay dashboard →
  Subscription → Events. Common causes: customer hasn't completed
  checkout, bank declined, 3DS timeout.
- Tier doesn't upgrade after successful payment → check
  `subscription_events` for the webhook landing, then check
  `ari_users.subscription_status` — the status-to-tier mapping in
  `backend/jobs/razorpay_client.py:tier_for_plan_id` expects one of
  `active`/`charged`/`resumed`.
