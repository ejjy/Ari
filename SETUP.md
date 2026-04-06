# Ari Mobile — Setup Guide & Launch Checklist

## Prerequisites

Before you begin, make sure you have these installed:

- [ ] **Node.js** v18+ — https://nodejs.org
- [ ] **Git** — https://git-scm.com
- [ ] **Android Studio** (for Android emulator) — https://developer.android.com/studio
- [ ] **Python 3.9+** (for Flask backend) — https://python.org
- [ ] **Expo Go app** on your physical Android device (optional but recommended)

---

## Part 1 — Backend Setup

### Step 1: Navigate to the backend
```bash
cd "C:\Users\Augustus Rex\Projects\Ari\ari-backend"
```

### Step 2: Create a Python virtual environment
```bash
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
```

### Step 3: Install Python dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Set environment variables
Create a `.env` file in `ari-backend/`:
```
SECRET_KEY=your-strong-secret-key-here-change-this
OPENAI_API_KEY=sk-your-openai-api-key-here
```

> **Important:** Never commit `.env` to git. The `SECRET_KEY` must be a long random string in production.

### Step 5: Start the backend
```bash
python app.py
```

You should see:
```
* Running on http://0.0.0.0:5000
```

### Step 6: Verify the backend works
Open a browser or use curl:
```
http://localhost:5000/api/health
```
Expected response: `{ "status": "healthy" }`

---

## Part 2 — Mobile App Setup

### Step 7: Navigate to the mobile project
```bash
cd "C:\Users\Augustus Rex\Projects\ari-mobile"
```

### Step 8: Install dependencies
```bash
npm install
```

### Step 9: Configure your API URL

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` and set your backend URL:

**Option A — Android Emulator (local backend on your PC):**
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

**Option B — Physical Android device on same WiFi:**
```
EXPO_PUBLIC_API_URL=http://YOUR_PC_LOCAL_IP:5000/api
```
Find your PC's local IP: run `ipconfig` on Windows, look for IPv4 Address (e.g. `192.168.1.5`)

**Option C — Deployed/remote backend:**
```
EXPO_PUBLIC_API_URL=https://your-server.com/api
```

### Step 10: Set up Android emulator (if not already done)
1. Open **Android Studio**
2. Go to **Device Manager** (right sidebar or Tools menu)
3. Click **Create Device**
4. Choose **Pixel 7** (or any phone), click Next
5. Download and select **API Level 34** (Android 14), click Next → Finish
6. Click the **Play ▶** button to start the emulator
7. Wait for it to fully boot to the home screen

---

## Part 3 — Running the App

### Step 11: Start Expo
```bash
cd "C:\Users\Augustus Rex\Projects\ari-mobile"
npm run android
```

First run takes 2–5 minutes to build. Subsequent runs are much faster.

### Step 12: Verify it works
- [ ] Splash screen animates in with logo and feature list
- [ ] Tap "Let's Get Started" → reaches Register screen
- [ ] Tap "I already have an account" → reaches Login screen
- [ ] Register a new account → lands on Dashboard
- [ ] Dashboard shows balance card and quick actions

---

## Part 4 — Full Feature Checklist

Test every feature before releasing:

### Authentication
- [ ] Register with a new email
- [ ] Login with existing account
- [ ] Try wrong password → shows error message
- [ ] Logout from Settings → returns to Splash
- [ ] Close and reopen app → stays logged in (token persists)

### Transactions
- [ ] Add an expense — type amount, select category, tap Save
- [ ] Auto-category detection — type "Zomato" → Food auto-selects
- [ ] Auto-category detection — type "Uber" → Transport auto-selects
- [ ] Auto-category detection — type "Salary" → switches to Income
- [ ] Quick amount pills work (₹100, ₹500, etc.)
- [ ] Change the date using native date picker
- [ ] Save → success animation → returns to previous screen
- [ ] New transaction appears in Transactions tab
- [ ] New transaction appears in Dashboard recent list
- [ ] Delete transaction → confirmation sheet appears
- [ ] Confirm delete → transaction is removed
- [ ] Search transactions by description
- [ ] Filter by Expense / Income
- [ ] Transactions grouped by date with headers
- [ ] Pull-to-refresh updates list

### Dashboard
- [ ] Balance card shows correct income / expenses / balance
- [ ] Savings rate % is calculated correctly
- [ ] Tomo nudge card appears
- [ ] Monthly insights appear
- [ ] Quick action buttons navigate correctly
- [ ] "See all →" goes to Transactions tab
- [ ] FAB (+ button) opens AddTransaction
- [ ] Pull-to-refresh updates all data

### Budget
- [ ] Create a budget for a category
- [ ] Progress bar animates to correct percentage
- [ ] Edit a budget → updates in list
- [ ] Delete a budget → removed from list
- [ ] Over-budget shows red progress bar + warning
- [ ] Pull-to-refresh updates budgets

### Tomo AI Chat
- [ ] Initial greeting message shows
- [ ] Quick prompt buttons are visible on first open
- [ ] Tapping a quick prompt sends it and gets a reply
- [ ] Typing a message and pressing Send works
- [ ] Typing indicator (3 bouncing dots) shows while waiting
- [ ] Messages scroll to bottom automatically
- [ ] Clear chat resets to initial greeting
- [ ] Chat history is maintained during the session

### Settings
- [ ] Profile card shows your name and email
- [ ] Age group, income, and goal display correctly
- [ ] Sign Out shows confirmation alert
- [ ] Confirming logout returns to Splash screen

### Navigation
- [ ] All 5 bottom tabs navigate correctly
- [ ] AddTransaction opens as a slide-up modal
- [ ] Modal can be dismissed with Cancel button
- [ ] Back gestures work on Android

### Native Features
- [ ] Haptic feedback fires when tapping FAB
- [ ] Haptic feedback fires on successful save
- [ ] Haptic feedback fires on delete warning
- [ ] Pull-to-refresh works on Dashboard, Transactions, Budget
- [ ] Keyboard does not cover input fields on all form screens
- [ ] Safe area respected (no content under notch/status bar)
- [ ] Date picker works natively on Android

---

## Part 5 — Before Publishing to Play Store

### Code & Security
- [ ] Set a strong `SECRET_KEY` in backend (not the default)
- [ ] Restrict CORS in `app.py` to your production domain only
- [ ] Set `OPENAI_API_KEY` environment variable on your server
- [ ] Move backend to a proper server (not localhost)
- [ ] Set `EXPO_PUBLIC_API_URL` to your production backend URL
- [ ] Add rate limiting to `/api/auth/login` and `/api/auth/register`
- [ ] Replace file-based `ari_data.json` with PostgreSQL

### App Store Assets
- [ ] App icon (1024×1024 PNG) — replace `assets/icon.png`
- [ ] Splash screen image — replace `assets/splash-icon.png`
- [ ] Adaptive icon for Android — replace `assets/adaptive-icon.png`
- [ ] Set correct `android.package` in `app.json` (e.g. `com.yourname.ari`)
- [ ] Set correct `ios.bundleIdentifier` in `app.json`
- [ ] Update `version` in `app.json` before each release

### Build for Play Store
```bash
# Install EAS CLI (Expo Application Services)
npm install -g eas-cli

