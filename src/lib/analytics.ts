import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * PostHog analytics for Day-1/7/30 retention tracking (spec §2 Analytics
 * row). Wrapped in a tiny facade so route/screen code doesn't import the
 * SDK directly — easier to swap providers later, easier to no-op in dev.
 *
 * Wired in App.tsx (init) + AuthContext (identify on login, reset on
 * logout) + the screens that fire interesting events (expense logged,
 * brief opened, paywall viewed).
 *
 * Privacy / Private Mode:
 *   When the user enables Private Mode (spec §7) we call PostHog's
 *   native opt-out (`client.optOut()`) AND set a module-level flag that
 *   `track()` / `identifyUser()` short-circuit on. Defense in depth — if
 *   PostHog batches an event before the opt-out propagates, the early
 *   return still drops it. The boot sequence reads the persisted Private
 *   Mode flag synchronously enough that no events fire before the SDK
 *   knows the user opted out.
 */

const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const PRIVACY_STORAGE_KEY = 'ari_private_mode';

let client: PostHog | null = null;
let _privacyOptOut = false;

// PostHog v2's typed PostHogEventProperties requires JSON-serialisable
// values. We accept Record<string, unknown> from callers for ergonomics
// then assert at the boundary — runtime we filter undefined/functions
// to keep the JSON valid.
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
function _toJson(v: unknown): Json | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map((x) => _toJson(x) ?? null) as Json[];
  if (typeof v === 'object') {
    const out: Record<string, Json> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const j = _toJson(val);
      if (j !== undefined) out[k] = j;
    }
    return out;
  }
  return undefined;
}
function _props(p: Record<string, unknown>): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(p)) {
    const j = _toJson(v);
    if (j !== undefined) out[k] = j;
  }
  return out;
}

export async function initAnalytics(): Promise<void> {
  if (!KEY || client) return;
  // Hydrate the privacy flag BEFORE the client exists so the SDK can be
  // opted-out the moment it's constructed. Failure here is fine — the
  // default ('not in private mode') is the louder, safer-by-default state
  // since track() also no-ops without a key.
  try {
    const persisted = await AsyncStorage.getItem(PRIVACY_STORAGE_KEY);
    _privacyOptOut = persisted === '1';
  } catch {
    /* noop */
  }
  try {
    client = new PostHog(KEY, {
      host: HOST,
      captureAppLifecycleEvents: true,
    });
    // Tag every event with build metadata so we can correlate retention
    // dips with releases. Mirror Darelight's super-property set (platform +
    // build_number) so PostHog dashboards can be defined identically across
    // both apps (iOS vs Android slices, version-gated regression detection).
    const buildNumber = Platform.OS === 'ios'
      ? String(Constants.expoConfig?.ios?.buildNumber ?? '1')
      : String(Constants.expoConfig?.android?.versionCode ?? 1);
    client.register({
      app_version: Constants.expoConfig?.version ?? 'dev',
      runtime: Constants.expoConfig?.runtimeVersion?.toString() ?? 'unknown',
      platform: Platform.OS,
      build_number: buildNumber,
    });
    // If we restored opt-out from storage, propagate it into the SDK now.
    if (_privacyOptOut) {
      try { client.optOut(); } catch { /* noop */ }
    }
  } catch {
    /* swallow — analytics is never critical */
  }
}

/**
 * Toggle analytics opt-out. Called by PrivacyContext whenever the user
 * flips Private Mode in Settings. Uses PostHog's SDK-native optOut/optIn
 * AND keeps a local flag so the early-return in track() catches anything
 * the SDK queues during the transition.
 */
export function setPrivacyEnabled(enabled: boolean): void {
  _privacyOptOut = enabled;
  if (!client) return;
  try {
    if (enabled) client.optOut();
    else client.optIn();
  } catch {
    /* noop */
  }
}

/** True iff the user has Private Mode on (analytics opt-out). */
export function isPrivacyEnabled(): boolean {
  return _privacyOptOut;
}

export function identifyUser(userId: string, traits: Record<string, unknown> = {}): void {
  if (!client || _privacyOptOut) return;
  try {
    client.identify(userId, _props(traits));
  } catch { /* noop */ }
}

export function resetAnalytics(): void {
  if (!client) return;
  try {
    client.reset();
  } catch { /* noop */ }
}

export type AnalyticsEvent =
  | 'app_opened'
  | 'app_foregrounded'
  | 'app_backgrounded'
  | 'login_success'
  | 'register_success'
  | 'consent_accepted'
  | 'account_deleted'
  | 'transaction_logged'
  | 'expense_logged'
  | 'expense_logged_voice'
  | 'expense_parsed_local'
  | 'expense_parsed_ai'
  | 'budget_created'
  | 'goal_created'
  | 'paywall_viewed'
  | 'pro_purchase_initiated'
  | 'pro_purchase_completed'
  | 'pro_purchase_failed'
  | 'pro_purchase_cancelled'
  | 'subscription_started'
  | 'tomo_message_sent'
  | 'tomo_response_received'
  | 'group_created'
  | 'group_joined'
  | 'group_expense_added'
  | 'split_settled_upi'
  | 'split_settled_cash'
  | 'brief_opened'
  | 'brief_dismissed'
  | 'private_mode_toggled'
  | 'aa_consent_started'
  | 'aa_consent_completed';

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  if (!client || _privacyOptOut) return;
  try {
    client.capture(event, _props(props));
  } catch { /* noop */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Bucket an INR amount into a coarse band. Buckets are calibrated to Indian
 * personal-finance context so the histogram across users is balanced and
 * actionable — most expenses fall in 100–2k, salaries land in 50k+.
 *
 * Reasons we bucket instead of sending raw amounts:
 *   1. PII minimisation (DPDPA-friendly)
 *   2. Cohort-friendly aggregation in PostHog
 *   3. Compresses the long tail of vehicle / rent / EMI amounts
 */
export function bucketAmount(amount: number): string {
  if (amount < 100) return '0-100';
  if (amount < 500) return '100-500';
  if (amount < 2_000) return '500-2k';
  if (amount < 10_000) return '2k-10k';
  if (amount < 50_000) return '10k-50k';
  if (amount < 2_00_000) return '50k-2L';
  if (amount < 10_00_000) return '2L-10L';
  return '10L+';
}
