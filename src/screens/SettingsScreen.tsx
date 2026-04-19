import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Switch,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { useBiometric } from '../hooks/useBiometric';
import { useNotifications } from '../hooks/useNotifications';
import { usePrivacy } from '../context/PrivacyContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { MainStackParamList } from '../navigation/navigationTypes';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import ExportScreen from './ExportScreen';
import AboutScreen from './AboutScreen';
import ManageCategoriesScreen from './ManageCategoriesScreen';
import { submitFeedback } from '../api/feedback';
import { deleteAccount } from '../api/account';

const AGE_LABELS: Record<string, string> = {
  'under-18': 'Under 18', '18-24': '18–24', '25-35': '25–35',
  '36-50': '36–50', '50+': '50+',
  teen: 'Under 18', young: '18–35', adult: '36–50', senior: '50+',
};

const INCOME_LABELS: Record<string, string> = {
  'under-15k': 'Under ₹15K', '15k-30k': '₹15K–30K',
  '30k-60k': '₹30K–60K', '60k-1L': '₹60K–1L', '1L+': '₹1L+',
};

const GOAL_LABELS: Record<string, string> = {
  save_more: '🏦 Save More', pay_debt: '💳 Pay Off Debt',
  invest: '📈 Invest', build_emergency: '🛡️ Emergency Fund',
  buy_home: '🏠 Buy a Home', track: '📊 Just Track',
};

interface MenuItem {
  icon: IconName;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
}

