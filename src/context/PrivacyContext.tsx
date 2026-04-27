import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency } from '../utils/formatCurrency';
import { setPrivacyEnabled } from '../lib/analytics';

/**
 * Spec §7 — "Private Mode" UI toggle that hides all balance and amount
 * values with blur/masking. Common in finance apps so a user can show the
 * screen in public without leaking rupee figures. Persisted per device.
 *
 * Consumption pattern:
 *   const { isPrivate, togglePrivate, formatAmount } = usePrivacy();
 *   <Text>{formatAmount(balance)}</Text>
 */

const STORAGE_KEY = 'ari_private_mode';
const MASK = '••••';

interface PrivacyContextValue {
  isPrivate: boolean;
  togglePrivate: () => void;
  setPrivate: (v: boolean) => void;
  /** Format a rupee amount respecting the current privacy setting. */
  formatAmount: (amount: number) => string;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setPrivateState] = useState(false);

  // Restore persisted setting on mount. Failure is silent — default (off)
  // is the safer fallback if AsyncStorage is unavailable. Mirrors the
  // hydrated state into the analytics layer so PostHog opts out / opts in
  // BEFORE any screen has a chance to fire a track() call.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const v = raw === '1';
        if (v) setPrivateState(true);
        setPrivacyEnabled(v);
      } catch {
        /* noop */
      }
    })();
  }, []);

  const setPrivate = useCallback((v: boolean) => {
    setPrivateState(v);
    // Tell PostHog to opt out / opt back in. Synchronous so any track()
    // calls fired in the same tick (e.g. from this same toggle button)
    // see the updated flag.
    setPrivacyEnabled(v);
    AsyncStorage.setItem(STORAGE_KEY, v ? '1' : '0').catch(() => {});
  }, []);

  const togglePrivate = useCallback(() => setPrivate(!isPrivate), [isPrivate, setPrivate]);

  const formatAmount = useCallback(
    (amount: number) => (isPrivate ? MASK : formatCurrency(amount)),
    [isPrivate],
  );

  const value = useMemo(
    () => ({ isPrivate, togglePrivate, setPrivate, formatAmount }),
    [isPrivate, togglePrivate, setPrivate, formatAmount],
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used inside a PrivacyProvider');
  return ctx;
}
