# Sprint 1 Report — Ari Mobile P1 Native Build (v1.0.1)

> **Status:** ✅ CLOSED — shipped to Google Play **Production, 100% rollout** (India).
> **Report date:** 2026-06-11
> **Author:** Claude Code (with CTO Rex at every phase gate)

---

## 1. Sprint goal (one line)
Ship **Ari v1.0.1 / versionCode 5** to Google Play Production, whose structural value is **enabling OTA updates** for all future JS/TS hotfixes, plus four post-audit code fixes — and verify the OTA pipeline works end-to-end.

**Result: achieved.** v1.0.1 is live; OTA delivery verified (provisional, native layer); the auth fix rode along natively.

---

## 2. Phases completed (two working sessions, EAS-outage interregnum)

| Phase | Outcome | When |
|-------|---------|------|
| Pre-flight | Surfaced that Phase 1 code already existed uncommitted; accepted | Day 1 (2026-06-08) |
| 1 — Code | ✅ Done — OTA wiring + DataContext hardening (+ auth fix added Day 2) | Day 1 |
| 2 — Build | ✅ Done — after vc3 collision recovery, vc4 built | Day 1 |
| 3 — QA + OTA gate | ⏸️ Blocked Day 1 (EAS Update outage) → ✅ **PASS (provisional)** Day 2 | Day 1 → Day 2 (2026-06-11) |
| 4 — Submission | ✅ Done — vc5 promoted to Production, **100% rollout** | Day 2 |

The sprint paused at a clean checkpoint Day 1 evening (EAS Update outage blocking the OTA gate) and resumed Day 2 (2026-06-11) once EAS recovered. A resumption checklist (`docs/sprint-1-resumption-checklist.md`) carried context across the gap.

---

## 3. Code changes summary

Three commits on `master` (frontend repo `ejjy/Ari`):

| Commit | Title | Files | LOC |
|--------|-------|-------|-----|
| `1d2b8d0` | feat(mobile): v1.0.1 — OTA wiring + DataContext hardening | App.tsx, app.json, src/context/DataContext.tsx, **src/lib/otaUpdates.ts** (new) | +125 / −21 |
| `d10ba3a` | build(eas): autoIncrement android versionCode to prevent vc collisions | eas.json | +4 / −2 |
| `31bf571` | fix(auth): /auth/me refreshes and retries on 401 instead of forcing logout | src/api/client.ts, src/api/__tests__/client.test.ts | +55 / −3 |

**What shipped (4 fixes + 1 infra):**
1. **OTA update-check wiring** — `src/lib/otaUpdates.ts` (cold-start `checkAndApplyUpdate`, apply-on-background `registerOtaReloadHandler`, silent-failure no-ops, Sentry breadcrumbs). The structural value of the build.
2. **`Promise.all` → `Promise.allSettled` + `finally`** in DataContext `fetchAll`/`refresh` — spinner always clears on partial fetch failure.
3. **Optimistic-delete rollback** moved to local-closure snapshot — fixes the concurrent-delete race.
4. **`/auth/me` refresh-on-401** — protected auth routes now refresh+retry instead of forcing logout on token expiry (parallel-agent work, folded in natively).
5. **(infra)** `autoIncrement: true` on both android profiles in `eas.json` — durable fix for the versionCode collision class.

Verification at close: `typecheck` clean · `lint` 0 errors / 28 (pre-existing) warnings · **tests 187/187** (186 → 187, +1 auth regression test).

---

## 4. Build artifacts — three EAS builds

| Build ID | versionCode | Outcome |
|----------|-------------|---------|
| `f68dc92c-e688-42f5-9e70-78ec606e2cc7` | 3 ❌ | **Cancelled** mid-build — caught vc3 collision (autoIncrement not yet configured) |
| `6f4fb866-b32a-4eca-b8bf-8df7570b90ab` | 4 | **Finished** — passed the OTA gate (3.3) on Day 2; later consumed by the Internal testing track, so not the shipped artifact. AAB: `ari-v1.0.1-vc4-production-2026-06-08.aab` |
| `4c5060bf-c53a-4948-b6b2-b7e73e92ac5a` | **5** | **Finished & SHIPPED** — auth fix included; promoted to Production. AAB: `ari-v1.0.1-vc5-production-2026-06-11.aab` (64,309,341 B, PK + BUNDLE-METADATA verified) |

