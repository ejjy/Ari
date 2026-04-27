import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

// Resolve release + dist + environment from Expo config so Sentry events
// are correctly grouped per build. release is `${slug}@${version}+${build}`
// (Sentry's convention); dist is the EAS native build number.
function resolveRelease(): { release: string; dist?: string } {
  const slug = Constants.expoConfig?.slug ?? 'ari';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  // EAS injects the native build number on production/preview builds.
  // Falls back to undefined in dev (Expo Go).
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString();
  const release = buildNumber
    ? `${slug}@${version}+${buildNumber}`
    : `${slug}@${version}`;
  return { release, dist: buildNumber };
}

function resolveEnvironment(): string {
  if (__DEV__) return 'development';
  // EAS sets APP_VARIANT in eas.json to 'production' or 'preview'.
  const appVariant = process.env.APP_VARIANT;
  if (appVariant === 'preview' || appVariant === 'production') return appVariant;
  return 'production';
}

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  const { release, dist } = resolveRelease();

  Sentry.init({
    dsn: SENTRY_DSN,
    release,
    dist,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    attachScreenshot: false,
    environment: resolveEnvironment(),
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
