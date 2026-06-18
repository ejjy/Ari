# Ari — Project Specs & Developer Reference

## Overview
Ari is a personal finance management app for Indian users (salaried + freelancers). React Native/Expo frontend with a Flask backend. AI-powered financial coaching via Google Gemini 2.5 Flash.

## Quick Start

### Frontend (Expo)
```bash
cd C:\Users\Augustus Rex\Projects\Workex\Ari
npm start            # Expo dev server
npm run android      # Android dev
npm test             # Jest tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

### Backend (Flask)
```bash
cd backend
py app.py            # Dev server on :5000
# Requires: .env with SECRET_KEY, GEMINI_API_KEY, and Supabase keys
# (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DATABASE_URL).
# Falls back to sqlite:///ari_dev.db when no DB URL is set. See backend/config.py.
```

### Build & Deploy
```bash
# Android APK (preview)
npx eas build --platform android --profile preview

# OTA update (no rebuild needed for JS changes)
npx eas update --branch preview --message "description"

# Backend auto-deploys on git push to master (Railway)
cd backend && git push origin master
```

---

## Architecture

### Frontend
- **Framework**: React Native 0.81.5 + Expo SDK 54 + TypeScript 5.9
- **Navigation**: React Navigation v6 (Stack + Bottom Tabs)
- **State**: React Context (AuthContext, DataContext)
- **Styling**: StyleSheet.create (no external CSS-in-JS)
- **New Architecture**: Enabled (Fabric + TurboModules) — required by Reanimated 4.x. Razorpay autolinking disabled via `react-native.config.js` (paywall flag-gated off in v1)
- **Edge-to-edge**: Enabled on Android
- **OTA Updates**: expo-updates configured (runtimeVersion: appVersion). Wired and live — `App.tsx` calls `checkAndApplyUpdate()` on launch (`src/lib/otaUpdates.ts`: `checkForUpdateAsync` → `fetchUpdateAsync` → `reloadAsync`). Shipped in v1.0.1 (versionCode 5).
- **Auth/Backend client**: Supabase (`@supabase/supabase-js`) for the auth session + token refresh; Google Sign-In via `@react-native-google-signin/google-signin`

### Backend
- **Framework**: Flask 3.1 + SQLAlchemy 2.0 (ORM maps to the Supabase Postgres schema)
- **Database**: Supabase PostgreSQL (canonical; URL precedence SUPABASE_DATABASE_URL → DATABASE_URL → SQLite local)
- **Auth**: **Supabase** — auth.users owns the password hash. `token_required` accepts both Supabase ES256 JWTs (verified via JWKS) and a still-active legacy HS256 path; register/login proxy to Supabase. bcrypt/hash_password removed. See `backend/auth_helpers.py`.
- **AI**: Google Gemini 2.5 Flash via google-genai SDK (exclusively — no OpenAI)
- **Hosting**: Railway (auto-deploy from GitHub master)
- **WSGI**: Gunicorn with 2 workers

### Repo Structure
- Frontend: local only (no git remote) at `C:\Users\Augustus Rex\Projects\Workex\Ari`
- Backend: `github.com/ejjy/ari-backend` (master branch) at `Ari/backend/`
- Backend is a separate git repo nested inside the frontend directory

---

## Tech Stack

### Frontend Dependencies
| Package | Purpose |
|---------|---------|
| expo ~54.0.34 | Core framework |
| react-native 0.81.5 | Mobile runtime |
| @react-navigation/native ^6.1.18 | Navigation |
| @react-navigation/stack ^6.4.1 | Stack navigator |
| @react-navigation/bottom-tabs ^6.6.1 | Tab navigator |
| react-native-reanimated ~4.1.1 | Animations |
| react-native-gesture-handler ~2.28.0 | Gestures |
| react-native-safe-area-context ~5.6.0 | Safe area |
| react-native-screens ~4.16.0 | Native screens |
| @react-native-async-storage/async-storage 2.2.0 | Local storage |
| expo-secure-store ^55.0.13 | Secure token storage (JWT) |
| @supabase/supabase-js ^2.103.3 | Auth + session/token refresh (`src/lib/supabase.ts`, `src/api/client.ts`) |
| @react-native-google-signin/google-signin ^16.1.2 | Google Sign-In (`src/lib/socialAuth.ts`; google-services.json present) |
| expo-speech-recognition ^3.1.2 | Voice expense entry (`src/hooks/useVoiceInput.ts`; app.json plugin) |
| posthog-react-native ^4.43.0 | Analytics (`src/lib/analytics.ts`) — NO-OP in v1 (EXPO_PUBLIC_POSTHOG_KEY unset) |
| react-native-razorpay ^2.3.1 | Payments — installed but de-linked for New Arch via `react-native.config.js`; paywall flag-gated off (`src/screens/PaywallScreen.tsx`, EXPO_PUBLIC_PAYWALL_ENABLED) |
| expo-auth-session / expo-web-browser ~7.0 / ~15.0 | OAuth support libs |
| expo-crypto ~15.0.9 | Crypto primitives |
| expo-device ~8.0.10 | Device info (push notifications) |
| expo-haptics ~15.0.8 | Haptic feedback |
| expo-local-authentication ~17.0.8 | Biometric auth |
| expo-notifications ~0.32.17 | Push notifications |
| expo-updates ~29.0.17 | OTA updates (wired — `src/lib/otaUpdates.ts`, called from `App.tsx`) |
| @sentry/react-native ~7.2.0 | Error tracking |

### Backend Dependencies
| Package | Purpose |
|---------|---------|
| Flask 3.1.0 | Web framework |
| Flask-CORS 5.0.1 | Cross-origin |
| Flask-SQLAlchemy 3.1.1 | ORM |
| SQLAlchemy 2.0.36 | Database toolkit |
| psycopg2-binary 2.9.10 | PostgreSQL driver |
| PyJWT 2.10.1 | JWT tokens |
| bcrypt 4.2.1 | Password hashing |
| google-genai | Gemini AI SDK |
| gunicorn 23.0.0 | Production WSGI |

---

## Design System

### Colors (Dark Theme)
```
Primary:       #00C896 (teal green)
PrimaryDark:   #00A07A
PrimaryLight:  #4ECDC4
Background:    #0A0A0A (near black)
Card:          #1A1A2E (dark navy)
Card2:         #1E2040
Input:         #252545
Border:        #2A2A4A
TextPrimary:   #E8E8F0
TextSecondary: #8A8AB0
TextMuted:     #5A5A80
Accent:        #FFD93D (gold)
Danger:        #FF4757 (red)
Orange:        #FF6B35
Purple:        #7C5CBF
Teal:          #4ECDC4
```

### Typography
- Headers: fontWeight '700'-'800', fontSize 16-22
- Body: fontSize 13-14
- Labels: fontSize 10-12, textTransform uppercase

### Currency
- Indian Rupee (₹) with en-IN locale formatting
- Integer amounts only (no decimal paise)

### UI Patterns
- Bottom sheet modals with borderTopRadius: 24, safe area bottom padding
- AnimatedEntry for staggered fade-in animations
- Pull-to-refresh on all list screens
- Haptic feedback on user actions (light/medium/success/warning/error)
- FAB (Floating Action Button) on Dashboard for quick add

---

## Navigation Structure

```
RootNavigator (Stack)
├── Auth (Stack)
│   ├── Splash
│   ├── Login
│   └── Register
└── Main (Stack)
    ├── Tabs (BottomTab)
    │   ├── Dashboard (Home)
    │   ├── Transactions (Expenses)
    │   ├── Budget
    │   ├── Tomo (AI Coach)
    │   └── Settings
    ├── AddTransaction (modal)
    ├── Accountant (hub)
    ├── SmartLedger
    ├── BudgetPlanner
    ├── SavingsGoals
    ├── TaxEstimator
    ├── PnlReport
    └── TodoNotes
