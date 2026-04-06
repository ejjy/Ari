import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';

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

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const haptics = useHaptics();

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

  const menuItems: MenuItem[] = [
    { emoji: '🔔', label: 'Notifications', subtitle: 'Spending alerts & reminders' },
    { emoji: '🔒', label: 'Privacy & Security', subtitle: 'Manage your data' },
    { emoji: '📤', label: 'Export Data', subtitle: 'Download your transactions' },
    { emoji: '💬', label: 'Help & Support', subtitle: 'FAQs and contact us' },
    { emoji: '⭐', label: 'Rate Ari', subtitle: 'Share your feedback' },
    { emoji: 'ℹ️', label: 'About', subtitle: 'Version 1.0.0' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile Card */}
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

        {/* Profile Details */}
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

        {/* Menu Items */}
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

        {/* Tomo Branding */}
        <View style={styles.brandRow}>
          <Text style={styles.brandEmoji}>🤖</Text>
          <Text style={styles.brandText}>Powered by Tomo AI</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>🚪 Sign Out</Text>
        </TouchableOpacity>
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
