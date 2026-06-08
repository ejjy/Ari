import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { initSentry } from './src/config/sentry';
import { initAnalytics, track } from './src/lib/analytics';
import { checkAndApplyUpdate, registerOtaReloadHandler } from './src/lib/otaUpdates';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { PrivacyProvider } from './src/context/PrivacyContext';
import RootNavigator from './src/navigation/RootNavigator';

// Initialize Sentry + PostHog early so the very first render can fire events.
// `app_opened` here represents a true cold start (process boot). Warm
// foregrounding is tracked separately via the AppState listener below.
initSentry();
initAnalytics().then(() => track('app_opened', { source: 'cold' }));

// Fire-and-forget OTA check on cold start. Never blocks the splash: if a newer
// JS bundle exists it's downloaded in the background and applied when the app
// is next backgrounded (see registerOtaReloadHandler) or on the next cold
// launch. All failures are silent no-ops.
checkAndApplyUpdate();

function App() {
  // Tracks the wall-clock time spent in the foreground for the current
  // session. Reset on every transition into 'active'. Used to compute
  // `foreground_duration_sec` on backgrounding — the input to D1/D7
  // engagement cohorts and push-open attribution.
  const foregroundedAtRef = useRef<number>(Date.now());
  const backgroundedAtRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      // background → active : warm foreground. This is the event that
      // separates "user came back" from "user installed". We deliberately
      // do NOT fire app_opened again — `source` is the dimension that
      // distinguishes cold vs warm in PostHog dashboards.
      if (next === 'active' && (prev === 'background' || prev === 'inactive')) {
        // Phantom-event guard. iOS fires 'inactive' for Face ID prompts,
        // control-center swipes, and notification glances — sometimes
        // without ever transitioning to 'background'. Without this guard
        // every such interruption produces a spurious app_foregrounded
        // with background_duration_sec=null. Only fire if we actually
        // observed the matching active→background transition.
        if (backgroundedAtRef.current === null) return;

        const backgroundDurationSec = Math.round(
          (Date.now() - backgroundedAtRef.current) / 1000
        );
        backgroundedAtRef.current = null;
        foregroundedAtRef.current = Date.now();
        track('app_foregrounded', {
          background_duration_sec: backgroundDurationSec,
        });
      }

      // active → background : measure session length. iOS fires 'inactive'
      // briefly during control-center swipe — we only commit on actual
      // background to avoid noisy short sessions polluting the histogram.
      if (next === 'background' && prev === 'active') {
        const foregroundDurationSec = Math.round(
          (Date.now() - foregroundedAtRef.current) / 1000
        );
        backgroundedAtRef.current = Date.now();
        track('app_backgrounded', {
          foreground_duration_sec: foregroundDurationSec,
        });
      }
    });

    return () => sub.remove();
  }, []);

  // Apply a staged OTA update when the app goes to background, so an active
  // user is never interrupted mid-session by a reload.
  useEffect(() => registerOtaReloadHandler(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <NavigationContainer>
            <AuthProvider>
              <DataProvider>
                <PrivacyProvider>
                  <StatusBar style="light" />
                  <RootNavigator />
                </PrivacyProvider>
              </DataProvider>
            </AuthProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
