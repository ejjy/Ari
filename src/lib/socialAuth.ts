/**
 * Social + phone auth helpers built on the Supabase JS client.
 *
 * Contract: after any successful sign-in we persist the Supabase
 * access_token to AsyncStorage key `ari_token` (same key apiRequest uses)
 * so the existing Flask backend sees the new session automatically via
 * the ES256 dual-path verifier. No backend route changes required.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();


// Google OAuth
// ---------------------------------------------------------------------------
// Android OAuth clients (which is what we created in Google Cloud Console:
// type = "Android", bound to package + SHA-1) cannot use the implicit
// id_token flow with a custom-scheme redirect — Google's auth server
// rejects custom URIs for Android client types. The supported pattern is
// expo-auth-session/providers/google's hook, which dispatches to:
//   - Google's native Sign-In (via Play Services) when an Android client
//     id is present, OR
//   - the web flow with PKCE when only a webClientId is present.
//
// The hook returns [request, response, promptAsync]. Caller fires
// promptAsync and awaits the response — we surface that as a hook to
// LoginScreen so React Hooks rules are respected.

export interface GoogleAuthResult {
  ok: boolean;
  error?: string;
  cancelled?: boolean;
}


export function useGoogleSignIn(): {
  ready: boolean;
  signIn: () => Promise<GoogleAuthResult>;
} {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    // iosClientId / webClientId can be added later once we have those clients.
    scopes: ['openid', 'email', 'profile'],
  });

  const signIn = async (): Promise<GoogleAuthResult> => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
      return { ok: false, error: 'EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set on this build.' };
    }
    if (!request) {
      return { ok: false, error: 'Google sign-in is still warming up — try again in a second.' };
    }

    let result;
    try {
      result = await promptAsync();
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Google sign-in failed' };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: false, cancelled: true };
    }
    if (result.type !== 'success') {
      return { ok: false, error: `Google sign-in returned ${result.type}` };
    }

    const params = result.params as Record<string, string>;
    const idToken = params.id_token;
    if (!idToken) return { ok: false, error: 'No ID token returned by Google' };

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
  };

  return { ready: !!request, signIn };
}


// Phone OTP
// ---------------------------------------------------------------------------
// Two-step flow: requestPhoneOtp() sends the SMS; verifyPhoneOtp() exchanges
// the 6-digit code for a Supabase session. Supabase handles SMS delivery
// via Twilio (configured in the project dashboard).

export async function requestPhoneOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not send OTP' };
  }
}


export async function verifyPhoneOtp(
  phone: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error || !data.session) return { ok: false, error: error?.message ?? 'Could not verify the code' };

    await AsyncStorage.setItem('ari_token', data.session.access_token);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Verify failed' };
  }
}
