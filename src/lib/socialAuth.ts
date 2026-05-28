/**
 * Google sign-in via Google Play Services native SDK.
 *
 * Why @react-native-google-signin/google-signin and not expo-auth-session:
 *   - Android OAuth clients block custom-URI redirects by default (security
 *     hardening 2022+). We hit "Custom URI scheme is not enabled" with the
 *     web-flow path even after the GCP toggle.
 *   - The native SDK uses Google Play Services' system account picker —
 *     no custom URIs, no browser handoff, faster UX, Google's recommended
 *     long-term path.
 *
 * Configuration:
 *   - WEB OAuth client (created in GCP) — its id is what the SDK passes
 *     to Google to receive a signed id_token. Configure once at app boot.
 *   - ANDROID OAuth client — its SHA-1 + package binding tells Google to
 *     trust requests originating from this signed APK. Doesn't appear in
 *     code; Google enforces it server-side.
 *
 * Contract: same as before — on success we persist the Supabase session's
 * access_token to SecureStore under 'ari_token' so the existing apiRequest +
 * Flask dual-path JWT verifier keep working unchanged.
 */
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { secureStorage } from './secureStorage';
import { addBreadcrumb, captureError, Sentry } from '../config/sentry';


let _configured = false;
const GOOGLE_TEMPORARY_ERROR =
  'Google sign-in is temporarily unavailable. Please use your email and password, or try again later.';

function _ensureConfigured(): boolean {
  if (_configured) return true;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) return false;
  try {
    GoogleSignin.configure({
      webClientId,
      // No iosClientId yet — iOS sign-in needs its own GCP client; defer.
      offlineAccess: false,  // we don't need a refresh token; Supabase issues its own
      forceCodeForRefreshToken: false,
    });
    _configured = true;
  } catch {
    /* swallow — surfaces as ok=false in signIn() */
  }
  return _configured;
}


export interface GoogleAuthResult {
  ok: boolean;
  error?: string;
  cancelled?: boolean;
}


export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (!_ensureConfigured()) {
    Sentry.captureMessage('google_sign_in_not_configured', { level: 'error' });
    return { ok: false, error: 'Google sign-in is not available on this build. Please use your email and password.' };
  }

  // Make sure Play Services is available + up to date.
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch {
    return { ok: false, error: 'Google Play Services is missing or out of date on this device.' };
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (e) {
    if (isErrorWithCode(e)) {
      switch (e.code) {
        case statusCodes.SIGN_IN_CANCELLED:
        case statusCodes.IN_PROGRESS:
          return { ok: false, cancelled: true };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { ok: false, error: 'Google Play Services is missing or out of date on this device.' };
        case statusCodes.SIGN_IN_REQUIRED:
          return { ok: false, error: 'Please sign in to your Google account on this device first, then try again.' };
        default: {
          // DEVELOPER_ERROR ("code 10") is the famous SHA-1 / OAuth-client
          // misconfig path. Never leak the raw code to the user — it just
          // confuses people. Fingerprint via Sentry so we can spot it in
          // aggregate.
          Sentry.captureMessage(
            `google_sign_in_failed:${String(e.code)}`,
            { level: 'error', extra: { code: e.code, message: e.message } },
          );
          return { ok: false, error: GOOGLE_TEMPORARY_ERROR };
        }
      }
    }
    captureError(e instanceof Error ? e : new Error('google_sign_in_unknown'), {
      where: 'socialAuth.signIn',
    });
    return { ok: false, error: 'Google sign-in failed. Please try again or use your email.' };
  }

  if (!isSuccessResponse(response)) {
    return { ok: false, cancelled: true };
  }

  let idToken = response.data?.idToken;
  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    } catch (e) {
      Sentry.captureMessage('google_sign_in_get_tokens_failed', {
        level: 'error',
        extra: {
          message: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }

  if (!idToken) {
    Sentry.captureMessage('google_sign_in_no_id_token', { level: 'error' });
    return { ok: false, error: GOOGLE_TEMPORARY_ERROR };
  }

  // Hand off to Supabase — this is the same call we used before. The
  // session that lands here is what powers autoRefreshToken; AuthContext's
  // onAuthStateChange hook mirrors the refreshed access_token into
  // 'ari_token' so apiRequest keeps working past the initial 1h window.
  try {
    addBreadcrumb('auth', 'google: exchanging id_token with Supabase');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error || !data.session) {
      Sentry.captureMessage('supabase_google_exchange_failed', {
        level: 'error',
        extra: { message: error?.message },
      });
      return { ok: false, error: 'Sign-in failed. Please try again or use your email.' };
    }
    await secureStorage.setItem('ari_token', data.session.access_token);
    addBreadcrumb('auth', 'google: session adopted');
    return { ok: true };
  } catch (e) {
    captureError(e instanceof Error ? e : new Error('supabase_exchange_threw'), {
      where: 'socialAuth.signInWithIdToken',
    });
    return { ok: false, error: 'Sign-in failed. Please try again or use your email.' };
  }
}


/**
 * Hook shim — kept so LoginScreen's import surface doesn't change.
 * The native SDK doesn't need a hook (no React state to track), so this
 * just returns the function.
 */
export function useGoogleSignIn(): {
  ready: boolean;
  signIn: () => Promise<GoogleAuthResult>;
} {
  return {
    ready: _ensureConfigured(),
    signIn: signInWithGoogle,
  };
}


/** Sign out of Google locally so the next signIn re-prompts the picker. */
export async function signOutGoogle(): Promise<void> {
  if (!_configured) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    /* noop */
  }
}


// Phone OTP was here. Removed for v1 launch — email + Google cover the
// signup paths. Bring back via supabase.auth.signInWithOtp + verifyOtp
// when Twilio is provisioned and we're ready for the SMS cost model.
