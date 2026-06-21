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
import TransactionItem from '../components/TransactionItem';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import { color, font, type } from '../theme/tokens';
import { todayISO } from '../utils/dateHelpers';
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

/**
 * Home — forest-on-cream, stripped to the prototype (docs/ari-v2-forest.html):
 * date eyebrow, greeting, "Spent today" hero, one Add-entry CTA, Tomo brief,
 * Recent list. Quick Actions grid, banners, group balance, nudge and insights
 * were removed from Home this sprint; they remain reachable via the existing
 * bottom tabs until the nav/FAB restructure (Commit 6).
 */
export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { transactions, loadingData, refreshing, fetchAll, refresh } = useData();
  const haptics = useHaptics();

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const today = todayISO();
  const { moneyIn, moneyOut } = useMemo(() => {
    let mi = 0;
    let mo = 0;
    for (const t of transactions) {
      if (t.date !== today) continue;
      if (t.type === 'income') mi += t.amount;
      else mo += t.amount;
    }
    return { moneyIn: mi, moneyOut: mo };
  }, [transactions, today]);
  const netToday = moneyIn - moneyOut;

  const recentTxns = useMemo(() => transactions.slice(0, 5), [transactions]);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    []
  );

  const handleAddEntry = useCallback(() => {
    haptics.medium();
    navigation.navigate('AddTransaction', { type: 'expense' });
  }, [haptics, navigation]);

  const handleSeeAll = useCallback(() => {
    navigation.navigate('Tabs', { screen: 'Transactions' });
  }, [navigation]);

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
            tintColor={color.forest}
            colors={[color.forest]}
          />
        }
      >
        <AnimatedEntry delay={0}>
          <Text style={styles.eyebrow}>{dateLabel}</Text>
          <Text style={styles.greet}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
          </Text>
        </AnimatedEntry>

        <AnimatedEntry delay={80}>
          <BalanceCard
            spentToday={moneyOut}
            moneyIn={moneyIn}
            moneyOut={moneyOut}
            netToday={netToday}
          />
        </AnimatedEntry>

        <AnimatedEntry delay={140}>
          <TouchableOpacity
            style={styles.addCta}
            activeOpacity={0.9}
            onPress={handleAddEntry}
            accessibilityRole="button"
            accessibilityLabel="Add an entry"
          >
            <View style={styles.plus}>
              <Text style={styles.plusText}>+</Text>
            </View>
            <Text style={styles.addCtaText}>Add an entry</Text>
          </TouchableOpacity>
        </AnimatedEntry>

        <AnimatedEntry delay={200}>
          <CoachingBriefCard />
        </AnimatedEntry>

        <AnimatedEntry delay={260}>
          <View style={styles.secHead}>
            <Text style={styles.secTitle}>Recent</Text>
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
              title="No entries yet"
              subtitle="Add your first spend or income"
              actionLabel="Add an entry"
              onAction={handleAddEntry}
            />
          ) : (
            recentTxns.map((txn, i) => (
              <AnimatedEntry key={txn.id} delay={300 + i * 60}>
                <TransactionItem
                  transaction={txn}
                  showDelete={false}
                  onEdit={(t) =>
                    navigation.navigate('AddTransaction', {
                      editTransaction: {
                        id: t.id,
                        type: t.type,
                        amount: t.amount,
                        category: t.category,
                        description: t.description,
                        note: t.note,
                        date: t.date,
                      },
                    })
                  }
                />
              </AnimatedEntry>
            ))
          )}
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  container: { paddingHorizontal: 22, paddingTop: 8 },
  eyebrow: {
    fontFamily: font.bodyBold,
    fontSize: type.eyebrow,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: color.moss,
  },
  greet: {
    fontFamily: font.display,
    fontSize: type.greeting,
    letterSpacing: -0.3,
    marginTop: 5,
    color: color.forestDeep,
  },
  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: color.forest2,
    borderRadius: 20,
    paddingVertical: 19,
  },
  plus: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 1.5,
    borderColor: 'rgba(244,239,227,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 19,
    color: color.cream,
  },
  addCtaText: {
    fontFamily: font.bodySemi,
    fontSize: type.screenTitle,
    color: color.cream,
  },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 26,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  secTitle: {
    fontFamily: font.displaySemi,
    fontSize: type.sectionHead,
    color: color.forestDeep,
  },
  seeAll: {
    fontFamily: font.bodySemi,
    fontSize: 12.5,
    color: color.moss,
  },
});