```

---

## API Endpoints

### Base URL
- Production: `https://web-production-7c65f.up.railway.app/api`
- Local dev: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, returns JWT |
| GET | /auth/me | Get current user |
| DELETE | /auth/account | Delete account (requires password) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /transactions?month=YYYY-MM | List transactions |
| POST | /transactions | Create transaction |
| DELETE | /transactions/:id | Delete transaction |
| GET | /transactions/summary?month=YYYY-MM | Monthly summary |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /budgets?month=YYYY-MM | List budgets |
| POST | /budgets | Create/update budget |
| DELETE | /budgets/:id | Delete budget |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | List user categories (auto-seeds defaults) |
| POST | /categories | Create custom category |
| PUT | /categories/:id | Update category |
| DELETE | /categories/:id | Delete custom category |

### Savings Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /savings-goals | List all goals |
| POST | /savings-goals | Create goal |
| PUT | /savings-goals/:id | Update goal |
| POST | /savings-goals/:id/contribute | Add contribution |
| DELETE | /savings-goals/:id | Delete goal |

### Tax Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tax-profile | Get saved profile |
| POST | /tax-profile | Upsert profile |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /reports/pnl?months=N | P&L report |
| GET | /reports/category-trends?category=X&months=N | Category trend |

### To-Do Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /todos | List all notes |
| POST | /todos | Create note |
| PUT | /todos/:id | Update note |
| DELETE | /todos/:id | Delete note |

