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
 * access_token to AsyncStorage 'ari_token' so the existing apiRequest +
 * Flask dual-path JWT verifier keep working unchanged.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';


let _configured = false;

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
    return { ok: false, error: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set on this build.' };
  }

  // Make sure Play Services is available + up to date.
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch {
    return { ok: false, error: 'Google Play Services unavailable on this device.' };
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
          return { ok: false, error: 'Google Play Services not available.' };
        default:
          return { ok: false, error: `Google sign-in error (${e.code}): ${e.message}` };
      }
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Google sign-in failed' };
  }

  if (!isSuccessResponse(response)) {
    return { ok: false, cancelled: true };
  }

  const idToken = response.data?.idToken;
  if (!idToken) {
    return { ok: false, error: 'Google did not return an id_token (check webClientId).' };
  }

  // Hand off to Supabase — this is the same call we used before.
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error || !data.session) {
      return { ok: false, error: error?.message ?? 'Supabase rejected the Google token' };
    }
    await AsyncStorage.setItem('ari_token', data.session.access_token);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Supabase exchange failed' };
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
