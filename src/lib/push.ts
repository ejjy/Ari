import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Push notification registration (spec Sprint 2). Used by AuthContext to
 * grab an Expo push token after login and POST it to the backend so
 * coaching briefs and budget alerts can reach the user.
 *
 * Contract:
 *   - getExpoPushToken(): returns the token string or null (simulator,
 *     permission denied, or no projectId).
 *   - Android requires an explicit notification channel for Heads-up /
 *     sound to work on API 26+; we set one lazily the first time we ask
 *     for a token.
 */

const CHANNEL_ID = 'ari-default';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Ari notifications',
    importance: Notifications.AndroidImportance.HIGH,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: [0, 120, 80, 120],
    sound: 'default',
    showBadge: true,
  });
}

export async function getExpoPushToken(): Promise<string | null> {
  // Expo's docs — push tokens only work on physical devices. On
  // simulators we silently no-op so dev doesn't choke.
  if (!Device.isDevice) return null;

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  if (!projectId) {
    // Expo SDK 52+ requires projectId — without it the call silently
    // returns a broken token. Fail loudly in dev, fall through in prod.
    if (__DEV__) console.warn('[push] EAS projectId missing; cannot get Expo push token');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ?? null;
  } catch (e) {
    if (__DEV__) console.warn('[push] getExpoPushTokenAsync failed:', e);
    return null;
  }
}
