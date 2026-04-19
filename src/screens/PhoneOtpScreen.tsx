import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../navigation/navigationTypes';
import { useAuth } from '../context/AuthContext';
import { requestPhoneOtp, verifyPhoneOtp } from '../lib/socialAuth';
import * as authApi from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/ui/Button';
import ErrorBanner from '../components/ui/ErrorBanner';
import Icon from '../components/ui/Icon';
import { Colors } from '../constants/colors';

/**
 * Two-step phone OTP sign-in (spec §2 Auth row: phone OTP via Supabase).
 *
 * Step "phone":  user enters phone with country prefix -> Supabase sends SMS.
 * Step "otp":    user enters the 6-digit code -> Supabase returns a session.
 *                We persist the access_token so the Flask backend sees the
 *                user on the next /api/auth/me call, which is what
 *                AuthContext's session restore hits on app reopen.
 */

type Props = StackScreenProps<AuthStackParamList, 'PhoneOtp'>;

export default function PhoneOtpScreen({ navigation }: Props) {
  const { refreshFromSession } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setError('');
    const trimmed = phone.trim();
    if (!/^\+\d{8,15}$/.test(trimmed)) {
      setError('Enter phone in E.164 format, e.g. +919000000000');
      return;
    }
    setLoading(true);
    const { ok, error } = await requestPhoneOtp(trimmed);
    setLoading(false);
    if (!ok) {
      setError(error ?? 'Could not send OTP');
      return;
    }
    setStep('otp');
  };

  const handleVerify = async () => {
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code sent to your phone');
      return;
    }
    setLoading(true);
    const { ok, error } = await verifyPhoneOtp(phone.trim(), code);
    if (!ok) {
      setLoading(false);
      setError(error ?? 'Verification failed');
      return;
    }
    try {
      // Hydrate the AuthContext user from Flask /me using the fresh token.
      const me = await authApi.getMe();
      await refreshFromSession(me);
    } catch {
      setError('Signed in but could not load profile. Please restart the app.');
      await AsyncStorage.removeItem('ari_token');
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Icon name="send" size={48} color={Colors.primary} />
            <Text style={styles.title}>
              {step === 'phone' ? 'Sign in by phone' : 'Enter the code'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'We\'ll send a one-time code via SMS.'
                : `We sent a 6-digit code to ${phone}.`}
            </Text>
          </View>

          <ErrorBanner message={error} />

          {step === 'phone' ? (
            <>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+919000000000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                returnKeyType="send"
                onSubmitEditing={handleSendOtp}
              />
              <Button onPress={handleSendOtp} loading={loading} fullWidth>
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.label}>6-digit code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />
              <Button onPress={handleVerify} loading={loading} fullWidth>
                Verify & sign in
              </Button>
              <TouchableOpacity
                onPress={() => { setStep('phone'); setCode(''); setError(''); }}
                style={styles.resend}
              >
                <Text style={styles.resendText}>Change number or resend</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  back: { marginBottom: 24, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: Colors.textSecondary },
  header: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: 26, fontWeight: '800',
    color: Colors.textPrimary, marginBottom: 8, marginTop: 12,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: Colors.textPrimary, marginBottom: 16,
  },
  otpInput: {
    letterSpacing: 8, textAlign: 'center',
    fontSize: 22, fontWeight: '700',
  },
  resend: { alignItems: 'center', marginTop: 12, padding: 8 },
  resendText: { fontSize: 13, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
