import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { useOfflineCache } from '../useOfflineCache';

describe('useOfflineCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchWithCache returns fresh data on success', async () => {
    const { result } = renderHook(() => useOfflineCache());

    const data = { items: [1, 2, 3] };
    const fetcher = jest.fn().mockResolvedValue(data);

    let fetched: any;
    await act(async () => {
      fetched = await result.current.fetchWithCache('test_key', fetcher);
    });

    expect(fetched).toEqual(data);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('fetchWithCache falls back to cache on network failure', async () => {
    const cached = { data: { items: [4, 5] }, timestamp: Date.now() };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));

    const { result } = renderHook(() => useOfflineCache());

    const fetcher = jest.fn().mockRejectedValue(new Error('Network error'));

    let fetched: any;
    await act(async () => {
      fetched = await result.current.fetchWithCache('test_key', fetcher);
    });

    expect(fetched).toEqual({ items: [4, 5] });
  });

  it('fetchWithCache throws when no cache and network fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineCache());
    const fetcher = jest.fn().mockRejectedValue(new Error('fail'));

    await expect(
      act(async () => {
        await result.current.fetchWithCache('no_cache', fetcher);
      })
    ).rejects.toThrow('No data available offline');
  });

  it('clearCache removes all cache keys', async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
      'ari_cache_a',
      'ari_cache_b',
      'ari_token',
    ]);

    const { result } = renderHook(() => useOfflineCache());

    await act(async () => {
      await result.current.clearCache();
    });

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      'ari_cache_a',
      'ari_cache_b',
    ]);
  });
});
