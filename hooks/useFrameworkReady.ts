import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export function useFrameworkReady() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return null;
}