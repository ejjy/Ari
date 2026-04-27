import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
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

type Props = StackScreenProps<AuthStackParamList, 'Register'>;

const AGE_OPTIONS = [
  { value: 'teen', label: 'Under 18', icon: 'book-open' as const },
  { value: 'young', label: '18–35', icon: 'briefcase' as const },
  { value: 'adult', label: '36–50', icon: 'home' as const },
  { value: 'senior', label: '50+', icon: 'sun' as const },
];

const INCOME_OPTIONS = [
  { value: 'under-15k', label: 'Under ₹15K' },
  { value: '15k-30k', label: '₹15K – ₹30K' },
  { value: '30k-60k', label: '₹30K – ₹60K' },
  { value: '60k-1L', label: '₹60K – ₹1L' },
  { value: '1L+', label: '₹1L+' },
];

const GOAL_OPTIONS = [
  { value: 'save_more', label: 'Save More', icon: 'dollar-sign' as const },
  { value: 'pay_debt', label: 'Pay Off Debt', icon: 'credit-card' as const },
  { value: 'invest', label: 'Start Investing', icon: 'trending-up' as const },
  { value: 'build_emergency', label: 'Emergency Fund', icon: 'shield' as const },
  { value: 'buy_home', label: 'Buy a Home', icon: 'home' as const },
  { value: 'track', label: 'Just Track', icon: 'bar-chart' as const },
];

interface FormData {
  name: string;
  email: string;
  password: string;
  ageGroup: string;
  incomeBracket: string;
  mainGoal: string;
}

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    ageGroup: '25-35',
    incomeBracket: '15k-30k',
    mainGoal: 'save_more',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const progressAnim = useRef(new Animated.Value(33)).current;

  const setField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const animateProgress = (targetPct: number) => {
    Animated.spring(progressAnim, {
      toValue: targetPct,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.name.trim()) { setError('Name is required'); return; }
      if (!form.email.trim()) { setError('Email is required'); return; }
      if (!form.email.includes('@')) { setError('Enter a valid email'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      setStep(2);
      animateProgress(66);
    } else if (step === 2) {
      setStep(3);
      animateProgress(100);
    }
  };

  const prevStep = () => {
    setError('');
    if (step === 1) { navigation.goBack(); return; }
    setStep((s) => s - 1);
    animateProgress(step === 2 ? 33 : 66);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Registration failed. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={prevStep} style={styles.back}>
            <Text style={styles.backText}>← {step === 1 ? 'Back' : 'Previous'}</Text>
          </TouchableOpacity>

          <ErrorBanner message={error} />

          {/* Step 1: Account Info */}
          {step === 1 && (
            <View>
              <Text style={styles.stepLabel}>Step 1 of 3</Text>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Your financial journey starts here</Text>
              <Input
                label="Full Name"
                placeholder="Rahul Sharma"
                value={form.name}
                onChangeText={(v) => setField('name', v)}
                returnKeyType="next"
                autoCorrect={false}
              />
              <Input
                label="Email"
                placeholder="rahul@example.com"
                value={form.email}
                onChangeText={(v) => setField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Input
                label="Password"
                placeholder="At least 6 characters"
                value={form.password}
                onChangeText={(v) => setField('password', v)}
                showPasswordToggle
                returnKeyType="done"
              />
              <Button onPress={nextStep} fullWidth accessibilityLabel="Continue to next step" accessibilityRole="button">
                Continue →
              </Button>
            </View>
          )}

          {/* Step 2: Age & Income */}
          {step === 2 && (
            <View>
              <Text style={styles.stepLabel}>Step 2 of 3</Text>
              <Text style={styles.title}>Tell us about yourself</Text>
              <Text style={styles.subtitle}>So Tomo can give you relevant advice</Text>

              <Text style={styles.sectionLabel}>Age Group</Text>
              <View style={styles.grid2}>
                {AGE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setField('ageGroup', opt.value)}
                    style={[
                      styles.optionTile,
                      form.ageGroup === opt.value && styles.optionSelected,
                    ]}
                    activeOpacity={0.75}
                    accessibilityLabel={`Age group: ${opt.label}`}
                    accessibilityRole="button"
                  >
                    <Icon name={opt.icon} size={22} color={Colors.primary} />
                    <Text
                      style={[
                        styles.optionLabel,
                        form.ageGroup === opt.value && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Monthly Income</Text>
              <View style={styles.incomeList}>
                {INCOME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setField('incomeBracket', opt.value)}
                    style={[
                      styles.incomeRow,
                      form.incomeBracket === opt.value && styles.incomeRowSelected,
                    ]}
                    activeOpacity={0.75}
                    accessibilityLabel={`Income: ${opt.label}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.incomeLabel,
                        form.incomeBracket === opt.value && styles.incomeLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {form.incomeBracket === opt.value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Button onPress={nextStep} fullWidth accessibilityLabel="Continue to next step" accessibilityRole="button">
                Continue →
              </Button>
            </View>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <View>
              <Text style={styles.stepLabel}>Step 3 of 3</Text>
              <Text style={styles.title}>Your main goal?</Text>
              <Text style={styles.subtitle}>We&apos;ll personalise Tomo&apos;s coaching for you</Text>

              <View style={styles.grid2}>
                {GOAL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setField('mainGoal', opt.value)}
                    style={[
                      styles.goalTile,
                      form.mainGoal === opt.value && styles.goalSelected,
                    ]}
                    activeOpacity={0.75}
                    accessibilityLabel={`Goal: ${opt.label}`}
                    accessibilityRole="button"
                  >
                    <Icon name={opt.icon} size={24} color={Colors.primary} />
                    <Text
                      style={[
                        styles.goalLabel,
                        form.mainGoal === opt.value && styles.goalLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button onPress={handleSubmit} loading={loading} fullWidth style={{ marginTop: 8 }} accessibilityLabel="Start my journey" accessibilityRole="button">
                Start My Journey
              </Button>
            </View>
          )}

          {/* Login link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  back: { marginBottom: 20, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: Colors.textSecondary },
  stepLabel: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 28, lineHeight: 20 },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  optionTile: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
    alignItems: 'center',
    gap: 6,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(0,200,150,0.1)' },
  // optionEmoji style replaced by Icon component
  optionLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  optionLabelSelected: { color: Colors.primary, fontWeight: '600' },
  incomeList: { gap: 8, marginBottom: 24 },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
  },
  incomeRowSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(0,200,150,0.1)' },
  incomeLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  incomeLabelSelected: { color: Colors.primary, fontWeight: '600' },
  checkmark: { fontSize: 16, color: Colors.primary },
  goalTile: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
    alignItems: 'center',
    gap: 6,
  },
  goalSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(0,200,150,0.1)' },
  // goalEmoji style replaced by Icon component
  goalLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  goalLabelSelected: { color: Colors.primary, fontWeight: '600' },
  loginLink: { alignItems: 'center', marginTop: 28 },
  loginLinkText: { fontSize: 14, color: Colors.textSecondary },
  loginLinkHighlight: { color: Colors.primary, fontWeight: '600' },
});