# Login to your Expo account (create free at expo.dev)
eas login

# Configure the build
eas build:configure

# Build Android APK for testing
eas build --platform android --profile preview

# Build Android AAB for Play Store submission
eas build --platform android --profile production
```

### Legal (Required for India/App Stores)
- [ ] Privacy Policy page (required by Play Store)
- [ ] Terms of Service page
- [ ] Add links to both in Settings screen
- [ ] Data deletion request process (PDPB requirement)

---

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `Network request failed` | Backend not running, or wrong IP in `.env` |
| `10.0.2.2` not working | Use your PC's local IP if on a physical device |
| App crashes on start | Check Metro bundler terminal for red error |
| Emulator won't start | Check Android Studio → SDK Manager → install missing SDK |
| `Metro Bundler` port conflict | Run `npx expo start --port 8082` |
| Haptics not felt | Haptics only work on physical devices, not emulators |
| Date picker doesn't appear | Tap the date row (the whole row is the trigger) |
| Login says "Request failed" | Check backend is running on port 5000 |
| Tomo chat fails | Check `OPENAI_API_KEY` in backend `.env` |

---

## Project Structure (Quick Reference)

```
ari-mobile/
├── App.tsx                    ← Entry point
├── .env                       ← Your API URL (not committed to git)
├── src/
│   ├── screens/               ← 9 app screens
│   ├── components/            ← Reusable UI components
│   ├── context/               ← Auth + Data state management
│   ├── api/                   ← All backend API calls
│   ├── navigation/            ← Stack + Tab navigators
│   ├── constants/             ← Colors, categories, layout
│   ├── hooks/                 ← useHaptics, useCurrentMonth
│   ├── utils/                 ← formatCurrency, autoDetectCategory
│   └── types/                 ← TypeScript interfaces

ari-backend/
├── app.py                     ← Flask API (570 lines)
├── requirements.txt           ← Python dependencies
└── ari_data.json              ← Data storage (replace with DB for production)
```

---

## Useful Commands

```bash
# Start the app on Android
npm run android

# Start Expo dev server only (scan QR with Expo Go)
npm start

# Clear Expo cache if things look broken
npx expo start --clear

# Check for TypeScript errors
node node_modules/typescript/bin/tsc --noEmit

# Start Flask backend
cd "../Ari/ari-backend" && python app.py
```
