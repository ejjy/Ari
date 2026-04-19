import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { initSentry } from './src/config/sentry';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { PrivacyProvider } from './src/context/PrivacyContext';
import RootNavigator from './src/navigation/RootNavigator';

// Initialize Sentry early
initSentry();

function App() {
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
