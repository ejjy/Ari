# Ari - Pre-Launch Checklist

Last updated: 2026-04-06

This document is the step-by-step path from current state to live on the Play Store. Follow in order. Do not skip steps.

---

## Phase 1: Verify Backend (Day 1)

The app is useless without a working backend. Verify everything before touching the mobile app.

### 1.1 Deploy Backend

- [ ] Backend Flask app is deployed (Render, Railway, AWS, or similar)
- [ ] Backend has a public HTTPS URL (e.g., `https://ari-api.onrender.com`)
- [ ] Backend `.env` is configured:
  - `SECRET_KEY` — random secure string
  - `DATABASE_URL` — PostgreSQL or SQLite connection
  - `OPENAI_API_KEY` — for Tomo AI chat (must be `gpt-4o-mini`, not `gpt-4.1-mini`)
- [ ] Backend is running and accessible (visit URL in browser, should return JSON)

### 1.2 Test Every API Endpoint

Open a terminal and test each endpoint with curl or Postman. Replace `BASE` with your deployed URL.

```bash
BASE=https://your-backend-url.com/api

# 1. Register
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@ari.app","password":"test123","ageGroup":"25-35","incomeBracket":"30k-60k","mainGoal":"save_more"}'
# Expected: { "token": "...", "user": { ... } }

# 2. Login
curl -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ari.app","password":"test123"}'
# Expected: { "token": "...", "user": { ... } }
# Save the token for next requests.

TOKEN=<paste_token_here>

# 3. Get me
curl $BASE/auth/me -H "Authorization: Bearer $TOKEN"
# Expected: user object

# 4. Add transaction
curl -X POST $BASE/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"expense","amount":500,"category":"food","description":"Zomato order","note":"","date":"2026-04-06"}'
# Expected: transaction object with id

# 5. Get transactions
curl "$BASE/transactions?month=2026-04" -H "Authorization: Bearer $TOKEN"
# Expected: array of transactions

# 6. Get summary
curl "$BASE/transactions/summary?month=2026-04" -H "Authorization: Bearer $TOKEN"
# Expected: { "income": ..., "expenses": ..., "balance": ... }

# 7. Delete transaction
curl -X DELETE $BASE/transactions/<transaction_id> -H "Authorization: Bearer $TOKEN"
# Expected: success message

# 8. Create budget
curl -X POST $BASE/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"category":"food","limit":5000,"month":"2026-04"}'
# Expected: budget object

# 9. Get budgets
curl "$BASE/budgets?month=2026-04" -H "Authorization: Bearer $TOKEN"
# Expected: array of budgets

# 10. Delete budget
curl -X DELETE $BASE/budgets/<budget_id> -H "Authorization: Bearer $TOKEN"
# Expected: success message

# 11. Tomo chat
curl -X POST $BASE/tomo/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"How much did I spend this month?","history":[]}'
# Expected: { "response": "..." }

# 12. Tomo nudge
curl $BASE/tomo/nudge -H "Authorization: Bearer $TOKEN"
# Expected: { "type": "...", "emoji": "...", "title": "...", "message": "..." }

# 13. Insights
curl $BASE/insights -H "Authorization: Bearer $TOKEN"
# Expected: { "insights": [...] }
```

Every endpoint must return valid JSON with correct data. If any fails, fix the backend before proceeding.

- [ ] All 13 endpoints return expected responses
- [ ] Demo account works (demo@ari.app / demo123) — create it manually if needed

---

## Phase 2: Configure Mobile App (Day 1)

### 2.1 Set Environment Variables

- [ ] Copy `.env.example` to `.env`
- [ ] Set `EXPO_PUBLIC_API_URL` to your deployed backend URL
  ```
  EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
  ```
- [ ] Set `EXPO_PUBLIC_SENTRY_DSN` (from sentry.io):
  1. Go to sentry.io -> Create Project -> React Native
  2. Copy the DSN string
  ```
  EXPO_PUBLIC_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
  ```

### 2.2 Verify Code Health

```bash
# TypeScript check (must show no errors)
npm run typecheck

# Unit tests (must show 88 passing)
npm test

# Check git status (should be clean)
git status
```

- [ ] 0 TypeScript errors
- [ ] 88 tests passing
- [ ] Git working tree is clean

