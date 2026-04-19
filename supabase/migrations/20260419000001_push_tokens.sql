-- =============================================================================
-- Push notification infrastructure
-- Stores the Expo push token per user so the backend can send coaching
-- briefs and budget alerts via Expo's Push API.
-- =============================================================================

ALTER TABLE ari_users
  ADD COLUMN expo_push_token TEXT,
  ADD COLUMN push_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Token is user-scoped secretish-data; RLS already blankets ari_users so
-- no extra policy needed here. Users may rotate/clear via a future
-- /api/auth/push-token endpoint (DELETE shape).

COMMENT ON COLUMN ari_users.expo_push_token IS
  'Expo Push token (ExponentPushToken[...]). Null when the user has not opted in or the OS denied permission. Backend clears this on a "DeviceNotRegistered" bounce from the Expo Push API.';
