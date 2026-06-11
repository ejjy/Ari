import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, ApiError } from '../client';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => false),
  supabase: {
    auth: {
      refreshSession: jest.fn(),
    },
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
  });

  it('makes GET request with correct URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await apiRequest('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('includes auth token when available', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiRequest('/protected');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad request' }),
    });

    await expect(apiRequest('/fail')).rejects.toThrow(ApiError);
    await expect(apiRequest('/fail')).rejects.toThrow('Bad request');
  });

  it('throws ApiError with generic message on json parse failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(apiRequest('/error')).rejects.toThrow('Invalid server response');
  });

  it('returns parsed JSON on success', async () => {
    const expected = { transactions: [{ id: '1' }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(expected),
    });

    const result = await apiRequest('/transactions');
    expect(result).toEqual(expected);
  });

  it('propagates 401 with correct status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    try {
      await apiRequest('/me');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(401);
    }
  });

  it('refreshes and retries /auth/me after an expired access token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('old-token');
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'new-token' } },
      error: null,
    });
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Expired token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'u1', email: 'demo@ari.app' }),
      });

    const result = await apiRequest('/auth/me');

    expect(result).toEqual({ id: 'u1', email: 'demo@ari.app' });
    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-token',
        }),
      })
    );
  });
});
