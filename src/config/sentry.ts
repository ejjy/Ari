import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    attachScreenshot: true,
    environment: __DEV__ ? 'development' : 'production',
    beforeSend(event) {
      // Don't send events in dev mode
      if (__DEV__) {
        console.log('[Sentry] Event captured (dev):', event.message);
        return null;
      }
      return event;
    },
  });
}

export function captureError(error: Error, context?: Record<string, string>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export function setUserContext(user: { id: string; email: string; name: string }) {
  Sentry.setUser({ id: user.id, email: user.email, username: user.name });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function addBreadcrumb(
  category: string,
  message: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({ category, message, level });
}

export { Sentry };
