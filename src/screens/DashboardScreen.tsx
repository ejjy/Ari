import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BalanceCard from '../components/BalanceCard';
import CoachingBriefCard from '../components/CoachingBriefCard';
import GroupBalanceCard from '../components/GroupBalanceCard';
import NudgeCard from '../components/NudgeCard';
import TransactionItem from '../components/TransactionItem';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import AnimatedEntry from '../components/ui/AnimatedEntry';
// AnimatedFAB removed — Quick Actions row already covers add-expense/income flows.
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import type { TabParamList, MainStackParamList } from '../navigation/navigationTypes';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  StackNavigationProp<MainStackParamList>
>;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACTIONS: {
  icon: IconName;
  iconColor: string;
  label: string;
  type?: 'expense' | 'income';
  tab?: string;
}[] = [
  { icon: 'trending-down', iconColor: Colors.danger, label: 'Add Expense', type: 'expense' },
  { icon: 'trending-up', iconColor: Colors.primary, label: 'Add Income', type: 'income' },
  { icon: 'target', iconColor: Colors.accent, label: 'Budgets', tab: 'Budget' },
  { icon: 'bot', iconColor: Colors.teal, label: 'Ask Tomo', tab: 'Tomo' },
];

const INSIGHT_COLORS: Record<string, string> = {
  warning: Colors.danger,
  tip: Colors.accent,
  positive: Colors.primary,
};

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    transactions,
    summary,
    nudge,
    insights,
    loadingData,
    refreshing,
    fetchAll,
    fetchNudge,
    fetchInsights,
    refresh,
  } = useData();
  const haptics = useHaptics();

  useFocusEffect(
    useCallback(() => {
      fetchAll();
      fetchNudge();
      fetchInsights();
    }, [fetchAll, fetchNudge, fetchInsights])
  );

  const income = summary?.income ?? 0;
  const expenses = summary?.expenses ?? 0;
  const balance = summary?.balance ?? income - expenses;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const recentTxns = useMemo(() => transactions.slice(0, 5), [transactions]);

  const handleQuickAction = useCallback(
    (action: typeof QUICK_ACTIONS[0]) => {
      haptics.light();
      if (action.type) {
        navigation.navigate('AddTransaction', { type: action.type });
      } else if (action.tab) {
        navigation.navigate('Tabs', { screen: action.tab as keyof TabParamList });
      }
    },
    [haptics, navigation]
  );

  const handleSeeAll = useCallback(() => {
    navigation.navigate('Tabs', { screen: 'Transactions' });
  }, [navigation]);

  const handleAddFirst = useCallback(() => {
    haptics.light();
    navigation.navigate('AddTransaction', { type: 'expense' });
  }, [haptics, navigation]);

  // Ensure content doesn't hide behind tab bar
  const bottomPad = 60 + insets.bottom + 80;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header — initial-letter avatar removed for visual cleanliness */}
        <AnimatedEntry delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>
                {user?.name?.split(' ')[0] || 'there'}
              </Text>
            </View>
          </View>
        </AnimatedEntry>

        {/* Balance Card */}
        <AnimatedEntry delay={80}>
          <BalanceCard
            income={income}
            expenses={expenses}
            balance={balance}
            savingsRate={savingsRate}
          />
        </AnimatedEntry>

        {/* Quick Actions */}
        <AnimatedEntry delay={160}>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickBtn}
                activeOpacity={0.75}
                onPress={() => handleQuickAction(action)}
                accessibilityLabel={action.label}
                accessibilityRole="button"
              >
                <View style={[styles.quickIconWrap, { backgroundColor: `${action.iconColor}18` }]}>
                  <Icon name={action.icon} size={20} color={action.iconColor} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntry>

        {/* Weekly / monthly coaching brief — self-hides when cache is empty */}
        <AnimatedEntry delay={220}>
          <CoachingBriefCard />
        </AnimatedEntry>

        {/* Shared-expense net balance — self-hides when no groups / zero net */}
        <AnimatedEntry delay={230}>
          <GroupBalanceCard />
        </AnimatedEntry>

        {/* Nudge */}
        {nudge && (
          <AnimatedEntry delay={240}>
            <NudgeCard nudge={nudge} />
          </AnimatedEntry>
        )}

        {/* Accountant Banner */}
        <AnimatedEntry delay={280}>
          <TouchableOpacity
            style={styles.accountantBanner}
            activeOpacity={0.75}
            onPress={() => {
              haptics.light();
              navigation.navigate('Accountant');
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Ari Accountant"
          >
            <View style={styles.accountantIcon}>
              <Icon name="briefcase" size={22} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountantTitle}>Ari Accountant</Text>
              <Text style={styles.accountantSub}>
                Ledger, goals, tax planner & reports
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </AnimatedEntry>

        {/* To-Do Notes Banner */}
        <AnimatedEntry delay={300}>
          <TouchableOpacity
            style={styles.todoBanner}
            activeOpacity={0.75}
            onPress={() => {
              haptics.light();
              navigation.navigate('TodoNotes');
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Notes and To-Do"
          >
            <View style={[styles.accountantIcon, { backgroundColor: Colors.accent + '20' }]}>
              <Icon name="check-circle" size={22} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountantTitle}>Notes & To-Do</Text>
              <Text style={styles.accountantSub}>
                Tasks, reminders & quick notes
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </AnimatedEntry>

        {/* Insights */}
        {insights.length > 0 && (
          <AnimatedEntry delay={340}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="lightbulb" size={16} color={Colors.accent} />
                <Text style={styles.sectionTitle}> Monthly Insights</Text>
              </View>
              <View style={styles.insightsList}>
                {insights.slice(0, 3).map((insight, i) => (
                  <View
                    key={i}
                    style={[
                      styles.insightRow,
                      { borderLeftColor: INSIGHT_COLORS[insight.type] ?? Colors.primary },
                    ]}
                    accessible
                    accessibilityLabel={`${insight.type} insight: ${insight.text}`}
                  >
                    <Text style={styles.insightText}>{insight.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </AnimatedEntry>
        )}

        {/* Recent Transactions */}
        <AnimatedEntry delay={400}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                onPress={handleSeeAll}
                accessibilityLabel="See all transactions"
                accessibilityRole="link"
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {loadingData ? (
              <LoadingSpinner />
            ) : recentTxns.length === 0 ? (
              <EmptyState
                emoji="💳"
                title="No transactions yet"
                subtitle="Add your first expense or income"
                actionLabel="Add Transaction"
                onAction={handleAddFirst}
              />
            ) : (
              recentTxns.map((txn, i) => (
                <AnimatedEntry key={txn.id} delay={420 + i * 60}>
                  <TransactionItem transaction={txn} showDelete={false} />
                </AnimatedEntry>
              ))
            )}
          </View>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: 20, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.background },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    width: '47%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  insightsList: { gap: 8 },
  insightRow: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    padding: 12,
  },
  insightText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  // Accountant banner
  accountantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.purple + '40',
    padding: 14,
    gap: 12,
    marginTop: 16,
  },
  accountantIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountantTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  accountantSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  todoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    padding: 14,
    gap: 12,
    marginTop: 10,
  },
});
