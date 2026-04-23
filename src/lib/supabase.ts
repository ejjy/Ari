import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Ari mobile Supabase client.
 *
 * Lazy-initialised behind a Proxy: the import never throws, and the
 * underlying createClient() runs only when something actually accesses
 * `supabase.<anything>`. That way a misconfigured EAS build (missing
 * EXPO_PUBLIC_SUPABASE_URL etc.) doesn't hang the splash screen — the
 * error surfaces only when the user taps "Continue with Google" or the
 * phone-OTP flow, where it's caught by the existing try/catch and shown
 * inline.
 *
 * Session persistence: AsyncStorage. Harden to SecureStore later if we
 * ever store sensitive material beyond the JWT (spec §7).
 */

let _client: SupabaseClient | null = null;
let _initError: Error | null = null;

function _getClient(): SupabaseClient {
  if (_client) return _client;
  if (_initError) throw _initError;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    _initError = new Error(
      'Supabase is not configured for this build. ' +
        'EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY missing.',
    );
    throw _initError;
  }

  _client = createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,  // RN has no window.location
    },
  });
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = _getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? (value as Function).bind(client) : value;
  },
});

/** True iff supabase env is configured and createClient won't blow up. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
}
