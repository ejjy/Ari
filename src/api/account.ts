import { apiRequest } from './client';

export const deleteAccount = (password: string) =>
  apiRequest<{ message: string }>('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
