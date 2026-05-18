import { apiRequest } from './client';
import type { User, RegisterPayload } from '../types';

// refresh_token is optional so the frontend keeps working against a backend
// that hasn't been redeployed with the refresh_token field yet. The Supabase
// auto-refresh path is a no-op in that case; user just sees the legacy 1h
// access_token TTL until backend catches up.
export interface AuthSessionResponse {
  token: string;
  refresh_token?: string;
  user: User;
}

export const login = (email: string, password: string) =>
  apiRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (payload: RegisterPayload) =>
  apiRequest<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getMe = () => apiRequest<User>('/auth/me');

export interface PatchMePayload {
  name?: string;
  upiVpa?: string | null;
  monthlyIncome?: number | null;
}

/** PATCH /api/auth/me — update a small subset of profile fields. */
export const patchMe = (payload: PatchMePayload) =>
  apiRequest<User>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
