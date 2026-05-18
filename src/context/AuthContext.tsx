import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import { registerPushToken, clearPushToken } from '../api/push';
import { getExpoPushToken } from '../lib/push';
import { identifyUser, resetAnalytics, track } from '../lib/analytics';
import { signOutGoogle } from '../lib/socialAuth';
import { secureStorage } from '../lib/secureStorage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { addBreadcrumb, captureError } from '../config/sentry';
import type { User, RegisterPayload } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  /** Hydrate the context from an already-persisted session (e.g. after
   * Google OAuth or phone-OTP stash the access_token themselves). */
  refreshFromSession: (user: User) => Promise<void>;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  age_group?: string;
  ageGroup?: string;
  income_range?: string;
  incomeBracket?: string;
  primary_goal?: string;
  mainGoal?: string;
}

const AGE_GROUP_TO_API: Record<string, string> = {
  teen: 'under-18',
  young: '25-35',
  adult: '36-50',
  senior: '50+',
};

const MAIN_GOAL_TO_API: Record<string, string> = {
  save: 'save_more',
  debt: 'pay_debt',
  invest: 'invest',
  budget: 'save_more',
  emergency: 'build_emergency',
  home: 'buy_home',
};

// AsyncStorage key for the cached User row. We hydrate this on cold start so
// the user lands on Dashboard immediately instead of bouncing through
// Login → Loading on every transient network hiccup. Validated in background
// against /auth/me; on a real 401 we wipe everything.
const USER_CACHE_KEY = 'ari_user';