### Tomo AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tomo/chat | Send message to Tomo |
| GET | /tomo/nudge | Get financial nudge |
| GET | /insights | Get monthly insights |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /feedback | Submit feedback |
| POST | /parse/expense | AI expense parsing (Gemini, schema-enforced, PII-scrubbed) |
| * | /groups/* | Shared / split group expenses (+ UPI settlement) |
| * | /billing/* | Razorpay subscriptions (503 when not configured; paywall off in v1) |
| * | /coaching/* | AI coaching briefs (latest + internal weekly-brief trigger) |
| * | /aa/* | Account Aggregator (gated by SETU_ENABLED) |
| GET | /legal/* | Public privacy policy + terms (no auth) |
| GET | /health | Health check |

> Full route details (methods, params, auth) live in `backend/CLAUDE.md`.

---

## Database Models

> ORM classes map to the Supabase schema (`User`→`ari_users`, `Transaction`→`expenses`, `Budget`→`budgets`, `SavingsGoal`→`goals`, …). IDs are UUID strings. No `password_hash` on User (Supabase auth.users owns it). See `backend/models.py`.

### User (`ari_users`)
id (UUID), name, email, phone, currency, monthly_income, tier, aa_consent, aa_linked_at, age_group, income_bracket, main_goal, role, expo_push_token, push_notifications_enabled, razorpay_customer_id, razorpay_subscription_id, subscription_status, tier_valid_until, upi_vpa, created_at, updated_at — **no password_hash**

### Transaction (`expenses`)
id, user_id, amount, type (expense/income), category, description, note, date, month (derived), merchant, merchant_id, entry_type, raw_input, parse_source, confidence, account_id, is_recurring, recurrence_rule, tags, income_source, parent_recurring_id, created_at

### Budget
id, user_id, category, limit_amount, month, icon, color, created_at (unique: user_id+category+month)

### SavingsGoal
id, user_id, name, target_amount, current_amount, target_date, icon, color, is_completed, created_at, updated_at

### TaxProfile
id, user_id (unique), financial_year, regime, annual_salary, freelance_income, other_income, hra_received, rent_paid, metro_city, section_80c, section_80d, home_loan_interest, other_deductions, gst_registered

### UserCategory
id, user_id, name, type, emoji, color, is_default, sort_order, created_at (unique: user_id+name+type)

### TodoNote
id, user_id, title, body, is_done, priority (low/medium/high), due_date, due_time, color, pinned, created_at, updated_at

### Additional models
BudgetRollover, Feedback, CoachingCache (weekly/monthly briefs), SubscriptionEvent (Razorpay audit), AAConsent (Account Aggregator), and shared-expense models (ExpenseGroup, ExpenseGroupMember, ExpenseGroupInvite, SharedExpense, SharedExpenseSplit). See `backend/CLAUDE.md` for fields.

---

## Frontend File Structure

```
src/
├── api/                    # API client & endpoint functions
│   ├── client.ts           # apiRequest<T>() generic, token management
│   ├── auth.ts             # login, register, getMe
│   ├── transactions.ts     # CRUD transactions
│   ├── budgets.ts          # CRUD budgets
│   ├── categories.ts       # CRUD user categories
│   ├── savingsGoals.ts     # CRUD savings goals
│   ├── taxProfile.ts       # Get/save tax profile
│   ├── reports.ts          # P&L report, category trends
│   ├── todos.ts            # CRUD to-do notes
│   ├── tomo.ts             # Chat, nudge
│   ├── feedback.ts         # Submit feedback
│   └── account.ts          # Delete account
├── components/
│   ├── ui/                 # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Icon.tsx        # Lucide-style SVG icons (60+ icons)
│   │   ├── AnimatedEntry.tsx
│   │   ├── AnimatedFAB.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ProgressBar.tsx
│   ├── BalanceCard.tsx     # Dashboard balance display
│   ├── BudgetCard.tsx      # Budget progress card
│   ├── CategoryPicker.tsx  # Category selection (supports custom categories)
│   ├── ChatBubble.tsx      # Tomo chat message
│   ├── DeleteConfirmSheet.tsx  # Reusable delete confirmation modal
│   ├── ErrorBoundary.tsx   # App-level error boundary
│   ├── NudgeCard.tsx       # Dashboard nudge card
│   ├── QuickAmounts.tsx    # Quick amount buttons
│   ├── TransactionItem.tsx # Transaction list item
│   └── TypeToggle.tsx      # Expense/Income toggle
├── constants/
│   ├── colors.ts           # Design system colors
│   ├── categories.ts       # Default categories + buildCategoryList()
│   └── layout.ts           # Layout constants
├── context/
│   ├── AuthContext.tsx      # Auth state, login/logout/register
│   └── DataContext.tsx      # All data state (transactions, budgets, goals, categories, chat)
├── hooks/
│   ├── useBiometric.ts     # Biometric auth hook
│   ├── useCurrentMonth.ts  # Current month YYYY-MM
│   ├── useHaptics.ts       # Haptic feedback (light/medium/success/warning/error)
│   ├── useNotifications.ts # Push notification setup
│   └── useOfflineCache.ts  # AsyncStorage offline caching
├── navigation/
│   ├── navigationTypes.ts  # Type definitions for all navigators
│   ├── AuthNavigator.tsx   # Splash → Login → Register
│   ├── MainNavigator.tsx   # Tabs + Stack screens
│   └── RootNavigator.tsx   # Auth vs Main based on login state
├── screens/
│   ├── DashboardScreen.tsx     # Home: balance, quick actions, nudge, banners, recent txns
│   ├── TransactionsScreen.tsx  # Full transaction list with filters
│   ├── AddTransactionScreen.tsx # Add expense/income (modal)
│   ├── BudgetScreen.tsx        # Budget list + add/edit modal
│   ├── TomoScreen.tsx          # AI chat with quick prompts
│   ├── SettingsScreen.tsx      # Settings hub (categories, feedback, delete account, about)
│   ├── AccountantScreen.tsx    # Accountant hub (5 module cards)
│   ├── TodoNotesScreen.tsx     # To-do notes with filters, priorities, colors
│   ├── ManageCategoriesScreen.tsx  # Custom category management
│   ├── AboutScreen.tsx         # App info
│   ├── ExportScreen.tsx        # Data export
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── SplashScreen.tsx
│   ├── OnboardingScreen.tsx
│   └── accountant/
│       ├── SmartLedgerScreen.tsx    # Enhanced transactions with filters
│       ├── BudgetPlannerScreen.tsx  # Budgets with rollover
│       ├── SavingsGoalsScreen.tsx   # Goal CRUD + contribute + progress
│       ├── TaxEstimatorScreen.tsx   # Indian tax calculator (FY 2025-26)
│       └── PnlReportScreen.tsx     # P&L charts + category breakdown
├── types/
│   └── index.ts            # All TypeScript interfaces
└── utils/
    ├── formatCurrency.ts   # ₹ formatting with en-IN locale
    ├── dateHelpers.ts      # Date utilities
    ├── autoDetectCategory.ts  # AI-like category detection from description
    └── taxCalculator.ts    # Indian tax calculation (old/new regime, 80C/80D, HRA, GST)
```

---

## Backend File Structure

```
backend/
├── app.py              # Flask app factory, blueprint registration, migrations
├── config.py           # Config from env vars (SECRET_KEY, DATABASE_URL, GEMINI_API_KEY)
├── models.py           # SQLAlchemy models (User, Transaction, Budget, SavingsGoal, TaxProfile, UserCategory, TodoNote)
├── auth_helpers.py     # @token_required decorator, JWT validation
├── seed.py             # Database seed script
├── requirements.txt    # Python dependencies
├── Procfile            # Gunicorn start command
├── railway.json        # Railway deploy config
├── .env.example        # Environment variables template
└── routes/
    ├── __init__.py         # Blueprint exports
    ├── auth.py             # Register, login, me, delete account
    ├── transactions.py     # CRUD transactions + summary
    ├── budgets.py          # CRUD budgets
    ├── categories.py       # CRUD categories (auto-seeds defaults)
    ├── savings_goals.py    # CRUD goals + contribute
    ├── tax_profile.py      # Get/upsert tax profile
    ├── reports.py          # P&L aggregation, category trends
    ├── todos.py            # CRUD to-do notes
    ├── tomo.py             # Gemini AI chat + nudge + insights
    └── feedback.py         # User feedback
```

---

## Tax Calculator (FY 2025-26)

### New Regime Slabs
| Income Range | Rate |
|-------------|------|
| 0 - 4L | 0% |
| 4L - 8L | 5% |
| 8L - 12L | 10% |
| 12L - 16L | 15% |
| 16L - 20L | 20% |
| 20L - 24L | 25% |
| 24L+ | 30% |

### Old Regime Slabs
| Income Range | Rate |
|-------------|------|
| 0 - 2.5L | 0% |
| 2.5L - 5L | 5% |
| 5L - 10L | 20% |
| 10L+ | 30% |

### Deductions Supported
- Standard Deduction: ₹75,000 (new) / ₹50,000 (old)
- Section 80C: up to ₹1,50,000
- Section 80D: health insurance
- HRA Exemption: min(HRA received, rent - 10% salary, 50%/40% salary)
- Home Loan Interest: Section 24
- 4% Health & Education Cess
- Surcharge on high incomes
- GST estimation for freelancers

---

## Tomo AI Coach

### Capabilities
- Personal finance Q&A using user's actual data
- Indian finance expertise (PPF, NPS, ELSS, SIP, mutual funds, tax regimes)
- Budget advice and spending pattern analysis
- Savings goal tracking insights
- Tax optimization suggestions

### Restrictions
- Finance-only: declines non-financial questions
- Casual greeting style (Hey/Hi, never Namaste)
- Handles no-data scenarios gracefully (guides user to add income/transactions)
- Max 800 output tokens, temperature 0.7
- Last 8 messages of chat history sent for context

---

## Environment Variables

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=https://web-production-7c65f.up.railway.app/api
EXPO_PUBLIC_SENTRY_DSN=<sentry-dsn>
EXPO_PUBLIC_SUPABASE_URL=<supabase-url>            # auth/session
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-oauth-client-id>  # Google Sign-In
EXPO_PUBLIC_PAYWALL_ENABLED=false                   # Razorpay paywall off in v1
EXPO_PUBLIC_POSTHOG_KEY=<unset in v1 → analytics no-op>
```

### Backend (.env)
```
SECRET_KEY=<legacy-HS256-secret>   # INSECURE default "dev-secret-change-me" — override!
GEMINI_API_KEY=<google-gemini-key>
CORS_ORIGIN=*
SENTRY_DSN=<sentry-dsn>            # optional
# Supabase (canonical data + auth)
SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DATABASE_URL=postgresql://...   # preferred; else DATABASE_URL; else sqlite local
# Razorpay (optional; billing returns 503 when unset)
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET / RAZORPAY_PLAN_ID_*
```

### EAS Environment (preview)
```
SENTRY_AUTH_TOKEN=<sentry-token>
APP_VARIANT=preview
```

---

## Deployment

### Backend (Railway)
- **URL**: https://web-production-7c65f.up.railway.app
- **GitHub**: github.com/ejjy/ari-backend (master branch)
- **Auto-deploy**: Enabled (master branch connected to production)
- **Region**: asia-southeast1 (Singapore)
- **Database**: Supabase PostgreSQL (canonical; via SUPABASE_DATABASE_URL). Auth via Supabase.

### Frontend (EAS Build)
- **EAS Project**: pinegrass-tech/ari
- **Project ID**: ae18eabf-124f-4b0a-a09e-a2a40dfb473b
- **Android Package**: com.pinegrass.ari
- **iOS Bundle ID**: com.pinegrass.ari
- **Preview Profile**: APK (internal distribution)
- **Production Profile**: AAB (Play Store)
- **OTA Updates**: Configured via expo-updates

---

## Expense Categories (Default)
| Category | Emoji | Type |
|----------|-------|------|
| food | 🍜 | expense |
| transport | 🚗 | expense |
| shopping | 🛍️ | expense |
| entertainment | 🎬 | expense |
| health | 💊 | expense |
| housing | 🏠 | expense |
| education | 📚 | expense |
| savings | 🎯 | expense |
| other | 📦 | expense |
| salary | 💰 | income |
| freelance | 💻 | income |
| investment | 📈 | income |
| gift | 🎁 | income |
| other | 📦 | income |

Users can add custom categories with custom emoji and color.

---

## Testing

### Demo Credentials
- Email: `demo@ari.app`
- Password: `demo123`

### Test Commands
```bash
npm test                 # Run all Jest tests
npm run test:coverage    # Coverage report
npm run typecheck        # TypeScript validation
```

### Test Files
- `src/api/__tests__/client.test.ts`
- `src/components/__tests__/Button.test.tsx`
- `src/components/__tests__/Input.test.tsx`
- `src/hooks/__tests__/useOfflineCache.test.ts`
- `src/utils/__tests__/autoDetectCategory.test.ts`
- `src/utils/__tests__/dateHelpers.test.ts`
- `src/utils/__tests__/formatCurrency.test.ts`

---

## Key Conventions

1. **API Pattern**: All API calls use `apiRequest<T>(path, options)` from `src/api/client.ts`. JWT token auto-attached from SecureStore.
2. **Auth Flow**: Supabase auth. The Supabase access token (ES256 JWT) is stored in expo-secure-store under key `ari_token` (Keychain on iOS, KeyStore + EncryptedSharedPreferences on Android) via the `secureStorage` adapter in `src/lib/secureStorage.ts`. `src/api/client.ts` refreshes it via `supabase.auth.refreshSession()`. Google Sign-In (`src/lib/socialAuth.ts`) persists the same Supabase session token. The adapter transparently migrates legacy AsyncStorage values on first read; the backend still accepts legacy HS256 tokens.
3. **Data Flow**: DataContext provides all data + methods. Components use `useData()` hook.
4. **Month Format**: `YYYY-MM` string used consistently for month-based queries.
5. **Currency**: Always integer amounts in INR. Formatted with `formatCurrency()`.
6. **Safe Area**: All modal bottom sheets use `useSafeAreaInsets()` for bottom padding.
7. **Haptics**: useHaptics() hook — light (tap), medium (FAB), success, warning, error.
8. **Icons**: Custom Icon component with 60+ Lucide-style SVG paths. Use `IconName` type.
9. **Animations**: AnimatedEntry wraps elements for staggered fade-in with delay prop.
10. **Backend Blueprint Pattern**: Each route file exports a Blueprint with `url_prefix="/api"`.
11. **Auth Decorator**: `@token_required` passes `current_user` (the `ari_users` row) as first arg to route handlers. Accepts both Supabase ES256 and legacy HS256 tokens.
12. **No OpenAI**: App exclusively uses Google Gemini 2.5 Flash. No OpenAI dependency.
