import * as Updates from 'expo-updates';
import { AppState, type AppStateStatus } from 'react-native';
import { addBreadcrumb } from '../config/sentry';

// Whether a newer JS bundle has been downloaded and staged this session.
// Once true, the update is applied either eagerly the next time the app is
// backgrounded (see registerOtaReloadHandler) or on the next natural cold
// start (expo-updates launches staged updates automatically) — never
// mid-session, so an active user is not interrupted by a reload.
let updateStaged = false;

/**
 * Cold-start OTA check. Fire-and-forget — never block the splash on this.
 *
 * Checks the configured EAS channel for a newer bundle matching this
 * runtimeVersion; if one exists, downloads and stages it for the next launch.
 * Every failure path is a silent no-op: the app keeps running the bundle it
 * booted with. Relies on expo-updates' built-in auto-rollback to the embedded
 * bundle if a staged update crashes on launch (do not disable that).
 */
export async function checkAndApplyUpdate(): Promise<void> {
  // No OTA in dev (Expo Go / dev client) or when updates are disabled (e.g.
  // an embedded-only build). Updates.isEnabled is false in those cases and
  // checkForUpdateAsync would throw.
  if (__DEV__ || !Updates.isEnabled) return;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;

    addBreadcrumb('ota', 'update available, fetching', 'info');
    const fetched = await Updates.fetchUpdateAsync();
    if (fetched.isNew) {
      updateStaged = true;
      addBreadcrumb('ota', 'update fetched and staged for next launch', 'info');
    }
  } catch {
    // Silent no-op — keep running the current bundle. A failed check or fetch
    // must never surface to the user or block app start.
  }
}

/**
 * Registers an AppState listener that applies a staged update by reloading
 * the moment the app goes to the background.
 *
 * This guarantees the user is never interrupted mid-session: by the time
 * reloadAsync runs they have already left the app, and they return to the new
 * bundle. If the app is killed before backgrounding, expo-updates applies the
 * staged update on the next cold launch anyway. Returns an unsubscribe
 * function (suitable as a useEffect cleanup).
 */
export function registerOtaReloadHandler(): () => void {
  const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next !== 'background' || !updateStaged) return;

    // Disarm first so repeated background transitions can't double-reload.
    updateStaged = false;
    addBreadcrumb('ota', 'applying staged update via reloadAsync', 'info');
    Updates.reloadAsync().catch(() => {
      // Reload failed (rare). The staged update still applies on the next cold
      // launch, so re-arm and let a later background transition retry.
      updateStaged = true;
    });
  });

  return () => sub.remove();
}
