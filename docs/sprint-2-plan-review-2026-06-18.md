# Ari — Sprint 2 Plan & Spec Review

**Sprint:** "Fast Entry + Forest Reskin"
**Branch:** `sprint-2-fast-entry` (to be cut from `master`)
**Lane:** Mobile only (`ejjy/Ari` + backend `ejjy/ari-backend`). Web lane (`Pinegrass/aritomo-web`) untouched.
**Reviewer:** Mobile dev (Pinegrass)
**Date:** 2026-06-18
**Status:** Plan approved through Commit 1. Awaiting go to write code.

---

## 1. Executive summary

The Sprint 2 spec is a strong product direction: make logging a transaction a two-tap, sub-3-second, offline-first action, and reskin to a locked forest-on-cream design system. The design system is genuinely good and does not read as AI-generated.

Three of the spec's stated premises did not match the actual code on disk and were corrected during review. One product decision (deleting the existing voice + AI entry flow) was overridden in favor of a hybrid. The approved visual prototype (`ari-v2-forest.html`) turned out to be a Home *teardown*, not a recolor, which materially changes the scope of the first commit.

All blocking decisions are now resolved. Commit 1 (tokens + fonts + Home reskin) is fully specified and ready to build.

---

## 2. Decisions locked (with rationale)

| ID | Decision | Choice | Why |
|----|----------|--------|-----|
| **D1** | Fast-entry architecture | **Keypad-first, keep voice/AI** | The numeric keypad becomes the default sub-3s happy path. The existing voice input + MerchantDB + Gemini AI parse is preserved behind the optional description/note chip. We keep a built differentiator for near-zero added cost instead of deleting working code. |
| **D2** | Visual source of truth | **Use `ari-v2-forest.html`, then build** | The prototype was not in the repo. It has now been provided and will be committed to `docs/`. Building from an approved artifact beats re-deriving layout from prose. |
| **D3** | Home scope for Commit 1 | **Match the prototype, keep old tabs as a safety net** | The prototype Home is a heavy simplification. We strip Home to match it, but leave the existing bottom tab bar functional so relocated features (Budgets, Accountant, Settings) stay reachable until the later nav/FAB commit. |

---

## 3. Corrected spec premises

The spec was written against an outdated mental model of the codebase. Corrections:

1. **There is no indigo to remove.** The spec's "old indigo gradient was the slop tell" and its grep-and-kill instruction for `#6366F1` find nothing. `src/constants/colors.ts` is already a dark forest-teal theme (`background #061313`, `primary #00C896`). The real migration is a **dark-to-light inversion**, not an indigo cleanup.

2. **"Token swap only, no layout change" understates the work.** A dark-to-light inversion flips every shadow, contrast assumption, and the status bar (`App.tsx` hardcodes `StatusBar style="light"`, invisible on cream). The "no gradients" rule also removes four live `expo-linear-gradient` components: `BalanceCard`, `CoachingBriefCard` (both on Home), `SplashScreen`, `OnboardingScreen`.

3. **The approved prototype is a Home teardown.** `ari-v2-forest.html` Home = date eyebrow → greeting → flat forest hero → one "Add an entry" CTA → Tomo card → Recent list. The current `DashboardScreen.tsx` additionally has a 4-tile Quick Actions grid, `GroupBalanceCard`, `NudgeCard`, an Accountant banner, a To-Do banner, and a Monthly Insights block. Matching the prototype means dropping all of those from Home (they relocate later, not deleted).

**Missing dependencies** (all need install, none blocking):
- `@expo-google-fonts/fraunces`, `@expo-google-fonts/inter` (only `expo-font` is present)
- `expo-sqlite` (P0 for offline store)
- `@react-native-community/netinfo` (P0 for sync engine)

**Money-model contradiction:** the prototype keypad includes a `.` decimal key with en-IN decimal handling, but the app is integer-rupee only (no paise). The `.` key should be dropped on the React Native keypad. (Add screen, Commit 3.)

---

## 4. Product position: do not gut the entry flow

The spec's §2 audit describes `AddTransactionScreen` as "create-only." That is true regarding *edit*, but the screen already does far more than the audit admits. Today it includes:

