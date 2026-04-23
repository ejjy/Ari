import { apiRequest } from './client';
import type { User, RegisterPayload } from '../types';

export const login = (email: string, password: string) =>
  apiRequest<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (payload: RegisterPayload) =>
  apiRequest<{ token: string; user: User }>('/auth/register', {
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