function buildRegisterPayload(data: RegisterFormData): RegisterPayload {
  return {
    name: (data.name || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    password: data.password,
    phone: data.phone?.trim(),
    ageGroup:
      data.ageGroup ||
      AGE_GROUP_TO_API[data.age_group ?? ''] ||
      '25-35',
    incomeBracket: data.incomeBracket || data.income_range || '15k-30k',
    mainGoal:
      data.mainGoal ||
      MAIN_GOAL_TO_API[data.primary_goal ?? ''] ||
      'save_more',
  };
}

async function cacheUser(u: User | null): Promise<void> {
  try {
    if (u) await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    else await AsyncStorage.removeItem(USER_CACHE_KEY);
  } catch {
    /* noop — best-effort cache */
  }
}

async function readCachedUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/**
 * Hand the Supabase client a session minted by our Flask backend so its
 * autoRefreshToken machinery owns the token from here on. We pass
 * refresh_token straight from the backend response — if the backend hasn't
 * been redeployed with that field yet, we skip the handoff and fall back to
 * the legacy single-token path (user logs out in 1h instead of staying in).
 */
async function adoptSessionIntoSupabase(
  accessToken: string,
  refreshToken: string | undefined,
): Promise<void> {
  if (!refreshToken) return;
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    // Non-fatal. Login still succeeded; auto-refresh is now off, which is
    // exactly the pre-fix behavior. Capture for visibility but don't bubble.
    captureError(err instanceof Error ? err : new Error('setSession failed'), {
      where: 'AuthContext.adoptSessionIntoSupabase',
    });
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Wrap the React setter so anywhere we update `user`, the AsyncStorage
  // cache stays in lockstep. Avoids subtle drift between cache + state.
  const setUserAndCache = useCallback((u: User | null) => {
    setUser(u);
    void cacheUser(u);
  }, []);

  // Cold-start hydration. The order matters:
  //   1. Read the cached User row first so the navigator can render Main
  //      immediately on warm relaunches (no Login flash).
  //   2. Then validate against /auth/me in the background. On a real 401 we
  //      clear everything; on any other failure (offline, 5xx, timeout) we
  //      keep what we have and the user stays signed in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await secureStorage.getItem('ari_token');
        if (!token) {
          await cacheUser(null);
          if (!cancelled) setLoading(false);
          return;
        }

        const cached = await readCachedUser();
        if (cached && !cancelled) setUser(cached);

        addBreadcrumb('auth', 'startup: validating cached session');
        try {
          const me = await authApi.getMe();
          if (!cancelled) setUserAndCache(me);
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            // Real auth failure — token is invalid or expired beyond refresh.
            addBreadcrumb('auth', 'startup: 401 from /me, clearing session', 'warning');
            await secureStorage.removeItem('ari_token');
            await cacheUser(null);
            if (!cancelled) setUser(null);
          } else {
            // Transient (network, 5xx, server cold start). Keep the cached
            // user logged in — the navigator already showed them Main.
            addBreadcrumb(
              'auth',
              `startup: /me failed transiently (${err instanceof ApiError ? err.status : 'network'}), preserving session`,
              'warning',
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [setUserAndCache]);

  // Mirror Supabase's auto-refreshed access_token into 'ari_token' so
  // apiRequest (which reads only that key) always sees a fresh token.
  // Without this hook the user's session expires after 1 hour even though
  // Supabase happily refreshed it in its own session store.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let sub: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          addBreadcrumb('auth', 'TOKEN_REFRESHED — mirroring to ari_token');
          void secureStorage.setItem('ari_token', session.access_token);
        }
      });
      sub = data.subscription;
    } catch (err) {
      captureError(err instanceof Error ? err : new Error('onAuthStateChange wiring failed'), {
        where: 'AuthContext.subscribeAuthState',
      });
    }
    return () => {
      try { sub?.unsubscribe(); } catch { /* noop */ }
    };
  }, []);

  // Register the device's Expo push token with the backend. Silent
  // failure is fine — push notifications are an opportunistic channel.
  const attemptPushRegister = async () => {
    try {
      const token = await getExpoPushToken();
      if (token) await registerPushToken(token);
    } catch {
      /* noop */
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    addBreadcrumb('auth', 'login: attempt');
    const { token, refresh_token, user: u } = await authApi.login(email, password);
    await secureStorage.setItem('ari_token', token);
    await adoptSessionIntoSupabase(token, refresh_token);
    setUserAndCache(u);
    identifyUser(u.id, { tier: u.tier ?? 'free', age_group: u.ageGroup });
    track('login_success');
    addBreadcrumb('auth', 'login: success');
    attemptPushRegister();
  }, [setUserAndCache]);

  const register = useCallback(async (formData: RegisterFormData) => {
    addBreadcrumb('auth', 'register: attempt');
    const payload = buildRegisterPayload(formData);
    const { token, refresh_token, user: u } = await authApi.register(payload);
    await secureStorage.setItem('ari_token', token);
    await adoptSessionIntoSupabase(token, refresh_token);
    setUserAndCache(u);
    identifyUser(u.id, { tier: u.tier ?? 'free', age_group: u.ageGroup });
    track('register_success');
    addBreadcrumb('auth', 'register: success');
    attemptPushRegister();
  }, [setUserAndCache]);

  const logout = useCallback(async () => {
    addBreadcrumb('auth', 'logout: starting');
    // Best-effort detach the token so the backend stops pushing to this
    // device. If the network is offline we just wipe local state.
    try {
      await clearPushToken();
    } catch {
      /* noop */
    }
    // Tear down the Supabase session so onAuthStateChange stops firing
    // refreshes for a user who is no longer signed in.
    if (isSupabaseConfigured()) {
      try { await supabase.auth.signOut(); } catch { /* noop */ }
    }
    // Clear local Google session so next signIn re-prompts the account picker.
    await signOutGoogle();
    await secureStorage.removeItem('ari_token');
    await cacheUser(null);
    setUser(null);
    resetAnalytics();
    addBreadcrumb('auth', 'logout: complete');
  }, []);

  const refreshFromSession = useCallback(async (u: User) => {
    setUserAndCache(u);
    identifyUser(u.id, { tier: u.tier ?? 'free', age_group: u.ageGroup });
    attemptPushRegister();
  }, [setUserAndCache]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshFromSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
