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
import { color, font } from '../theme/tokens';
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
                    <Icon name={opt.icon} size={22} color={color.forest} />
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
                    <Icon name={opt.icon} size={24} color={color.forest} />
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
  safe: { flex: 1, backgroundColor: color.cream },
  progressTrack: {
    height: 3,
    backgroundColor: color.line,
  },
  progressFill: {
    height: 3,
    backgroundColor: color.forest,
    borderRadius: 2,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  back: { marginBottom: 20, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: color.inkSoft, fontFamily: font.body },
  stepLabel: { fontSize: 12, color: color.forest, fontFamily: font.bodySemi, marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 26, fontFamily: font.displayBold, color: color.ink, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: color.inkSoft, fontFamily: font.body, marginBottom: 28, lineHeight: 20 },
  sectionLabel: { fontSize: 13, color: color.inkSoft, fontFamily: font.bodySemi, marginBottom: 12, marginTop: 4 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  optionTile: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: color.line,
    backgroundColor: color.cream2,
    alignItems: 'center',
    gap: 6,
  },
  optionSelected: { borderColor: color.forest, backgroundColor: color.cream2 },
  optionLabel: { fontSize: 13, color: color.inkSoft, fontFamily: font.bodyMed },
  optionLabelSelected: { color: color.forest, fontFamily: font.bodySemi },
  incomeList: { gap: 8, marginBottom: 24 },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: color.line,
    backgroundColor: color.cream2,
  },
  incomeRowSelected: { borderColor: color.forest, backgroundColor: color.cream2 },
  incomeLabel: { fontSize: 14, color: color.inkSoft, fontFamily: font.bodyMed },
  incomeLabelSelected: { color: color.forest, fontFamily: font.bodySemi },
  checkmark: { fontSize: 16, color: color.forest, fontFamily: font.body },
  goalTile: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: color.line,
    backgroundColor: color.cream2,
    alignItems: 'center',
    gap: 6,
  },
  goalSelected: { borderColor: color.forest, backgroundColor: color.cream2 },
  goalLabel: { fontSize: 12, color: color.inkSoft, fontFamily: font.bodyMed, textAlign: 'center' },
  goalLabelSelected: { color: color.forest, fontFamily: font.bodySemi },
  loginLink: { alignItems: 'center', marginTop: 28 },
  loginLinkText: { fontSize: 14, color: color.inkSoft, fontFamily: font.body },
  loginLinkHighlight: { color: color.forest, fontFamily: font.bodySemi },
});
