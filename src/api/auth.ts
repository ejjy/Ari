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