- Voice input (`useVoiceInput`, mic streams into the description field)
- A MerchantDB fast-path + keyword detector + Gemini AI parse with a confidence sheet (`handleDescriptionChange`)
- Quick-amount buttons and quick-add templates

The code comments label these "the core differentiator." The spec proposed deleting all of it for a bare keypad.

**Resolution (D1):** the amount-first keypad instinct is correct for the target user (a homeowner logging "spent 500" wants one number and a save button). We keep the keypad as the default happy path, and preserve voice + AI parse behind the optional description chip ("+ Note" becomes "+ Note / mic"). When used, it runs the pipeline that already exists and auto-fills the category. We retain the moat at near-zero engineering cost.

---

## 5. Design system (LOCKED)

Forest-on-cream. Verified against the prototype's `:root` block — exact hex match. Single source of truth will be `src/theme/tokens.ts`. No inline hex anywhere else.

### Color tokens
```
forest      #1F3D2B   brand ink, primary actions, hero, Tomo mark
forest2     #2E5239   "received", secondary action
forestDeep  #152A1E   headings, toast bg
moss        #5C7A63   muted secondary text/links
cream       #F4EFE3   app background (paper)
cream2      #EDE7D7   sunk panels, pressed states, segment track
card        #FBF8F0   raised cards, keypad keys
line        #E0D8C4   hairlines
lineStrong  #CFC5AC   stronger borders
ink         #23291F   primary text on cream
inkSoft     #6E6B5C   secondary text
inkFaint    #9A9683   tertiary/captions (decoration only — see risks)
clay        #B4612F   spending accent + Add FAB
clayTint    #F0E2D2
gold        #A8862C   single sparing highlight (Tomo glint, insight tags) — never a fill
```

### Type
- **Display / numbers / headings:** Fraunces (400–600)
- **Body / labels / captions:** Inter (400–700)
- **Scale:** hero amount 54, add-screen amount 60, screen title 16, section head 17, body 13.5, caption 12, eyebrow 11 (700, letter-spacing .18em, uppercase)

### Hard rules (the anti-slop guardrails)
1. No gradients anywhere. Every surface is a flat field.
2. Warm paper, never pure white. Background `cream`, cards `card`. No `#FFFFFF`.
3. Forest is structural, clay is for spending/Add, gold appears at most twice per screen as an accent, never a fill.
4. Minimal shadows. Prefer 1px hairline borders over drop shadows. Soft shadow only on the FAB.

This direction passes the AI-slop checklist: real display typeface (not system-ui), no purple/indigo, no gradients, no uniform bubbly radius, no centered-everything, cards earn their place.

---

## 6. Design risks / fixes (not ports)

Two patterns in the current code are on the AI-slop blacklist and must be fixed during the reskin, not recolored:

- **Colored left-border rows.** `DashboardScreen.tsx` insight rows use `borderLeftWidth: 3` with a status color. This is a known slop tell. Drop it.
- **Low-contrast captions.** `inkFaint #9A9683` on `cream #F4EFE3` is likely below 3:1. Target users skew older and often outdoors. Use `inkSoft #6E6B5C` for any caption that is actual reading text; reserve `inkFaint` for pure decoration.

---

## 7. Commit sequencing (whole sprint)

