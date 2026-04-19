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
import { makeRedirectUri, AuthRequest, ResponseType } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { supabase } from './supabase';


WebBrowser.maybeCompleteAuthSession();


// Google OAuth
// ---------------------------------------------------------------------------
// Flow: open the system browser to Google's consent, ask for an id_token
// with nonce-protection, then hand that id_token to Supabase Auth via
// signInWithIdToken. Supabase creates/updates auth.users; the
// on_auth_user_created trigger inserts the ari_users row.

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};


async function randomNonce(): Promise<string> {
  const raw = await Crypto.getRandomBytesAsync(16);
  return Array.from(raw).map((b) => b.toString(16).padStart(2, '0')).join('');
}


export interface GoogleAuthResult {
  ok: boolean;
  error?: string;
}


export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return { ok: false, error: 'EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set. Add it to .env and EAS secrets.' };
  }

  const redirectUri = makeRedirectUri({
    scheme: (Constants.expoConfig?.scheme as string | undefined) ?? 'ari',
  });

  const nonce = await randomNonce();

  const request = new AuthRequest({
    clientId,
    scopes: ['openid', 'email', 'profile'],
    responseType: ResponseType.IdToken,
    redirectUri,
    extraParams: { nonce },
  });

  try {
    const result = await request.promptAsync(GOOGLE_DISCOVERY, { useProxy: false } as never);
    if (result.type !== 'success') {
      return { ok: false, error: result.type === 'cancel' ? 'cancelled' : 'Google sign-in failed' };
    }
    const idToken = (result.params as Record<string, string>).id_token;
    if (!idToken) return { ok: false, error: 'No ID token returned by Google' };

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce,
    });
    if (error || !data.session) return { ok: false, error: error?.message ?? 'Supabase rejected the Google token' };

    await AsyncStorage.setItem('ari_token', data.session.access_token);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Google sign-in error' };
  }
}


// Phone OTP
// ---------------------------------------------------------------------------
// Two-step flow: requestPhoneOtp() sends the SMS; verifyPhoneOtp() exchanges
// the 6-digit code for a Supabase session. Supabase handles SMS delivery
// via Twilio (configured in the project dashboard).

export async function requestPhoneOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms' },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}


export async function verifyPhoneOtp(
  phone: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: 'sms',
  });
  if (error || !data.session) return { ok: false, error: error?.message ?? 'Could not verify the code' };

  await AsyncStorage.setItem('ari_token', data.session.access_token);
  return { ok: true };
}
