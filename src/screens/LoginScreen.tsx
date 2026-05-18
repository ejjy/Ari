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
import { Sentry, addBreadcrumb } from '../config/sentry';

// Map backend / network failures to messages a user can actually act on.
// Anything we don't recognise gets a generic fallback + a Sentry capture so
// we can grow the lookup table without leaking raw 502 bodies to users.
function humanizeLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Wrong email or password. Please try again.';
    if (err.status === 400) return 'Please enter a valid email and password.';
    if (err.status === 404) return 'No account found for this email. Please sign up first.';
    if (err.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (err.status >= 500) {
      Sentry.captureMessage(`login_failed_${err.status}`, {
        level: 'error',
        extra: { message: err.message },
      });
      return 'Our servers are having a moment. Please try again shortly.';
    }
    if (err.status === 0) return 'No internet connection. Please check your network and try again.';
  }
  Sentry.captureMessage('login_failed_unknown', {
    level: 'error',
    extra: { message: err instanceof Error ? err.message : String(err) },
  });
  return 'Login failed. Please try again.';
}

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
    addBreadcrumb('auth', 'LoginScreen: google tapped');
    try {
      const res = await google.signIn();
      if (!res.ok) {
        if (!res.cancelled) setError(res.error ?? 'Google sign-in failed. Please try again.');
        return;
      }
      const me = await authApi.getMe();
      await refreshFromSession(me);
    } catch (e) {
      // Anything reaching here is unexpected (socialAuth handles its own
      // failure cases). Log, show generic.
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)), {
        tags: { where: 'LoginScreen.handleGoogle' },
      });
      setError('Sign-in failed. Please try again or use your email.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);
    addBreadcrumb('auth', 'LoginScreen: submitting');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(humanizeLoginError(err));
    } finally {
      setLoading(false);
    }
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

          </View>

          {/* Footer */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.footer}
            accessibilityRole="button"
          >
            <Text style={styles.footerText}>
              Don&apos;t have an account?{' '}
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
