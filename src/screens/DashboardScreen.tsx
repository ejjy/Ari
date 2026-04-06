import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BalanceCard from '../components/BalanceCard';
import NudgeCard from '../components/NudgeCard';
import TransactionItem from '../components/TransactionItem';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import AnimatedFAB from '../components/ui/AnimatedFAB';
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

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
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
    React.useCallback(() => {
      fetchAll();
      fetchNudge();
      fetchInsights();
    }, [fetchAll, fetchNudge, fetchInsights])
  );

  const income = summary?.income ?? 0;
  const expenses = summary?.expenses ?? 0;
  const balance = summary?.balance ?? income - expenses;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const recentTxns = transactions.slice(0, 5);

  const insightColors: Record<string, string> = {
    warning: Colors.danger,
    tip: Colors.accent,
    positive: Colors.primary,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
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
        {/* Header */}
        <AnimatedEntry delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>
                {user?.name?.split(' ')[0] ?? 'there'} 👋
              </Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name ?? 'U')[0].toUpperCase()}
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
            {[
              { emoji: '💸', label: 'Add Expense', type: 'expense' as const },
              { emoji: '💰', label: 'Add Income', type: 'income' as const },
              { emoji: '🎯', label: 'Budgets', tab: 'Budget' },
              { emoji: '🤖', label: 'Ask Tomo', tab: 'Tomo' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickBtn}
                activeOpacity={0.75}
                onPress={() => {
                  haptics.light();
                  if ('type' in action) {
                    navigation.navigate('AddTransaction', { type: action.type });
                  } else {
                    navigation.navigate('Tabs', { screen: action.tab as keyof TabParamList });
                  }
                }}
              >
                <Text style={styles.quickEmoji}>{action.emoji}</Text>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntry>

        {/* Nudge */}
        {nudge && (
          <AnimatedEntry delay={240}>
            <NudgeCard nudge={nudge} />
          </AnimatedEntry>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <AnimatedEntry delay={320}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Monthly Insights</Text>
              <View style={styles.insightsList}>
                {insights.slice(0, 3).map((insight, i) => (
                  <View
                    key={i}
                    style={[
                      styles.insightRow,
                      { borderLeftColor: insightColors[insight.type] ?? Colors.primary },
                    ]}
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
                onPress={() =>
                  navigation.navigate('Tabs', { screen: 'Transactions' })
                }
              >
                <Text style={styles.seeAll}>See all →</Text>
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
                onAction={() => {
                  haptics.light();
                  navigation.navigate('AddTransaction', { type: 'expense' });
                }}
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

      {/* Animated FAB */}
      <AnimatedFAB
        onPress={() => {
          haptics.medium();
          navigation.navigate('AddTransaction', { type: 'expense' });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
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
    gap: 6,
  },
  quickEmoji: { fontSize: 24 },
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
});