---

## Phase 3: Test on Device (Day 1-2)

This is the most important phase. Do not skip any screen.

### 3.1 Start the App

```bash
# Start backend locally (if not deployed)
cd path/to/ari-backend
python app.py

# Start the mobile app
cd path/to/Ari
npm run android
# OR scan QR code with Expo Go on physical device: npm start
```

### 3.2 Test Every Screen — Mark Each as Passed

**Onboarding (first launch only)**
- [ ] 4 slides swipe correctly
- [ ] Skip button works
- [ ] "Let's Go" button on last slide works
- [ ] Does not show again after completion

**Splash Screen**
- [ ] Logo and features animate in
- [ ] "Let's Get Started" navigates to Register
- [ ] "I already have an account" navigates to Login

**Registration**
- [ ] Step 1: Name, email, password validation works
- [ ] Step 1: "Continue" disabled with empty fields
- [ ] Step 2: Age group tiles selectable
- [ ] Step 2: Income range selectable
- [ ] Step 3: Goal tiles selectable
- [ ] "Start My Journey" creates account and lands on Dashboard
- [ ] Progress bar animates between steps

**Login**
- [ ] Email/password validation works
- [ ] Wrong password shows error message
- [ ] "Try with demo account" fills demo credentials
- [ ] "Sign In" logs in and lands on Dashboard
- [ ] "Sign up free" link works

**Dashboard**
- [ ] Greeting shows correct time of day
- [ ] User name displays correctly
- [ ] Balance card shows income, expenses, balance, savings %
- [ ] Quick action buttons navigate correctly
- [ ] Nudge card displays (may need a few transactions first)
- [ ] Insights display after adding transactions
- [ ] Recent transactions list shows latest 5
- [ ] "See all" navigates to Transactions tab
- [ ] FAB button floats above tab bar (NOT behind it)
- [ ] Pull-to-refresh works
- [ ] Haptic feedback on button taps (physical device only)

**Add Transaction**
- [ ] Modal slides up from bottom
- [ ] Expense/Income toggle works
- [ ] Amount input accepts numbers
- [ ] Quick amount pills (100, 200, 500, 1K, 2K, 5K) fill amount
- [ ] Description auto-detects category (type "Zomato" -> Food)
- [ ] Category picker grid displays correctly
- [ ] Date picker opens and selects dates
- [ ] Cannot select future dates
- [ ] "Save Transaction" shows loading, then success animation
- [ ] Returns to previous screen after save
- [ ] Saved transaction appears in list

**Transactions**
- [ ] Summary pills show income vs expenses
- [ ] Transactions grouped by date (Today, Yesterday, etc.)
- [ ] Search filters transactions by description
- [ ] Filter tabs (All / Expenses / Income) work
- [ ] Delete button shows confirmation dialog
- [ ] Delete removes transaction immediately (optimistic)
- [ ] FAB floats above tab bar correctly
- [ ] Pull-to-refresh works
- [ ] Empty state shows when no transactions

**Budget**
- [ ] "+ Add" button opens modal
- [ ] Category picker in modal works
- [ ] Amount input works
- [ ] "Set Budget" saves and shows in list
- [ ] Progress bar shows correct fill and color
- [ ] Over-budget turns bar red
- [ ] Summary card shows total budgeted vs spent
- [ ] Edit budget works
- [ ] Delete budget works with confirmation
- [ ] Pull-to-refresh works

**Tomo AI**
- [ ] Header shows "Tomo — Your AI Finance Coach"
- [ ] Initial message "Namaste!" displays
- [ ] Quick prompts show for first-time users
- [ ] Tapping quick prompt sends message
- [ ] Typing indicator (bouncing dots) shows while waiting
- [ ] Tomo response appears as assistant bubble
- [ ] User messages appear as user bubble (right side)
- [ ] Keyboard input works
- [ ] Send button disabled when empty
- [ ] Clear button clears chat history
- [ ] Error message shows if backend unreachable

**Settings**
- [ ] Profile card shows name, email, avatar
- [ ] Demographics show age, income, goal
- [ ] Daily Reminders toggle works (physical device)
- [ ] Biometric Lock toggle works (physical device with fingerprint)
- [ ] Export Data -> shows export screen -> Share works
- [ ] Privacy & Security shows info dialog
- [ ] Help & Support shows FAQ dialog
- [ ] Rate Ari shows rating prompt
- [ ] About shows app info screen
- [ ] Sign Out shows confirmation -> logs out -> returns to Splash

