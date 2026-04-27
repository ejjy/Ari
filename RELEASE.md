# Ari — Release & Ops Checklist

Single source of truth for **what to flip on** when promoting Ari to a real
pilot. Everything below is one-time setup; once flipped the app keeps
working unattended.

## 1. Schedulers (Railway cron)

Railway → Ari_Backend → New service → Cron Job.

| Cadence (UTC) | What it triggers | URL | Header |
|---|---|---|---|
| `30 14 * * 0` (Sun 20:00 IST) | Weekly brief for all users | `POST https://web-production-7c65f.up.railway.app/api/coaching/weekly-brief/run` | `X-Internal-Token: <SCHEDULER_TOKEN>` |
| `30 3 1 * *` (1st 09:00 IST) | Monthly review brief | `POST .../api/coaching/monthly-review/run` | same |
| `30 4 5 * *` (5th 10:00 IST) | Subscription leak detection | `POST .../api/coaching/subscription-leaks/run` | same |

`SCHEDULER_TOKEN` is already set on Railway. Each endpoint iterates all
users; per-user failure doesn't block the rest.

## 2. Razorpay (Sprint 3 paywall)

Walk [RAZORPAY_INTEGRATION.md](RAZORPAY_INTEGRATION.md). Six env vars on
Railway and the Paywall flips from `configured:false` → `configured:true`.

## 3. Setu Account Aggregator

Walk [SETU_INTEGRATION.md](SETU_INTEGRATION.md). The mobile "Link bank"
CTA is gated on `SETU_ENABLED=1`; while off, the route returns 501 with
a clean error.

## 4. Auth providers

- **Phone OTP:** Supabase dashboard → Auth → Providers → Phone → ON, plug
  Twilio SID + auth-token + messaging-service-SID.
- **Google OAuth:** create an Android OAuth client in Google Cloud Console,
  paste client ID into mobile `.env` as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`,
  rebuild the app.

## 5. Push notifications

No backend setup needed. Mobile registers an Expo push token on login
via `POST /api/auth/push-token`. Confirm by signing in on a real device,
then watching `railway logs | grep push-token` for a 200.

## 6. Sentry (backend)

Add `SENTRY_DSN=https://...sentry.io/...` to Railway env vars. Restart
auto-applies; first thrown exception lands in the dashboard.

## 7. EAS production build

```bash
cd "C:\Users\Augustus Rex\Projects\Workex\Ari"

# Cloud build (recommended for signing on Apple's side)
eas build --platform android --profile production
eas build --platform ios     --profile production

# Submit to stores after build URL
eas submit --platform android --latest    # Play Store internal track
eas submit --platform ios     --latest    # App Store TestFlight
```

For Android, drop your Google Play service-account JSON at
`./google-service-account.json` (gitignored). EAS reads it via
`eas.json` `submit.production.android.serviceAccountKeyPath`.

## 8. Pre-launch device verification

Walk [DEVICE_TEST.md](DEVICE_TEST.md). 24 steps cover every shipped
feature. Stop at any red flag and ping me.

## 9. PostHog (mobile retention)

Spec §2 calls for Day-1/7/30 + NL-log-count tracking. Wired but no-ops
until you set the project key.

```bash
# In Ari/.env (then rebuild + ship)
EXPO_PUBLIC_POSTHOG_KEY=phc_...
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com   # or your self-host
```

Events fired by the app: `app_opened`, `login_success`, `register_success`,
`expense_logged`, `expense_logged_voice`, `expense_parsed_local`,
`expense_parsed_ai`, `budget_created`, `goal_created`, `paywall_viewed`,
`subscription_started`, `group_created`, `group_joined`,
`group_expense_added`, `split_settled_upi`, `split_settled_cash`,
`brief_opened`, `brief_dismissed`, `private_mode_toggled`,
`aa_consent_started`, `aa_consent_completed`. Identify is keyed by
`ari_users.id` with `tier` + `age_group` traits. Session replay is
intentionally OFF (spec §7 PII).

## 10. OTA Rollback

If a published OTA update breaks the app:

1. Find the last-known-good commit: `git log --oneline --grep "release\|ota" -10`
2. Republish that bundle:
   ```bash
   git checkout <good-sha>
   eas update --branch production --message "rollback to <good-sha>"
   git checkout master
   ```
3. Verify on a real device: cold-launch, confirm version, walk the
   primary flow (login → dashboard → add expense → Tomo).
4. If JS-only rollback isn't enough (native module bug), rebuild from the
   prior tag:
   ```bash
   git checkout v1.0.X        # the previous good tag
   eas build --profile production --platform android
   eas submit --platform android --latest
   ```
5. Open a Sentry incident, link the bad release, and write a one-line
   post-mortem in this file under "Lessons Learned".

OTA channel mapping (see `eas.json`):
- `preview` profile → `preview` channel → preview APK installs
- `production` profile → `production` channel → Play Store builds

Never republish a `production`-channel update from a dev workstation
without first verifying the diff vs. the last release tag.

---

## 11. Stuff still TODO (post-launch polish)

- Doppler for unified secrets (currently `.env` + Railway dashboard)
- Phase 4b (AuthContext full Supabase session swap) — dual-path tokens
  work fine, low priority.
- Production webhook signature on Setu (we use HMAC-SHA256 in sandbox;
  prod uses RSA-JWS detached, swap noted in `jobs/setu_client.py`).
- Sentry DSN on Railway (`SENTRY_DSN=...`) once you've created a project.
