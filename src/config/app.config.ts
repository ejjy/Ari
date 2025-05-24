import Constants from 'expo-constants';

interface AppConfig {
  openai: {
    apiKey: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

const getConfig = (): AppConfig => {
  const extra = Constants.expoConfig?.extra || {};

  return {
    openai: {
      apiKey: extra.EXPO_PUBLIC_OPENAI_API_KEY || '',
    },
    firebase: {
      apiKey: extra.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: extra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: extra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: extra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: extra.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    },
  };
};

export const config = getConfig(); 