All builds: Version 1.0.1, Runtime 1.0.1, Channel `production`, Keystore **`kbPfFmViIz`** (unchanged since v1.0.0). Each successful build ~23 min wall-clock. No vc6 was ever built (Promote, not rebuild — see §8).

> Note: the OTA gate was verified on **vc4**; **vc5** ships with byte-identical OTA wiring plus the auth fix, re-QA'd on the Internal testing track (Phase C smoke — all passed).

---

## 5. QA results

### 3A — Smoke (on internal-track installs, Play-signed `27:AC`)
All passed across the vc4 and vc5 internal-track installs: cold launch (no crash), session persistence, add transaction, **delete transaction** (exercises the rollback fix), background/foreground, airplane-mode failure handling (spinner clears — exercises the `allSettled` fix), **fresh Google Sign-In**, Tomo chat incl. prompt-injection stays on-topic. vc5 additionally smoke-tested the `/auth/me` path — no regressions.

> Two brief-checklist items were found to assume **non-existent features** and were dropped: "edit transaction" (no such feature — followup #6) and "swipe-to-delete" (delete is trash-tap / long-press, not swipe — followup #7).

### 3B — OTA dry-run (the structural gate)
- **Day 1:** two publish attempts blocked by an **EAS Update asset-processing outage** (one 52-min hang, one explicit "asset processing timed out"). Sprint paused. (followup #8)
- **Day 2:** EAS recovered. No-op publish succeeded in ~97 s → group **`7ea979a8-1f62-4a7e-80bb-a00a2981c802`**, runtime 1.0.1, on the `production` branch.
- **Device observation:** native expo-updates lifecycle confirmed via **process-ID swap** — `Update available` (16:35:10, PID 12941) → `No update available` on new PIDs (17475 @16:42, 18957 @16:45), i.e. the device detected, applied (reload), and stabilized on the new bundle. Zero errors.

---

## 6. OTA gate verdict
**PASS (provisional).** Native OTA delivery is verified end-to-end on a real device. **Caveat (followup #10):** logcat alone can't confirm whether *our* `otaUpdates.ts` JS wiring drove the delivery or whether expo-updates' native auto-check did — our Sentry breadcrumbs don't surface in logcat. The structural question ("does OTA delivery work on v1.0.1?") is demonstrably answered; the JS-wiring attribution is a Sprint 2 investigation. Per CTO decision this is non-blocking.

---

## 7. Play submission status
- **vc5 promoted** from Internal testing → Production (no rebuild).
- Release: **1.0.1 (5)**, India only.
- **Rollout: 100%** (see §8 deviation note).
- **Live signal:** Sentry shows **zero issues** in the first hour post-release; **46 users** in India on v1.0.1. CTO decision: let it ride at 100%.

---

## 8. Issues encountered & how resolved

1. **Pre-flight state mismatch.** Phase 1 code already existed uncommitted (prior session). Verified faithful to spec + green; accepted rather than rewritten.
2. **vc3 collision.** First build baked versionCode 3 (== live). Root cause: `appVersionSource: remote` with no `autoIncrement`. Cancelled mid-build; added `autoIncrement: true` (`d10ba3a`) → clean 4→5 bumps thereafter. (followup #5)
3. **Stale-CLI gotchas.** eas-cli 20.0.0 has no `version:set --value` and no `build --auto-increment`; the brief's commands were from older CLIs. Resolved via `eas.json` `autoIncrement`. (followup #5a)
4. **Internal App Sharing signature gotcha.** IAS re-signs APKs with a *third* key (`22:22:FD:69…`, CN=Android Debug) that isn't in Firebase → Google Sign-In failed on the IAS install. The EAS AAB itself was correctly upload-signed (`3E:B5…`); production uses Play App Signing (`27:AC…`, registered). **Recovery: switched QA to the Internal *testing* track** (Play-signed `27:AC`) → Google Sign-In works, production-faithful.
5. **EAS Update asset-processing outage (Day 1).** Blocked the OTA gate twice. Caught cleanly with a 3-min bounded `--json` publish (turned a 52-min hang into an attributable error). Paused the sprint at a clean checkpoint; resolved next session. (followup #8)
6. **Parallel-agent scope discipline.** On resumption, an overnight `/auth/me` refresh fix (Rex's parallel agent) appeared uncommitted in the tree — would have contaminated the OTA no-op dry-run. **Stashed** to keep the dry-run a true no-op; later folded into the vc5 build natively.
7. **vc4 → vc5.** vc4 was consumed by the Internal testing track; rather than ship vc4, we rebuilt vc5 with the auth fix folded in (one build, both goals).
8. **Promote blocked by stale draft.** Promoting vc5 Internal → Production initially appeared unavailable. An incorrect "track-locking" hypothesis was **caught at the gate** before burning a vc6 rebuild; the real cause was a **stale Production draft release** blocking Promote. Rex deleted it → Promote available → vc5 shipped. **No vc6 built.** (followup #11)

### Deviation: 100% rollout vs planned 20% staged
The plan called for a 20% staged rollout. The **Promote flow defaulted to 100%**, and the CTO elected to **let it ride** based on (a) **zero Sentry issues** in the first hour and (b) a **small blast radius (46 users, India only)**. Conscious, signal-backed decision — recorded here transparently.

---

## 9. Followups filed → `docs/sprint-1-followups.md`

| # | Item | Status |
|---|------|--------|
| 1 | OTA apply-on-background (vs brief's apply-on-active) | CLOSED — blessed as intentional improvement |
| 2 | `backend` submodule dirty pointer | Weekend triage (not actioned) |
| 3 | `CLAUDE.md` uncommitted | Separate commit later (out of scope) |
| 4 | Expo package version deltas | Informational |
| 5 | versionCode autoIncrement (5a: stale `version:set` syntax; 5b: **DONE** `d10ba3a`) | 5b CLOSED / 5a open note |
| 6 | Brief 3A asked for non-existent "edit transaction" | CLOSED — informational |
| 7 | Brief 3A mentioned non-existent swipe-to-delete | CLOSED — informational |
| 8 | EAS Update asset-processing outage | RESOLVED 2026-06-11 |
| 10 | OTA wiring observability gap (native vs our JS) | Sprint 2 investigation |
| 11 | Play Promote-release flow (stale drafts block Promote) | CLOSED — lesson |

*(No #9 was assigned.)*

---

## 10. Recommended next-sprint candidates → `docs/sprint-2-backlog.md`
- **#1 — Edit transaction feature** (product gap surfaced in 3A; users must delete-and-re-add today). Backend `PUT` + context method + edit-mode UI.
- **OTA observability (followup #10)** — trigger a benign Sentry event from the test device and inspect breadcrumbs to confirm our `otaUpdates.ts` JS wiring (esp. apply-on-background) actually fires vs native auto-update doing the work.
- **Housekeeping (deferred, not new):** backend submodule pointer (#2), `.env`/`.gitignore` hygiene, per-user Gemini rate limiting, repo migration `ejjy → Pinegrass`.

*(Backlog #5 "auth fix" is now **shipped in vc5** and removed from pending.)*

---

## 11. Time spent per phase (wall clock, approximate)
| Phase | Time |
|-------|------|
| Pre-flight + Phase 1 (accept + verify) | ~30 min |
| Phase 2 (vc3 cancel + autoIncrement + vc4 build) | ~50 min (incl. ~23 min build) |
| Phase 3 Day 1 (OTA gate attempts → blocked) | ~60 min before pausing |
| Phase 3 Day 2 (publish + device observation → PASS) | ~30 min |
| Auth integration + vc5 build (Phase A/B) | ~45 min (incl. ~23 min build) |
| Phase C (internal-track re-QA) | Rex-side smoke |
| Phase 4 (Promote, draft-delete, rollout) | ~30 min incl. investigation |

**Total elapsed: two working sessions (2026-06-08 and 2026-06-11), separated by the EAS Update outage.** Active hands-on time materially less than the calendar span.

---

## Closing
v1.0.1 (5) is live at 100% in India with a clean post-release signal. The OTA pipeline — the structural reason for this build — is verified; **all future JS/TS fixes can now ship as OTA hotfixes without a Play submission.** The first real OTA hotfix is yet to come; this sprint shipped everything natively.