type SubScreen = 'main' | 'export' | 'about' | 'categories';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { isAvailable: biometricAvailable, isEnabled: biometricEnabled, toggleBiometric } = useBiometric();
  const { isEnabled: notificationsEnabled, toggleNotifications, sendTestNotification } = useNotifications();
  const { isPrivate, togglePrivate } = usePrivacy();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [subScreen, setSubScreen] = useState<SubScreen>('main');

  // Feedback state
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Delete Account state
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          haptics.medium();
          await logout();
        },
      },
    ]);
  };

  const handleNotifications = async () => {
    haptics.light();
    await toggleNotifications();
  };

  const handleBiometric = async () => {
    haptics.light();
    await toggleBiometric();
  };

  const handlePrivacy = () => {
    haptics.light();
    Alert.alert(
      'Privacy & Security',
      'Your data is encrypted and stored securely. We never sell your financial information to third parties.\n\nBiometric lock adds an extra layer of security when you open the app.',
      [{ text: 'Got it' }]
    );
  };

  const handleHelp = () => {
    haptics.light();
    Alert.alert(
      'Help & Support',
      'Need help with Ari?\n\nCommon questions:\n- How to add a transaction?\n  Tap the + button on any screen\n\n- How to set a budget?\n  Go to Budget tab and tap + Add\n\n- Who is Tomo?\n  Your AI finance coach! Ask him anything in the Tomo tab',
      [{ text: 'Close' }]
    );
  };

  const handleRate = () => {
    haptics.light();
    Alert.alert(
      'Rate Ari',
      'Enjoying Ari? Your rating helps us grow and build more features!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        {
          text: 'Rate Now',
          onPress: () => {
            const storeUrl = Platform.OS === 'ios'
              ? 'https://apps.apple.com/app/ari/id0000000000'
              : 'https://play.google.com/store/apps/details?id=com.ari.app';
            Linking.openURL(storeUrl).catch(() => {});
          },
        },
      ]
    );
  };

  // ── Feedback ──────────────────────────────────────────────────────

  const handleOpenFeedback = () => {
    haptics.light();
    setFeedbackMessage('');
    setFeedbackRating(0);
    setFeedbackVisible(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Oops', 'Please write your feedback before submitting.');
      return;
    }
    setFeedbackLoading(true);
    try {
      await submitFeedback({
        message: feedbackMessage.trim(),
        rating: feedbackRating > 0 ? feedbackRating : undefined,
      });
      haptics.success();
      setFeedbackVisible(false);
      Alert.alert('Thank You! 💚', 'Your feedback helps us make Ari better for everyone.');
    } catch {
      Alert.alert('Error', 'Could not submit feedback. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // ── Delete Account ────────────────────────────────────────────────

  const handleOpenDeleteAccount = () => {
    haptics.medium();
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your financial data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setDeletePassword('');
            setShowDeletePassword(false);
            setDeleteVisible(true);
          },
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Required', 'Please enter your password to confirm.');
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      haptics.medium();
      setDeleteVisible(false);
      Alert.alert('Account Deleted', 'Your account has been permanently deleted. We are sorry to see you go.');
      await logout();
    } catch (err: any) {
      const msg = err?.message ?? 'Could not delete account. Please check your password and try again.';
      Alert.alert('Error', msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (subScreen === 'export') {
    return <ExportScreen onBack={() => setSubScreen('main')} />;
  }

  if (subScreen === 'about') {
    return <AboutScreen onBack={() => setSubScreen('main')} />;
  }

  if (subScreen === 'categories') {
    return <ManageCategoriesScreen onBack={() => setSubScreen('main')} />;
  }

  const tier = user?.tier ?? 'free';
  const isSubscribed = tier !== 'free';

  const menuItems: MenuItem[] = [
    {
      icon: 'sparkles',
      label: isSubscribed ? `Ari ${tier[0].toUpperCase() + tier.slice(1)}` : 'Upgrade to Ari Pro',
      subtitle: isSubscribed
        ? 'Manage your subscription'
        : 'Unlock the weekly brief, AA sync, and more',
      onPress: () => { haptics.light(); navigation.navigate('Paywall'); },
    },
    { icon: 'list', label: 'Manage Categories', subtitle: 'Add custom expense & income types', onPress: () => { haptics.light(); setSubScreen('categories'); } },
    { icon: 'upload', label: 'Export Data', subtitle: 'Download your transactions', onPress: () => { haptics.light(); setSubScreen('export'); } },
    { icon: 'message-circle', label: 'Send Feedback', subtitle: 'Help us improve Ari', onPress: handleOpenFeedback },
    { icon: 'shield', label: 'Privacy & Security', subtitle: 'Manage your data', onPress: handlePrivacy },
    { icon: 'help-circle', label: 'Help & Support', subtitle: 'FAQs and contact us', onPress: handleHelp },
    { icon: 'star', label: 'Rate Ari', subtitle: 'Love Ari? Let us know!', onPress: handleRate },
    { icon: 'info', label: 'About', subtitle: 'Version 1.0.0', onPress: () => { haptics.light(); setSubScreen('about'); } },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile Card */}
        <AnimatedEntry delay={0}>
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarInitial}>
                {(user?.name ?? 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </AnimatedEntry>

        {/* Profile Details */}
        <AnimatedEntry delay={80}>
          <View style={styles.detailsCard}>
            {[
              { label: 'Age Group', value: AGE_LABELS[user?.ageGroup ?? ''] ?? user?.ageGroup, emoji: '📅' },
              { label: 'Monthly Income', value: INCOME_LABELS[user?.incomeBracket ?? ''] ?? user?.incomeBracket, emoji: '💰' },
              { label: 'Main Goal', value: GOAL_LABELS[user?.mainGoal ?? ''] ?? user?.mainGoal, emoji: '🎯' },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailEmoji}>{item.emoji}</Text>
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value ?? '—'}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </AnimatedEntry>

        {/* Toggles */}
        <AnimatedEntry delay={140}>
          <View style={styles.menuCard}>
            <View style={styles.toggleRow}>
              <View style={styles.menuIconWrap}>
                <Icon name="bell" size={20} color={Colors.textSecondary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Daily Reminders</Text>
                <Text style={styles.menuSubtitle}>
                  {notificationsEnabled ? 'Tomo reminds you at 8 PM' : 'Get nudged to log expenses'}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotifications}
                trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                thumbColor={notificationsEnabled ? Colors.primary : Colors.textMuted}
                accessibilityLabel="Toggle daily reminders"
              />
            </View>
            {biometricAvailable && (
              <>
                <View style={styles.separator} />
                <View style={styles.toggleRow}>
                  <View style={styles.menuIconWrap}>
                    <Icon name="fingerprint" size={20} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuLabel}>Biometric Lock</Text>
                    <Text style={styles.menuSubtitle}>
                      {biometricEnabled ? 'App requires authentication' : 'Secure with fingerprint/face'}
                    </Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometric}
                    trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                    thumbColor={biometricEnabled ? Colors.primary : Colors.textMuted}
                    accessibilityLabel="Toggle biometric lock"
                  />
                </View>
              </>
            )}
            <View style={styles.separator} />
            <View style={styles.toggleRow}>
              <View style={styles.menuIconWrap}>
                <Icon name={isPrivate ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Private Mode</Text>
                <Text style={styles.menuSubtitle}>
                  {isPrivate ? 'Amounts hidden across the app' : 'Hide balances in public'}
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={() => {
                  haptics.light();
                  togglePrivate();
                }}
                trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                thumbColor={isPrivate ? Colors.primary : Colors.textMuted}
                accessibilityLabel="Toggle private mode"
              />
            </View>
          </View>
        </AnimatedEntry>

        {/* Menu Items */}
        <AnimatedEntry delay={220}>
          <View style={styles.menuCard}>
            {menuItems.map((item, i) => (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <View style={styles.menuIconWrap}>
                    <Icon name={item.icon} size={20} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, item.destructive && { color: Colors.danger }]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  <Icon name="chevron-right" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                {i < menuItems.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </AnimatedEntry>

        {/* Tomo Branding */}
        <AnimatedEntry delay={240}>
          <View style={styles.brandRow}>
            <Icon name="bot" size={18} color={Colors.textMuted} />
            <Text style={styles.brandText}>Powered by Tomo AI</Text>
          </View>
        </AnimatedEntry>

        {/* Danger Zone */}
        <AnimatedEntry delay={300}>
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityLabel="Sign Out"
              accessibilityRole="button"
            >
              <View style={styles.logoutInner}>
                <Icon name="log-out" size={18} color={Colors.danger} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleOpenDeleteAccount}
              activeOpacity={0.8}
              accessibilityLabel="Delete Account"
              accessibilityRole="button"
            >
              <View style={styles.logoutInner}>
                <Icon name="trash" size={18} color={Colors.textMuted} />
                <Text style={styles.deleteText}>Delete Account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </AnimatedEntry>
      </ScrollView>

      {/* ── Feedback Modal ─────────────────────────────────────────── */}
      <Modal visible={feedbackVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon name="x" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              We'd love to hear from you! Tell us what you like, what could be better, or any feature ideas.
            </Text>

            {/* Star Rating */}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>How's your experience?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => { haptics.light(); setFeedbackRating(s); }}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Text style={[styles.starIcon, feedbackRating >= s && styles.starActive]}>
                      {feedbackRating >= s ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.feedbackInput}
              placeholder="Write your feedback..."
              placeholderTextColor={Colors.textMuted}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              multiline
              numberOfLines={5}
              maxLength={1000}
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>{feedbackMessage.length}/1000</Text>

            <TouchableOpacity
              style={[styles.submitBtn, (!feedbackMessage.trim() || feedbackLoading) && styles.submitBtnDisabled]}
              onPress={handleSubmitFeedback}
              disabled={!feedbackMessage.trim() || feedbackLoading}
              activeOpacity={0.8}
            >
              {feedbackLoading ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete Account Modal ───────────────────────────────────── */}
      <Modal visible={deleteVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.danger }]}>Delete Account</Text>
              <TouchableOpacity onPress={() => setDeleteVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon name="x" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
              <Icon name="alert-triangle" size={20} color={Colors.danger} />
              <Text style={styles.warningText}>
                This will permanently delete your account, all transactions, budgets, savings goals, and financial data. This cannot be undone.
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Enter your password to confirm</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry={!showDeletePassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowDeletePassword(!showDeletePassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={showDeletePassword ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.deleteBtnConfirm, (!deletePassword.trim() || deleteLoading) && styles.submitBtnDisabled]}
              onPress={handleConfirmDelete}
              disabled={!deletePassword.trim() || deleteLoading}
              activeOpacity={0.8}
            >
              {deleteLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.deleteBtnConfirmText}>Permanently Delete My Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  screenTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: 20, letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 20, marginBottom: 16,
  },
  avatarLarge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, fontWeight: '800', color: Colors.background },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: Colors.textSecondary },
  detailsCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, marginBottom: 16,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  detailEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  menuCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
  },
  menuIconWrap: { width: 30, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 42 },
  brandRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 20,
  },
  brandText: { fontSize: 13, color: Colors.textMuted },
  logoutBtn: {
    borderWidth: 1.5, borderColor: Colors.danger,
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: 'rgba(255,71,87,0.08)',
  },
  logoutInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.danger },
  deleteBtn: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  deleteText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },

  // ── Modal styles ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle: {
    fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 20,
  },

  // Feedback
  ratingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  ratingLabel: { fontSize: 14, color: Colors.textSecondary },
  starsRow: { flexDirection: 'row', gap: 6 },
  starIcon: { fontSize: 28, color: Colors.textMuted },
  starActive: { color: Colors.accent },
  feedbackInput: {
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, fontSize: 15, color: Colors.textPrimary,
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12, color: Colors.textMuted, textAlign: 'right', marginTop: 6, marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: Colors.background },

  // Delete Account
  warningBox: {
    flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,71,87,0.1)',
    borderRadius: 12, padding: 14, marginBottom: 20, alignItems: 'flex-start',
  },
  warningText: {
    flex: 1, fontSize: 13, color: Colors.danger, lineHeight: 19,
  },
  fieldLabel: {
    fontSize: 13, color: Colors.textSecondary, marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1, padding: 16, fontSize: 15, color: Colors.textPrimary,
  },
  eyeBtn: { paddingHorizontal: 14 },
  deleteBtnConfirm: {
    backgroundColor: Colors.danger, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  deleteBtnConfirmText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
