import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { registerPushToken, clearPushToken } from '../api/push';
import { getExpoPushToken } from '../lib/push';
import { identifyUser, resetAnalytics, track } from '../lib/analytics';
import { signOutGoogle } from '../lib/socialAuth';
import { secureStorage } from '../lib/secureStorage';
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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await secureStorage.getItem('ari_token');
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }
        const me = await authApi.getMe();
        if (!cancelled) setUser(me);
      } catch {
        await secureStorage.removeItem('ari_token');
        await AsyncStorage.removeItem('ari_user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
    const { token, user: u } = await authApi.login(email, password);
    await secureStorage.setItem('ari_token', token);
    setUser(u);
    identifyUser(u.id, { tier: u.tier ?? 'free', age_group: u.ageGroup });
    track('login_success');
    attemptPushRegister();
  }, []);

  const register = useCallback(async (formData: RegisterFormData) => {
    const payload = buildRegisterPayload(formData);
    const { token, user: u } = await authApi.register(payload);
    await secureStorage.setItem('ari_token', token);
    setUser(u);
    identifyUser(u.id, { tier: u.tier ?? 'free', age_group: u.ageGroup });
    track('register_success');
    attemptPushRegister();
  }, []);

  const logout = useCallback(async () => {
    // Best-effort detach the token so the backend stops pushing to this
    // device. If the network is offline we just wipe local state.
    try {
      await clearPushToken();
    } catch {
      /* noop */
    }
    // Clear local Google session so next signIn re-prompts the account picker.
    await signOutGoogle();
    await secureStorage.removeItem('ari_token');
    await AsyncStorage.removeItem('ari_user');
    setUser(null);
    resetAnalytics();
  }, []);

  const refreshFromSession = useCallback(async (u: User) => {
    setUser(u);
    identifyUser(u.id, { tier: u.tier ?? 'free', age_group: u.ageGroup });
    attemptPushRegister();
  }, []);

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
