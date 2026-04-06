import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, ApiError } from '../client';

// Mock fetch globally
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
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
});