The whole sprint lands as **one squash-merged PR** (per the spec's discipline section), so a mixed dark/light look on un-migrated screens mid-sprint never ships to users.

| # | Commit | Scope | Risk |
|---|--------|-------|------|
| 0 | Branch + artifact | Cut `sprint-2-fast-entry`; commit `ari-v2-forest.html` to `docs/` | None |
| 1 | **Tokens + fonts + Home reskin** | `theme/tokens.ts`, font loading, Home teardown to prototype | Low–Med |
| 2 | Local SQLite store | `expo-sqlite`, DataContext reads from local store first | **High** |
| 3 | Fast Entry Add screen | Keypad-first flow + voice/AI optional chip, writes to local store | Med |
| 4 | Sync engine + NetInfo | `src/lib/syncEngine.ts`, flush on reconnect/foreground, backoff | **High** |
| 5 | Edit path | `updateTransaction` API + backend `PUT /transactions/:id` + DataContext optimistic update + edit-mode UI | Med |
| 6 | Reskin remaining screens | Trends, Coach, Budget, Savings + nav/FAB restructure | Med |
| 7 | Codex audit + sprint report | `docs/sprint-2-report-<date>.md` | None |

**Heaviest, riskiest item:** Commit 2/4 (offline-first SQLite store + background sync engine). This is a from-scratch persistence + sync layer with last-write-wins conflict handling and client-side UUIDs reconciled by a backend upsert. It supersedes the existing AsyncStorage layer (`src/hooks/useOfflineCache.ts`). This must be planned explicitly, not freestyled.

---

## 8. Commit 1 — detailed file list

**New file**
- `src/theme/tokens.ts` — locked `color` + `font` + `type` exports (see §5). Single source of truth.

**Edited files**
- `package.json` — `npx expo install @expo-google-fonts/fraunces @expo-google-fonts/inter`
- `App.tsx` — `useFonts({ Fraunces_500Medium, Fraunces_600SemiBold, Inter_400/500/600/700Regular… })`, gate render until `fontsLoaded`; flip `StatusBar` to `dark`.
- `src/screens/DashboardScreen.tsx` — rebuild to the prototype layout: date eyebrow, Fraunces greeting, hero, full-width "Add an entry" CTA (forest2), Tomo card, "Recent" + rows. Remove from this screen: Quick Actions grid, Accountant/To-Do banners, `GroupBalanceCard`, `NudgeCard`, Insights. (They remain in the codebase, reachable via existing tabs.)
- `src/components/BalanceCard.tsx` → **"Spent today" hero**: flat forest block, Fraunces 54 amount, three pills (Money out / Money in / Net today), two faint concentric-circle ornaments. Remove `LinearGradient`. Fed by today's totals derived client-side from `transactions` filtered to today (the current `summary` is monthly).
- `src/components/TransactionItem.tsx` — reskin to the prototype row: cream2 emoji tile, ink title, inkFaint "Category · time" subline, Fraunces signed amount (out = ink, in = forest2), hairline divider.
- `src/components/CoachingBriefCard.tsx` — reskin to the prototype Tomo card: flat `card` surface, hairline border, forest Tomo glyph with gold dot, gold eyebrow tag. Remove `LinearGradient`.

**Explicitly NOT in Commit 1**
- Add screen + keypad (Commit 3)
- Bottom-nav restructure + center clay FAB (own commit)
- SQLite + sync (Commit 2/4)
- `colors.ts` stays until later screens migrate screen-by-screen

**Information-architecture note:** Matching the prototype reframes the hero from *Balance* (monthly net + income/expenses/savings-rate) to *"Spent today"* (today's spend, with Money out / Money in / Net today pills). This is a behavior + data change, not paint, and uses plain-language copy ("Money out" not "Expenses").

---

## 9. Open items for CTO attention

1. **Offline/sync architecture (Commit 2/4)** is the real engineering risk of this sprint. Recommend a dedicated design pass before building: SQLite schema, `sync_status` lifecycle (`synced`/`pending`/`failed`), client UUID + backend upsert contract, last-write-wins on `updated_at`, and how it supersedes `useOfflineCache`.
2. **Backend dependency for Commits 4–5:** the offline sync and edit path both need backend work (`PUT /transactions/:id`, upsert-on-UUID, amount-bounds validation). Sequence the backend PR alongside.
3. **Integer-rupee vs decimal:** confirm we are dropping the keypad `.` key and staying integer-INR (recommended; matches existing model).
4. **Nav restructure timing:** the prototype implies a 5-slot bottom nav (Home / Trends / FAB / Tomo / More) that differs from the current tabs (Dashboard / Transactions / Budget / Tomo / Settings). Decide which sprint owns the relocation of Budgets/Accountant/Insights into the new nav.
5. **OTA delivery:** Sprint 1 shipped a working OTA pipeline (vc5). Most of this sprint is JS-only and can ship as an OTA hotfix after a QA-clean gate; native dep additions (`expo-sqlite`) force a new store build, so plan one native build this sprint.

---

## 10. Definition of done (from spec, unchanged)

A user can open the app with no network, log a Spent or Received entry in under 3 seconds, edit it afterward, and see it sync automatically when connectivity returns — all rendered in the new forest-on-cream design system.