**General**
- [ ] Tab bar icons display correctly (vector icons, not emojis)
- [ ] All screens respect safe areas (no content behind status bar or nav bar)
- [ ] No content goes behind the bottom tab bar on Android
- [ ] Dark theme is consistent across all screens
- [ ] No flashes of white/light backgrounds
- [ ] App does not crash on any screen
- [ ] Back button / gesture works correctly on all screens

### 3.3 Test Edge Cases

- [ ] Kill app and reopen — session restores (auto-login)
- [ ] Turn off WiFi — app shows cached data, doesn't crash
- [ ] Turn WiFi back on — pull-to-refresh loads fresh data
- [ ] Add transaction with very large amount (9,99,99,999) — displays correctly
- [ ] Add transaction with empty description — uses category name as fallback
- [ ] Very long transaction description — truncates with ellipsis
- [ ] Rotate device (if unlocked) — layout doesn't break
- [ ] Open keyboard on every input field — no overlap, content scrolls correctly

---

## Phase 4: App Artwork (Day 2-3)

Replace all placeholder assets with production-ready artwork.

### 4.1 Required Assets

| Asset | Size | Location | Purpose |
|-------|------|----------|---------|
| App Icon | 1024x1024 PNG | `assets/icon.png` | App icon everywhere |
| Adaptive Icon | 1024x1024 PNG | `assets/adaptive-icon.png` | Android adaptive icon (foreground) |
| Splash Icon | 200x200 PNG | `assets/splash-icon.png` | Shown during app load |
| Favicon | 48x48 PNG | `assets/favicon.png` | Web/PWA favicon |

### 4.2 Design Guidelines

