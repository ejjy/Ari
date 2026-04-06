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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { useBiometric } from '../hooks/useBiometric';
import { useNotifications } from '../hooks/useNotifications';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import ExportScreen from './ExportScreen';
import AboutScreen from './AboutScreen';

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
  emoji: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
}

type SubScreen = 'main' | 'export' | 'about';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const haptics = useHaptics();
  const { isAvailable: biometricAvailable, isEnabled: biometricEnabled, toggleBiometric } = useBiometric();
  const { isEnabled: notificationsEnabled, toggleNotifications, sendTestNotification } = useNotifications();
  const [subScreen, setSubScreen] = useState<SubScreen>('main');

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

  if (subScreen === 'export') {
    return <ExportScreen onBack={() => setSubScreen('main')} />;
  }

  if (subScreen === 'about') {
    return <AboutScreen onBack={() => setSubScreen('main')} />;
  }

  const menuItems: MenuItem[] = [
    { emoji: '📤', label: 'Export Data', subtitle: 'Download your transactions', onPress: () => { haptics.light(); setSubScreen('export'); } },
    { emoji: '🔒', label: 'Privacy & Security', subtitle: 'Manage your data', onPress: handlePrivacy },
    { emoji: '💬', label: 'Help & Support', subtitle: 'FAQs and contact us', onPress: handleHelp },
    { emoji: '⭐', label: 'Rate Ari', subtitle: 'Share your feedback', onPress: handleRate },
    { emoji: 'ℹ️', label: 'About', subtitle: 'Version 1.0.0', onPress: () => { haptics.light(); setSubScreen('about'); } },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
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
              <Text style={styles.menuEmoji}>🔔</Text>
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
              />
            </View>
            {biometricAvailable && (
              <>
                <View style={styles.separator} />
                <View style={styles.toggleRow}>
                  <Text style={styles.menuEmoji}>🔐</Text>
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
                  />
                </View>
              </>
            )}
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
                >
                  <Text style={styles.menuEmoji}>{item.emoji}</Text>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, item.destructive && { color: Colors.danger }]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                {i < menuItems.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </AnimatedEntry>

        {/* Tomo Branding */}
        <AnimatedEntry delay={240}>
          <View style={styles.brandRow}>
            <Text style={styles.brandEmoji}>🤖</Text>
            <Text style={styles.brandText}>Powered by Tomo AI</Text>
          </View>
        </AnimatedEntry>

        {/* Logout */}
        <AnimatedEntry delay={300}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>🚪 Sign Out</Text>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
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
  menuEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.textMuted },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 42 },
  brandRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 20,
  },
  brandEmoji: { fontSize: 20 },
  brandText: { fontSize: 13, color: Colors.textMuted },
  logoutBtn: {
    borderWidth: 1.5, borderColor: Colors.danger,
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: 'rgba(255,71,87,0.08)',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.danger },
});
