import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIC_ENABLED_KEY = 'ari_biometric_enabled';

export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const available = compatible && enrolled;

        if (!cancelled) setIsAvailable(available);

        const storedPref = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        const enabled = storedPref === 'true' && available;

        if (!cancelled) setIsEnabled(enabled);

        if (enabled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock Ari',
            fallbackLabel: 'Use passcode',
            disableDeviceFallback: false,
          });
          if (!cancelled) setIsAuthenticated(result.success);
        } else {
          if (!cancelled) setIsAuthenticated(true);
        }
      } catch {
        if (!cancelled) setIsAuthenticated(true);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const toggleBiometric = useCallback(async () => {
    if (!isAvailable) return;

    if (!isEnabled) {
      // Verify before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable biometric lock',
        fallbackLabel: 'Use passcode',
      });
      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
      }
    } else {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      setIsEnabled(false);
    }
  }, [isAvailable, isEnabled]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isEnabled) return true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Ari',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
    setIsAuthenticated(result.success);
    return result.success;
  }, [isEnabled]);

  return {
    isAvailable,
    isEnabled,
    isAuthenticated,
    isChecking,
    toggleBiometric,
    authenticate,
  };
}
