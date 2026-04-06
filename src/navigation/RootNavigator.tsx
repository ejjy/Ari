import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useBiometric } from '../hooks/useBiometric';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import { Colors } from '../constants/colors';
import type { RootStackParamList } from './navigationTypes';

const Stack = createStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = 'ari_onboarding_done';

function BiometricLockScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={lockStyles.container}>
      <Text style={lockStyles.emoji}>🔒</Text>
      <Text style={lockStyles.title}>Ari is Locked</Text>
      <Text style={lockStyles.subtitle}>Authenticate to continue</Text>
      <TouchableOpacity style={lockStyles.btn} onPress={onRetry} activeOpacity={0.85}>
        <Text style={lockStyles.btnText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const lockStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 24 },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.background },
});

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { isAuthenticated, isChecking, authenticate } = useBiometric();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val && !user) setShowOnboarding(true);
      setOnboardingChecked(true);
    });
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (loading || !onboardingChecked || isChecking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // Show biometric lock screen if user is logged in but not authenticated
  if (user && !isAuthenticated) {
    return <BiometricLockScreen onRetry={authenticate} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
