import { secureStorage } from '../lib/secureStorage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { addBreadcrumb } from '../config/sentry';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getToken = (): Promise<string | null> =>
  secureStorage.getItem('ari_token');

// Single in-flight refresh, shared by every concurrent 401. Without this,
// 12 parallel screen-mount fetches all 401 at once trigger 12 refreshes,
// rate-limit the auth endpoint, and likely race with the token write.
let _refreshInFlight: Promise<string | null> | null = null;

function shouldRefreshAfter401(path: string): boolean {
  // Login/register are expected to return 401/4xx for bad credentials and
  // cannot be repaired by refreshing the current session. Other auth routes
  // such as /auth/me are protected API calls and should get the same refresh
  // path as transactions, budgets, etc.
  return path !== '/auth/login' && path !== '/auth/register';
}

async function _refreshAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  if (_refreshInFlight) return _refreshInFlight;

  _refreshInFlight = (async () => {
    try {
      addBreadcrumb('auth', 'apiRequest: refreshing session after 401');
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) return null;
      // AuthContext's onAuthStateChange hook also mirrors this, but we also
      // write it here so the immediate retry below sees the new token even
      // if the listener hasn't fired yet.
      await secureStorage.setItem('ari_token', data.session.access_token);
      return data.session.access_token;
    } catch {
      return null;
    } finally {
      _refreshInFlight = null;
    }
  })();
  return _refreshInFlight;
}

async function _doRequest<T>(
  path: string,
  options: RequestInit,
  tokenOverride?: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const token = tokenOverride ?? (await getToken());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    // Network failure — DNS, no internet, server unreachable. Surface as
    // status 0 so callers can branch on it (humanizeLoginError checks for 0).
    return { ok: false, status: 0, message: 'Network unavailable' };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, status: res.status, message: 'Invalid server response' };
  }

  if (!res.ok) {
    const msg =
      typeof json === 'object' &&
      json !== null &&
      'error' in json &&
      typeof (json as { error: unknown }).error === 'string'
        ? (json as { error: string }).error
        : 'Request failed';
    return { ok: false, status: res.status, message: msg };
  }
  return { ok: true, data: json as T };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const first = await _doRequest<T>(path, options);
  if (first.ok) return first.data;

  // On 401, try once to refresh the session and retry. Anything else
  // (network, 4xx that isn't 401, 5xx) propagates without retry. We
  // explicitly skip refresh for credential exchange routes so a failed login
  // doesn't trigger a refresh storm against expired credentials.
  if (first.status === 401 && shouldRefreshAfter401(path)) {
    const newToken = await _refreshAccessToken();
    if (newToken) {
      const second = await _doRequest<T>(path, options, newToken);
      if (second.ok) return second.data;
      throw new ApiError(second.status, second.message);
    }
  }

  throw new ApiError(first.status, first.message);
}
