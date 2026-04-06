import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const NOTIFICATIONS_ENABLED_KEY = 'ari_notifications_enabled';
const REMINDER_HOUR = 20; // 8 PM daily reminder

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

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      setIsEnabled(stored === 'true');

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

  const scheduleDailyReminder = useCallback(async () => {
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
        hour: REMINDER_HOUR,
        minute: 0,
      },
    });
  }, []);

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
    toggleNotifications,
    sendTestNotification,
    requestPermission,
  };
}
