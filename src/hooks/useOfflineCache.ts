import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'ari_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export function useOfflineCache() {
  const getCached = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const cached: CachedData<T> = JSON.parse(raw);
      if (Date.now() - cached.timestamp > CACHE_TTL) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }, []);

  const setCache = useCallback(async <T>(key: string, data: T): Promise<void> => {
    try {
      const cached: CachedData<T> = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
    } catch {
      // Cache write failed silently
    }
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch {
      // Clear failed silently
    }
  }, []);

  const fetchWithCache = useCallback(
    async <T>(
      key: string,
      fetcher: () => Promise<T>
    ): Promise<T> => {
      try {
        const fresh = await fetcher();
        await setCache(key, fresh);
        return fresh;
      } catch {
        const cached = await getCached<T>(key);
        if (cached) return cached;
        throw new Error('No data available offline');
      }
    },
    [getCached, setCache]
  );

  return { getCached, setCache, clearCache, fetchWithCache };
}
