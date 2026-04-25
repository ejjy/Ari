import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../navigation/navigationTypes';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ErrorBanner from '../components/ui/ErrorBanner';
import { Colors } from '../constants/colors';
import Icon from '../components/ui/Icon';
import { useGoogleSignIn } from '../lib/socialAuth';
import * as authApi from '../api/auth';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, refreshFromSession } = useAuth();
  const google = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setSocialLoading('google');
    try {
      const res = await google.signIn();
      if (!res.ok) {
        if (!res.cancelled) setError(res.error ?? 'Google sign-in failed');
        return;
      }
      const me = await authApi.getMe();
      await refreshFromSession(me);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in error');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@ari.app');
    setPassword('demo123');
    setError('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Icon name="user" size={48} color={Colors.primary} />
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <ErrorBanner message={error} />
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              showPasswordToggle
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Button
              onPress={handleLogin}
              loading={loading}
              fullWidth
              accessibilityLabel="Sign In"
              accessibilityRole="button"
            >
              Sign In
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={handleGoogle}
              style={styles.socialBtn}
              disabled={socialLoading !== null}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              <Icon name="user" size={16} color={Colors.textPrimary} />
              <Text style={styles.socialText}>
                {socialLoading === 'google' ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('PhoneOtp')}
              style={styles.socialBtn}
              accessibilityRole="button"
              accessibilityLabel="Continue with phone"
            >
              <Icon name="send" size={16} color={Colors.textPrimary} />
              <Text style={styles.socialText}>Continue with phone</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={fillDemo}
              style={styles.demoBtn}
              accessibilityLabel="Try with demo account"
              accessibilityRole="button"
            >
              <View style={styles.demoContent}>
                <Icon name="play" size={14} color={Colors.textSecondary} />
                <Text style={styles.demoText}> Try with demo account</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.footer}
            accessibilityRole="button"
          >
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink}>Sign up free</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  back: { marginBottom: 24, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: Colors.textSecondary },
  header: { alignItems: 'center', marginBottom: 40 },
  // emoji style replaced by Icon component
  headerIcon: { marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  form: { flex: 1 },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted, letterSpacing: 0.5 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 10,
    backgroundColor: Colors.input,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 10,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  demoBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoContent: { flexDirection: 'row' as const, alignItems: 'center' as const },
  demoText: { fontSize: 14, color: Colors.textSecondary },
  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
