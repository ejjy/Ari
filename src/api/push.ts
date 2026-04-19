import { apiRequest } from './client';

/** POST /api/auth/push-token — registers the device's Expo push token
 * against the current user. Silent on failure — not a blocking flow. */
export const registerPushToken = (token: string, enabled = true) =>
  apiRequest<{ ok: boolean }>('/auth/push-token', {
    method: 'POST',
    body: JSON.stringify({ token, enabled }),
  });

export const clearPushToken = () =>
  apiRequest<{ ok: boolean }>('/auth/push-token', { method: 'DELETE' });
