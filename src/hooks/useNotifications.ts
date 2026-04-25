import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const NOTIFICATIONS_ENABLED_KEY = 'ari_notifications_enabled';
const REMINDER_TIME_KEY = 'ari_reminder_time'; // stored as "HH:MM" e.g. "20:00"
const DEFAULT_HOUR = 20; // 8 PM — same default as before to preserve UX for existing users
const DEFAULT_MINUTE = 0;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Parse "HH:MM" -> { hour, minute }. Returns defaults if input is invalid;
 * we never want a malformed AsyncStorage value to brick the reminder flow.
 */
function parseReminderTime(raw: string | null): { hour: number; minute: number } {
  if (!raw) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  const m = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  const hour = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const minute = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { hour, minute };
}

function formatReminderTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [reminderHour, setReminderHour] = useState(DEFAULT_HOUR);
  const [reminderMinute, setReminderMinute] = useState(DEFAULT_MINUTE);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      setIsEnabled(stored === 'true');

      const rawTime = await AsyncStorage.getItem(REMINDER_TIME_KEY);
      const { hour, minute } = parseReminderTime(rawTime);
      setReminderHour(hour);
      setReminderMinute(minute);

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert('Notifications', 'Push notifications only work on physical devices.');
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      setPermissionGranted(true);
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);

    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive reminders from Tomo.'
      );
    }

    return granted;
  }, []);

  /**
   * Cancel any prior reminder and (re)schedule for the given hour/minute.
   * Pulled the messages bank out of any specific time so changing the
   * reminder time picks a fresh random message — feels less robotic.
   */
  const scheduleDailyReminder = useCallback(
    async (hour: number = reminderHour, minute: number = reminderMinute) => {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const messages = [
        { title: "Hey! Did you log today's expenses? 📊", body: "Tomo is waiting to help you track your spending." },
        { title: "Don't forget to log your spending! 💰", body: "Quick entry takes just 5 seconds." },
        { title: "How's your budget looking? 🎯", body: "Check in with Tomo to stay on track." },
        { title: "Your money diary needs an update! 📝", body: "Log today's expenses to keep your streak." },
      ];

      const msg = messages[Math.floor(Math.random() * messages.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    },
    [reminderHour, reminderMinute]
  );

  const toggleNotifications = useCallback(async () => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (granted) {
        await scheduleDailyReminder();
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
        setIsEnabled(true);
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      setIsEnabled(false);
    }
  }, [isEnabled, requestPermission, scheduleDailyReminder]);

  /**
   * Persist a new reminder time and re-schedule if reminders are on.
   * If reminders are currently off we still persist the choice so toggling
   * them on later uses the user's preferred time.
   */
  const setReminderTime = useCallback(
    async (hour: number, minute: number) => {
      const safeHour = Math.min(23, Math.max(0, Math.floor(hour)));
      const safeMinute = Math.min(59, Math.max(0, Math.floor(minute)));
      setReminderHour(safeHour);
      setReminderMinute(safeMinute);
      await AsyncStorage.setItem(REMINDER_TIME_KEY, formatReminderTime(safeHour, safeMinute));
      if (isEnabled && permissionGranted) {
        await scheduleDailyReminder(safeHour, safeMinute);
      }
    },
    [isEnabled, permissionGranted, scheduleDailyReminder]
  );

  const sendTestNotification = useCallback(async () => {
    if (!permissionGranted) {
      await requestPermission();
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tomo says hi! 🤖',
        body: "Great job staying on top of your finances! Keep it up.",
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  }, [permissionGranted, requestPermission]);

  return {
    isEnabled,
    permissionGranted,
    reminderHour,
    reminderMinute,
    toggleNotifications,
    setReminderTime,
    sendTestNotification,
    requestPermission,
  };
}