- [ ] Icon should be simple, recognizable at small sizes
- [ ] Use the Ari brand color (#00C896 teal) as the primary accent
- [ ] No text in the icon (doesn't read well at small sizes)
- [ ] Suggested: a minimal sprout/leaf symbol or stylized "A"
- [ ] Background: dark (#0A0A0A) or transparent
- [ ] Test how it looks on both light and dark Android homescreens

### 4.3 Play Store Assets

| Asset | Size | Notes |
|-------|------|-------|
| Feature Graphic | 1024x500 | Shown at top of store listing |
| Phone Screenshots | 1080x1920 (min 2, max 8) | Dashboard, Tomo, Budget, Transactions |
| Short Description | Max 80 chars | "Track spending, chat with AI coach Tomo, budget like a pro" |
| Full Description | Max 4000 chars | Detailed feature list |

- [ ] Take screenshots on a clean emulator (no debug banner)
- [ ] Tip: use `npx expo start --no-dev` to remove the dev menu banner

---

## Phase 5: Build Preview APK (Day 3)

### 5.1 First Build

```bash
# Login to Expo
eas login

# Configure project (first time only)
eas build:configure

# Build preview APK for testing
eas build --platform android --profile preview
```

- [ ] Build completes successfully on EAS servers
- [ ] Download the APK from the build URL
- [ ] Install on physical device: `adb install app.apk`
- [ ] Test the critical paths again on the built APK (not Expo Go)

### 5.2 Critical Differences from Dev

Things that work differently in a built APK vs Expo Go:
- Push notifications actually deliver
- Biometric prompt appears
- App icon and splash screen show your custom assets
- Performance is better (Hermes engine)
- No Expo Go banner

- [ ] Verify push notification arrives at 8 PM
- [ ] Verify biometric lock works on app reopen
- [ ] Verify app icon looks correct on home screen
- [ ] Verify splash screen looks correct

---

## Phase 6: Beta Testing (Day 3-10)

### 6.1 Internal Testing

- [ ] Share APK with 5-10 trusted people
- [ ] Create a shared doc/chat for feedback
- [ ] Ask testers to try:
  - Register a new account
  - Add 10+ transactions over a few days
  - Set 3+ budgets
  - Chat with Tomo
  - Export their data
  - Enable/disable biometric lock
  - Use it daily for at least 3 days

### 6.2 Collect Feedback

- [ ] Log all reported bugs
- [ ] Note any confusing UX
- [ ] Track crash reports in Sentry dashboard
- [ ] Priority fix: any crash or data loss bugs
- [ ] Secondary fix: UX confusion, visual glitches

### 6.3 Fix and Rebuild

- [ ] Fix all critical bugs
- [ ] Rebuild preview APK
- [ ] Re-test with original testers
- [ ] Get "good to go" confirmation from at least 3 testers

---

## Phase 7: Production Build (Day 10-11)

### 7.1 Pre-Build Checks

```bash
# Final code health check
npm run typecheck     # 0 errors
npm test              # 88 passing
git status            # clean
```

- [ ] All beta feedback addressed
- [ ] Final artwork in place
- [ ] `.env` has production backend URL
- [ ] `.env` has production Sentry DSN
- [ ] `app.json` version is correct (1.0.0)

### 7.2 Build Production AAB

```bash
eas build --platform android --profile production
```

- [ ] Build completes successfully
- [ ] Download AAB file

---

## Phase 8: Play Store Submission (Day 11-12)

### 8.1 Create Play Store Listing

1. Go to play.google.com/console
2. Create new app
   - [ ] App name: **Ari**
   - [ ] Default language: English (India)
   - [ ] App or game: App
   - [ ] Free or paid: Free

3. Store listing
   - [ ] Short description (80 chars max)
   - [ ] Full description (4000 chars max)
   - [ ] App icon uploaded
   - [ ] Feature graphic uploaded
   - [ ] At least 2 phone screenshots uploaded
   - [ ] App category: Finance
   - [ ] Contact email set

4. Content rating
   - [ ] Complete the content rating questionnaire
   - [ ] Expected rating: Everyone

5. Privacy policy
   - [ ] Privacy policy URL set (host on a simple webpage)
   - [ ] Must mention: data collected, how it's used, third-party services (Sentry, OpenAI)

### 8.2 App Integrity & Target

- [ ] Target API level: 34 (Android 14)
- [ ] App signing: managed by Google Play (EAS handles upload key)

### 8.3 Release

1. Go to Production -> Create new release
2. Upload the AAB file from EAS build
3. Add release notes:
   ```
   Ari 1.0.0 - Your Money, Your Future

   - Smart expense tracking with auto-categorization
   - AI-powered financial coaching from Tomo
   - Budget goals with visual progress tracking
   - Monthly insights and personalized nudges
   - Dark theme, biometric lock, offline support
   - Export transactions to CSV
   ```
4. Review and roll out

- [ ] AAB uploaded
- [ ] Release notes written
- [ ] "Start rollout to Production" clicked
- [ ] Review submitted (takes 1-7 days for first app)

---

## Phase 9: Post-Launch (Day 12+)

### 9.1 Monitor

- [ ] Check Sentry dashboard daily for first week
- [ ] Check Play Store reviews daily
- [ ] Monitor backend server health/uptime
- [ ] Monitor API response times

### 9.2 Quick Fixes

- [ ] Set up Sentry alerts for new errors (email or Slack)
- [ ] Keep a hotfix branch ready
- [ ] Know how to push an emergency update:
  ```bash
  git tag v1.0.1
  git push origin v1.0.1
  # CI/CD will auto-build and submit
  ```

### 9.3 Growth

- [ ] Share app link with friends and family
- [ ] Post on social media
- [ ] Ask happy users to rate on Play Store
- [ ] Plan v1.1 features based on feedback

---

## Summary Timeline

| Day | Phase | What to Do |
|-----|-------|-----------|
| 1 | Backend | Deploy, test all 13 endpoints |
| 1 | Config | Set .env, verify typecheck + tests |
| 1-2 | Device Test | Run on emulator/device, test every screen |
| 2-3 | Artwork | Create app icon, splash, screenshots |
| 3 | Preview Build | `eas build --profile preview`, install APK |
| 3-10 | Beta Test | 5-10 testers, collect feedback, fix bugs |
| 10-11 | Production | Final checks, `eas build --profile production` |
| 11-12 | Submit | Play Store listing, upload AAB, submit review |
| 12+ | Post-Launch | Monitor Sentry, reviews, iterate |

---

*This checklist was created for Ari v1.0.0. Update it as the app evolves.*
