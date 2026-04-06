# Ari - Complete App Guide

**Your Money, Your Future**

Ari is a world-class personal finance app built for India. It combines smart expense tracking, AI-powered coaching from Tomo, and beautiful dark-themed UI into one production-ready mobile experience.

---

## Table of Contents

1. [App Features](#app-features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup Checklist](#setup-checklist)
5. [Running Locally](#running-locally)
6. [Testing](#testing)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Building for Production](#building-for-production)
9. [Publishing to Stores](#publishing-to-stores)
10. [Environment Variables](#environment-variables)
11. [Troubleshooting](#troubleshooting)

---

## App Features

### Authentication
- [x] Email/password login
- [x] 3-step registration (credentials, demographics, financial goal)
- [x] Demo account for instant testing (demo@ari.app / demo123)
- [x] Token-based auth with Bearer headers
- [x] Auto-restore session from AsyncStorage
- [x] Secure logout with confirmation dialog

### Dashboard
- [x] Time-based greeting (morning/afternoon/evening)
- [x] Balance card with income, expenses, balance, savings rate %
- [x] 4 quick action buttons (Add Expense, Add Income, Budgets, Ask Tomo)
- [x] Tomo AI nudge card with personalized message
- [x] Up to 3 monthly insights (warning/tip/positive) with color coding
- [x] Recent 5 transactions with inline display
- [x] Pull-to-refresh
- [x] Floating action button for quick expense entry

### Transaction Management
- [x] Add expense or income with amount, description, category, date, note
- [x] Auto-category detection from description (25+ Indian brand keywords)
  - Zomato/Swiggy -> Food, Uber/Ola -> Transport, Amazon/Flipkart -> Shopping, etc.
- [x] Quick amount buttons (100, 200, 500, 1K, 2K, 5K)
- [x] Date picker (max = today)
- [x] 8 expense categories: Food, Transport, Shopping, Entertainment, Health, Housing, Education, Other
- [x] 5 income categories: Salary, Freelance, Investment, Gift, Other
- [x] Success animation after save
- [x] Transaction list grouped by date (Today, Yesterday, date string)
- [x] Search by description, category, or note
- [x] Filter by All / Expenses / Income
- [x] Delete with confirmation dialog
- [x] Optimistic delete (instant UI update, rollback on failure)

### Budget System
- [x] Create, edit, delete category budgets
- [x] Monthly budgets with spending limit
- [x] Animated progress bar (green -> yellow at 80% -> red at 100%+)
- [x] Spent amount, percentage, and remaining display
- [x] Summary card (total budgeted vs total spent)
- [x] Over-budget warning with count
- [x] Color-coded by category

### Tomo AI Coach
- [x] Chat interface with user and assistant bubbles
- [x] 6 quick prompts for new users:
  - "How much did I spend this month?"
  - "Am I saving enough?"
  - "Tips to reduce food expenses?"
  - "How to start investing in India?"
  - "Help me create a budget plan"
  - "What is SIP and how to start?"
- [x] Typing indicator with bouncing dots animation
- [x] Last 8 messages kept for context
- [x] Clear chat button
- [x] Error fallback message on connection failure

### Settings
- [x] Profile card with name, email, avatar initial
- [x] Demographics display (age group, income bracket, main goal)
- [x] Daily reminders toggle (push notifications at 8 PM)
- [x] Biometric lock toggle (fingerprint/face unlock)
- [x] Export Data (CSV via Share API)
- [x] Privacy & Security info
- [x] Help & Support with FAQ
- [x] Rate Ari (links to store)
- [x] About screen (app info, Tomo intro, feature list)
- [x] Sign Out with confirmation

### Onboarding
- [x] 4-slide swipeable tutorial (first-time users only)
- [x] Parallax animations on slide transitions
- [x] Animated dot indicators
- [x] Skip button
- [x] Shown once, persisted via AsyncStorage

### Security
- [x] Biometric authentication (fingerprint/face unlock via expo-local-authentication)
- [x] Lock screen when biometric is enabled
- [x] Token stored securely in AsyncStorage
- [x] 401 auto-logout on expired tokens

### Offline & Performance
- [x] Offline caching with 30-minute TTL (transactions, summary, budgets, nudge, insights)
- [x] Falls back to cached data when network fails
- [x] Optimistic transaction delete
- [x] Animated entries (fade-in + slide-up) on all screens
- [x] Breathing pulse FAB animation
- [x] useMemo/useCallback for expensive computations
- [x] Safe area-aware FAB positioning (never overlaps tab bar)

### Accessibility
- [x] accessibilityLabel on all buttons and interactive elements
- [x] accessibilityRole (button, link, tab) on all TouchableOpacity
- [x] Proper vector icons (Feather + MaterialCommunityIcons) instead of emojis
- [x] Screen reader compatible navigation

### Crash Reporting & Analytics
- [x] Sentry integration (@sentry/react-native)
- [x] ErrorBoundary wrapping entire app
- [x] User context tracking on login
- [x] Breadcrumbs for navigation
- [x] Performance monitoring
- [x] Dev/prod environment separation

### Design System
- [x] Dark theme (#0A0A0A background, #1A1A2E cards)
- [x] Primary color: #00C896 (teal/green)
- [x] Danger: #FF4757, Accent: #FFD93D, Purple: #7C5CBF
- [x] Consistent spacing via Layout constants
- [x] Haptic feedback on all interactions (light, medium, success, warning, error)
- [x] Indian Rupee formatting (en-IN locale, no decimals)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo | 54 |
| Runtime | React Native | 0.81.5 |
| UI | React | 19.1.0 |
| Language | TypeScript | 5.9 (strict mode) |
| Navigation | React Navigation | v6 (stack + bottom tabs) |
| Icons | @expo/vector-icons | Feather + MaterialCommunityIcons |
| Storage | AsyncStorage | Tokens, cache, preferences |
| Auth | expo-local-authentication | Biometric lock |
| Notifications | expo-notifications | Daily reminders |
| Animations | react-native-reanimated | 3.10 |
| Gradients | expo-linear-gradient | Splash, onboarding |
| Haptics | expo-haptics | Tactile feedback |
| Crash Reporting | @sentry/react-native | Error tracking |
| Testing | Jest + jest-expo + Testing Library | 88 unit tests |
| E2E Testing | Maestro | 6 flow files |
| CI/CD | GitHub Actions + EAS Build | 3 workflows |

---

## Project Structure

```
Ari/
├── App.tsx                          # Root: Sentry.wrap + ErrorBoundary + providers
├── index.ts                         # Expo entry point
├── app.json                         # Expo config (dark UI, bundle IDs, plugins)
├── eas.json                         # EAS Build profiles (dev/preview/prod)
├── jest.config.js                   # Jest configuration
├── jest.setup.js                    # Test mocks for Expo modules
├── babel.config.js                  # Babel + module resolver
├── tsconfig.json                    # TypeScript strict config
├── .env.example                     # Environment variable template
├── ARI_APP_GUIDE.md                 # This file
│
├── src/
│   ├── api/                         # Backend API layer
│   │   ├── client.ts                # Fetch wrapper with Bearer auth + error handling
│   │   ├── auth.ts                  # login, register, getMe
│   │   ├── transactions.ts          # CRUD + summary
│   │   ├── budgets.ts               # CRUD
│   │   ├── tomo.ts                  # chat, nudge, insights
│   │   └── __tests__/client.test.ts # API client tests
│   │
│   ├── components/
│   │   ├── BalanceCard.tsx           # Gradient balance display
│   │   ├── BudgetCard.tsx            # Budget item with progress bar
│   │   ├── CategoryPicker.tsx        # Grid category selector
│   │   ├── ChatBubble.tsx            # Chat message bubble
│   │   ├── DeleteConfirmSheet.tsx    # Confirmation modal
│   │   ├── ErrorBoundary.tsx         # React error boundary + Sentry
│   │   ├── NudgeCard.tsx             # Tomo nudge display
│   │   ├── QuickAmounts.tsx          # Quick amount pills
│   │   ├── TransactionItem.tsx       # Transaction list row
│   │   ├── TypeToggle.tsx            # Expense/Income switcher
│   │   ├── __tests__/               # Component tests
│   │   └── ui/
│   │       ├── AnimatedEntry.tsx     # Fade-in + slide-up wrapper
│   │       ├── AnimatedFAB.tsx       # Floating action button with safe area
│   │       ├── Button.tsx            # Primary/secondary/ghost/danger + a11y
│   │       ├── Card.tsx              # Simple card wrapper
│   │       ├── EmptyState.tsx        # No-data state with CTA
│   │       ├── ErrorBanner.tsx       # Red alert banner
│   │       ├── Icon.tsx              # Unified icon system (Feather + MCI)
│   │       ├── Input.tsx             # Text input with password toggle
│   │       ├── LoadingSpinner.tsx    # Activity indicator
│   │       └── ProgressBar.tsx       # Animated budget progress bar
│   │
│   ├── config/
│   │   └── sentry.ts                # Sentry init, captureError, user context
│   │
│   ├── constants/
│   │   ├── categories.ts            # 8 expense + 5 income categories
│   │   ├── colors.ts                # Color tokens
│   │   └── layout.ts                # Spacing constants
│   │
│   ├── context/
│   │   ├── AuthContext.tsx           # User login/register/logout + token
│   │   └── DataContext.tsx           # Transactions, budgets, Tomo, offline cache
│   │
│   ├── hooks/
│   │   ├── useBiometric.ts          # Fingerprint/face unlock
│   │   ├── useCurrentMonth.ts       # YYYY-MM format
│   │   ├── useHaptics.ts            # Vibration feedback
│   │   ├── useNotifications.ts      # Push notifications + daily reminders
│   │   ├── useOfflineCache.ts       # AsyncStorage cache with TTL
│   │   └── __tests__/               # Hook tests
│   │
│   ├── navigation/
│   │   ├── AuthNavigator.tsx         # Splash -> Login -> Register
│   │   ├── MainNavigator.tsx         # Bottom tabs + AddTransaction modal
│   │   ├── RootNavigator.tsx         # Onboarding + biometric + auth routing
│   │   └── navigationTypes.ts        # TypeScript navigation types
│   │
│   ├── screens/
│   │   ├── AboutScreen.tsx           # App info + features
│   │   ├── AddTransactionScreen.tsx  # Transaction form
│   │   ├── BudgetScreen.tsx          # Budget management
│   │   ├── DashboardScreen.tsx       # Home screen
│   │   ├── ExportScreen.tsx          # CSV export via Share
│   │   ├── LoginScreen.tsx           # Email/password login
│   │   ├── OnboardingScreen.tsx      # 4-slide tutorial
│   │   ├── RegisterScreen.tsx        # 3-step registration
│   │   ├── SettingsScreen.tsx        # Settings + sub-screens
│   │   ├── SplashScreen.tsx          # Landing page
│   │   ├── TomoScreen.tsx            # AI chat interface
│   │   └── TransactionsScreen.tsx    # Transaction list
│   │
│   ├── types/
│   │   └── index.ts                  # All TypeScript interfaces
│   │
│   └── utils/
│       ├── autoDetectCategory.ts     # Keyword -> category mapping
│       ├── dateHelpers.ts            # Date formatting + grouping
│       ├── formatCurrency.ts         # Indian Rupee formatting
│       └── __tests__/                # Utility tests
│
├── .github/workflows/
│   ├── ci.yml                        # TypeScript + tests + lint on PR
│   ├── eas-build.yml                 # EAS Build on push/tag
│   └── maestro-e2e.yml              # Nightly E2E tests
│
├── .maestro/                         # Maestro E2E flow files
│   ├── login_flow.yaml
│   ├── add_transaction_flow.yaml
│   ├── budget_flow.yaml
│   ├── tomo_chat_flow.yaml
│   ├── navigation_flow.yaml
│   └── export_flow.yaml
│
└── assets/
    ├── icon.png
    ├── splash-icon.png
    ├── adaptive-icon.png
    └── favicon.png
```

---

## Setup Checklist

### Prerequisites

- [ ] **Node.js 20+** installed (`node --version`)
- [ ] **npm 9+** installed (`npm --version`)
- [ ] **Git** installed
- [ ] **Expo CLI** (`npm install -g expo-cli` or use `npx expo`)
- [ ] **EAS CLI** (`npm install -g eas-cli`) for building
- [ ] **Android Studio** with an emulator OR a physical Android device
- [ ] **Xcode** (macOS only, for iOS development)

### Backend Setup

- [ ] Flask backend deployed and running (separate repository)
- [ ] Backend API endpoints available:
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /auth/me`
  - `GET /transactions?month=YYYY-MM`
  - `POST /transactions`
  - `DELETE /transactions/:id`
  - `GET /transactions/summary?month=YYYY-MM`
  - `GET /budgets?month=YYYY-MM`
  - `POST /budgets`
  - `DELETE /budgets/:id`
  - `POST /tomo/chat`
  - `GET /tomo/nudge`
  - `GET /insights`

### Environment Setup

- [ ] Copy `.env.example` to `.env`
- [ ] Set `EXPO_PUBLIC_API_URL` to your backend URL
  - Android emulator: `http://10.0.2.2:5000/api`
  - Physical device: `http://YOUR_LOCAL_IP:5000/api`
  - Production: `https://your-api.com/api`
- [ ] Set `EXPO_PUBLIC_SENTRY_DSN` (get from sentry.io)
  - Create a Sentry project (React Native)
  - Copy the DSN string

### Project Setup

- [ ] Clone the repository
- [ ] Run `npm install --legacy-peer-deps`
- [ ] Verify TypeScript: `npm run typecheck`
- [ ] Verify tests: `npm test`

### Android Emulator (for local development)

- [ ] Open Android Studio
- [ ] Go to Device Manager -> Create Virtual Device
- [ ] Select Pixel 6 (or similar), API 34, x86_64
- [ ] Start the emulator
- [ ] Run `npm run android`

### Expo Account (for building)

- [ ] Create account at expo.dev
- [ ] Run `eas login`
- [ ] Run `eas build:configure` (if first time)

### GitHub Setup (for CI/CD)

- [ ] Push repository to GitHub
- [ ] Add repository secret: `EXPO_TOKEN` (from expo.dev -> Access Tokens)
- [ ] CI will automatically run on push/PR

### Sentry Setup

- [ ] Create project at sentry.io (platform: React Native)
- [ ] Copy DSN to `.env` as `EXPO_PUBLIC_SENTRY_DSN`
- [ ] Sentry auto-initializes on app start (dev events are logged locally, not sent)

### Push Notifications

- [ ] Notifications work on physical devices only (not emulators)
- [ ] Users enable via Settings -> Daily Reminders toggle
- [ ] Reminders fire at 8 PM daily

### Biometric Auth

- [ ] Requires device with fingerprint sensor or face unlock
- [ ] Users enable via Settings -> Biometric Lock toggle
- [ ] App prompts on launch when enabled

---

## Running Locally

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start Metro bundler
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run TypeScript check
npm run typecheck

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## Testing

### Unit Tests (88 tests, 7 suites)

| Suite | Tests | Covers |
|-------|-------|--------|
| formatCurrency | 9 | Zero, small, lakhs, negatives, decimals, full format |
| autoDetectCategory | 33 | All 12 categories, Indian brands, type switching |
| dateHelpers | 12 | Month format, date format, Today/Yesterday, grouping |
| useOfflineCache | 4 | Cache hit, miss, expiry, clear |
| API client | 6 | GET, auth token, 400/401/500, JSON parsing |
| Button | 8 | Variants, loading, disabled, press handling |
| Input | 6 | Label, placeholder, error, password toggle |

```bash
npm test                    # Run all tests
npm run test:coverage       # With coverage report
npm run test:watch          # Watch mode
```

### E2E Tests (6 Maestro flows)

| Flow | User Journey |
|------|-------------|
| login_flow | Splash -> demo account -> Dashboard |
| add_transaction_flow | Add expense with auto-category |
| budget_flow | Create food budget |
| tomo_chat_flow | Quick prompt -> AI response |
| navigation_flow | All 5 tabs verification |
| export_flow | Settings -> Export -> CSV screen |

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all flows
maestro test .maestro/

# Run specific flow
maestro test .maestro/login_flow.yaml
```

---

## CI/CD Pipeline

### ci.yml (runs on every push/PR)
1. TypeScript type check
2. 88 unit tests with coverage report
3. Lint check

### eas-build.yml (runs on push to main or version tags)
- **Push to main** -> Preview APK build
- **Tag `v*`** -> Production AAB build + Play Store submit
- **Manual dispatch** -> Choose platform + profile

### maestro-e2e.yml (nightly at 2 AM UTC)
- Spins up Android emulator
- Builds dev APK
- Runs all 6 Maestro flows

### Required GitHub Secrets

| Secret | Where to Get It |
|--------|----------------|
| `EXPO_TOKEN` | expo.dev -> Settings -> Access Tokens |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play Console -> API Access |

---

## Building for Production

```bash
# Login to EAS
eas login

# Build preview APK (for testing)
eas build --platform android --profile preview

# Build production AAB (for Play Store)
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Build for both platforms
eas build --platform all --profile production
```

---

## Publishing to Stores

### Google Play Store

- [ ] Create Google Play Console account ($25 one-time fee)
- [ ] Create app listing (title, description, screenshots, icon)
- [ ] Generate signing key (EAS handles this automatically)
- [ ] Create service account for automated uploads
- [ ] Save `google-service-account.json` in project root
- [ ] Run `eas build --platform android --profile production`
- [ ] Run `eas submit --platform android`
- [ ] Or: push a git tag `v1.0.0` to trigger automatic build + submit

### Apple App Store

- [ ] Apple Developer Program membership ($99/year)
- [ ] Create App ID in Apple Developer portal
- [ ] Create app listing in App Store Connect
- [ ] Configure in `eas.json`:
  - `appleId`: Your Apple ID email
  - `ascAppId`: App Store Connect app ID
  - `appleTeamId`: Your team ID
- [ ] Run `eas build --platform ios --profile production`
- [ ] Run `eas submit --platform ios`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API base URL |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Sentry crash reporting DSN |

---

## Troubleshooting

### "Network request failed" on Android emulator
- Use `http://10.0.2.2:5000/api` as the API URL (not localhost)
- Make sure Flask backend is running on port 5000

### Metro bundler issues
```bash
npx expo start --clear    # Clear Metro cache
```

### TypeScript errors after install
```bash
npm run typecheck          # Check for errors
```

### Tests failing
```bash
npm test -- --no-cache     # Clear Jest cache
```

### Haptics not working on emulator
- Haptics only work on physical devices
- The app gracefully handles this (no crashes)

### Push notifications not showing
- Must use a physical device
- Check Settings -> Daily Reminders is enabled
- Android: check notification permissions in device settings

### Biometric not available
- Requires physical device with fingerprint/face unlock hardware
- Must have at least one fingerprint/face enrolled in device settings
- Toggle won't appear in Settings if hardware is unavailable

### EAS Build fails
```bash
eas build --platform android --profile preview --clear-cache
```

### "Cannot find module" errors
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/register` | Register with demographics |
| GET | `/auth/me` | Get current user (requires token) |
| GET | `/transactions?month=YYYY-MM` | List month's transactions |
| POST | `/transactions` | Add transaction |
| DELETE | `/transactions/:id` | Delete transaction |
| GET | `/transactions/summary?month=YYYY-MM` | Monthly summary |
| GET | `/budgets?month=YYYY-MM` | List month's budgets |
| POST | `/budgets` | Create/update budget |
| DELETE | `/budgets/:id` | Delete budget |
| POST | `/tomo/chat` | Chat with Tomo AI |
| GET | `/tomo/nudge` | Get personalized nudge |
| GET | `/insights` | Get monthly insights |

---

*Built with Expo, React Native, and TypeScript. Powered by Tomo AI.*
