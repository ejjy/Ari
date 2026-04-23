# Device Test Checklist — v2

**Backend:** https://web-production-7c65f.up.railway.app/api
**Database:** Supabase project `cazigdaoqeoqnqwajibf` (Singapore)

Covers everything shipped through commit `17c7a7f` (backend) + the paired
mobile block: Supabase migration, AI fallback + voice + Private Mode,
push notifications (brief + budget), Dashboard brief card, Daily
heatmap, Quick Add Templates, Google OAuth, Phone OTP, Setu AA scaffold.

## Build

```bash
cd "C:\Users\Augustus Rex\Projects\Workex\Ari"
npx expo prebuild --clean       # picks up mic + web-browser plugins
npx expo run:android            # or run:ios
```

Expo Go won't work — native modules (expo-speech-recognition,
expo-web-browser) need a dev client.

## Smoke path — 24 steps

All steps with **demo@ari.app / demo123** unless noted.

### Auth (1–6)

1. Login screen renders with three buttons: Sign In, Continue with Google, Continue with phone.
2. Email + password → Dashboard in ≤2 s. `ari_token` is now a Supabase ES256 JWT (`alg=ES256, kid=81ec7230`).
3. Logout returns to Login; `ari_token` cleared from AsyncStorage.
4. **Continue with Google** (skip if `EXPO_PUBLIC_GOOGLE_CLIENT_ID` unset). Opens system browser, returns a session, Dashboard loads with a brand-new user row in `ari_users`.
5. **Continue with phone** → +91 prefix present; enter a real phone number in E.164 format. Supabase sends an SMS (needs Twilio configured in dashboard). 6-digit code → Dashboard.
6. Back to Login, sign in as demo again.

### Add transaction (7–14)

7. Tap **+** on Dashboard → bottom sheet slides up.
8. **Quick Add Templates** chip strip visible below amount. Tap **Swiggy** → category flips to Food, merchant pre-fills, description "Swiggy order".
9. Enter amount ₹350, Save → success animation.
10. Back to Add Transaction. Type `swigy 340` (typo) in Description → Food category (fuzzy, local, no network).
11. Clear + type `random gadget 2000`. ~600 ms debounce → AI fallback POSTs /api/parse/expense. If confidence ≥ 0.70 auto-fills; if <0.70 confirmation sheet appears with "Our AI is X% confident…".
12. **Mic icon** tap → first time grants mic + speech permissions. Placeholder flips to "Listening…". Say "Starbucks 420 yesterday" → transcript streams into description, date resolves to yesterday.
13. Save.
14. Open backend via `railway logs | grep POST /api/transactions` — requests should be 201.

### Push notifications (15–17)

15. First app open after login, Android permission prompt for notifications. Allow.
16. `railway logs` will show `POST /api/auth/push-token 200 ok` from the register hook.
17. Manually hit the internal trigger to simulate a weekly brief (from your laptop):

    ```bash
    curl -X POST \
      -H "X-Internal-Token: <value of SCHEDULER_TOKEN>" \
      "https://web-production-7c65f.up.railway.app/api/coaching/weekly-brief/run?user_id=456e2a0f-2548-4c0c-bf55-ff11480478a2"
    ```

    Expect a push within seconds. Tap → Dashboard opens. Brief card shows summary + insights + actions.

### Budget alerts (18–19)

18. Set a budget for Food with a low limit (e.g. ₹200). Log a Food expense for ₹180. Backend fires 80% push automatically on transaction create.
19. Log another ₹50 → 100% push fires. Logging a third ₹20 doesn't re-trigger (idempotent per (category, month, threshold)).

### Private mode + heatmap + accountant (20–22)

20. Settings → toggle **Private Mode** on. Dashboard → every amount is ••••. Transactions, Budgets, Accountant sub-screens, Daily Heatmap all mask.
21. Navigate to Accountant → Daily Heatmap. Month grid with colour intensity per day; today outlined; prev/next month chevrons.
22. Toggle Private Mode off → amounts reappear everywhere.

### Setu AA (23)

23. Once we flip `SETU_ENABLED=1`, tap the "Link bank" CTA (not yet built). For now `GET /api/aa/status` returns `{"enabled": false, "linked": false, "provider": "setu"}` and the mobile should show nothing.

### Logout (24)

24. Settings → Log out → Login screen. `ari_token` cleared, push token detached backend-side.

## Red flags

- Login returns 401 → Supabase env vars not set on Railway or Supabase project down.
- AI fallback returns 502 with `'list' object has no attribute 'upper'` → response_schema regression (already fixed in fb9f452).
- Mic permission granted but no transcript → expo-speech-recognition plugin missing from prebuild; rerun `npx expo prebuild --clean`.
- Budget push fires twice for the same threshold → `coaching_cache.budget_alert` idempotency guard failing; check `SELECT * FROM coaching_cache WHERE type='budget_alert'`.
- Google sign-in errors "EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set" → add it to `.env` (Android OAuth client ID from Google Cloud Console, plus URL scheme registration).
- Phone OTP returns "Error sending OTP" → Supabase dashboard → Auth → Providers → Phone is off, or Twilio creds missing.

## Rollback

Each deploy is reversible. For the backend:

```bash
cd backend && git log --oneline -5
git revert <bad-commit> --no-edit && git push    # Railway auto-deploys
```

For a full rollback of the Supabase cut-over (drastic — only if Supabase
itself is down):

1. Set `SUPABASE_DATABASE_URL=""` on Railway (empty string; don't delete).
2. Flask config falls back to `DATABASE_URL` (Railway Postgres) automatically.
3. Re-run the Railway → Supabase migration script with `--force-non-empty` once Supabase is back.
