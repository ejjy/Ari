/**
 * Secure storage for sensitive auth material (JWT, Supabase session).
 *
 * Backed by expo-secure-store, which uses:
 *   - iOS: Keychain Services
 *   - Android: KeyStore + EncryptedSharedPreferences
 *
 * Why this exists:
 *   AsyncStorage on Android is plaintext on disk inside the sandbox. For a
 *   fintech app, an OEM root or backup-on-device exfil is enough to lift the
 *   JWT and impersonate the user. SecureStore is the platform-blessed answer.
 *
 * Compatibility shape:
 *   Mirrors the AsyncStorage subset Supabase auth and our own code use:
 *   getItem / setItem / removeItem returning Promises. Drop-in adapter for
 *   `createClient({ auth: { storage: secureStorage } })`.
 *
 * Migration:
 *   On first read, if a value is missing in SecureStore but present in
 *   AsyncStorage, copy it over and wipe the AsyncStorage entry. One-shot
 *   per key so existing test users aren't logged out.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore key constraints: alphanumerics, ".", "-", "_". The legacy
// AsyncStorage names are already compliant so we re-use them verbatim.
const MIGRATION_FLAG_PREFIX = '__ari_migrated_';

async function migrateOnce(key: string): Promise<string | null> {
  const flag = MIGRATION_FLAG_PREFIX + key;
  // Have we already attempted migration for this key?
  try {
    const done = await AsyncStorage.getItem(flag);
    if (done === '1') return null;
  } catch {
    return null;
  }

  let legacy: string | null = null;
  try {
    legacy = await AsyncStorage.getItem(key);
  } catch {
    legacy = null;
  }

  if (legacy) {
    try {
      await SecureStore.setItemAsync(key, legacy);
    } catch {
      // If SecureStore write fails (e.g. user disabled biometric), bail
      // without flagging migration done so we'll try again next launch.
      return legacy;
    }
  }

  try {
    await AsyncStorage.removeItem(key);
    await AsyncStorage.setItem(flag, '1');
  } catch {
    /* noop — flag is best-effort */
  }
  return legacy;
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const v = await SecureStore.getItemAsync(key);
      if (v != null) return v;
    } catch {
      /* fall through to migration */
    }
    // Either missing in SecureStore or the platform refused; try one-time
    // pull from AsyncStorage.
    return migrateOnce(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
    // If we just wrote a new value, mark migration done so we never copy
    // a stale legacy value over the new one on a subsequent read.
    try {
      await AsyncStorage.setItem(MIGRATION_FLAG_PREFIX + key, '1');
      await AsyncStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* noop — already gone */
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

export type SecureStorageAdapter = typeof secureStorage;
