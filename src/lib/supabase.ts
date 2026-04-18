import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Ari mobile Supabase client (Phase 4a).
 *
 * Scope right now: the client exists and can be imported, but it is NOT yet
 * wired into AuthContext or the apiRequest pipeline. That swap happens in
 * Phase 4b, after the Railway -> Supabase data migration (Phase 3) is done,
 * so that a user signing in via Google/OTP actually has a profile row the
 * Flask backend can find.
 *
 * Session persistence: AsyncStorage. Good enough for v1; harden to
 * SecureStore if we ever store sensitive material beyond the JWT
 * (refresh-token-grade secrets), per spec §7.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Intentionally throw at import time rather than deferring — we'd rather
  // catch a misconfigured build during `expo start` than in production when
  // a user taps "Sign in with Google".
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
      'Check your .env file or EAS secrets.',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL session detection — React Native doesn't have window.location.
    detectSessionInUrl: false,
  },
});
