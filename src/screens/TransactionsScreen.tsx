import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import TransactionItem from '../components/TransactionItem';
import DeleteConfirmSheet from '../components/DeleteConfirmSheet';
import EmptyState from '../components/ui/EmptyState';
import AnimatedFAB from '../components/ui/AnimatedFAB';
import Icon from '../components/ui/Icon';
import { color, font, type as ftype } from '../theme/tokens';
import { groupTransactionsByDate } from '../utils/dateHelpers';
import { usePrivacy } from '../context/PrivacyContext';
import { useHaptics } from '../hooks/useHaptics';
import type { Transaction } from '../types';
import type { TabParamList, MainStackParamList } from '../navigation/navigationTypes';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Transactions'>,
  StackNavigationProp<MainStackParamList>
>;

type FilterType = 'all' | 'expense' | 'income';

export default function TransactionsScreen() {
  const navigation = useNavigation<Nav>();
  const {
    transactions,
    summary,
    refreshing,
    deleteTransaction,
    fetchTransactions,
    fetchSummary,
    refresh,
  } = useData();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { formatAmount } = usePrivacy();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      fetchSummary();
    }, [fetchTransactions, fetchSummary])
  );

  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesFilter = filter === 'all' || txn.type === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        txn.description.toLowerCase().includes(q) ||
        txn.category.toLowerCase().includes(q) ||
        txn.note?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, search]);

  const sections = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const income = summary?.income ?? 0;
  const expenses = summary?.expenses ?? 0;

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteTransaction(toDelete.id);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const handleDeletePress = (id: string) => {
    const txn = transactions.find((t) => t.id === id);
    if (txn) {
      haptics.warning();
      setToDelete(txn);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onDelete={handleDeletePress}
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
            showDelete
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.dateHeader}>{section.title}</Text>
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: 60 + insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={color.forest}
            colors={[color.forest]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <Text style={styles.screenTitle}>Trends</Text>

            {/* Summary Pills */}
            <View style={styles.pills}>
              <View style={[styles.pill, styles.incomePill]}>
                <Text style={styles.pillLabel}>↑ Income</Text>
                <Text style={styles.pillIncome}>{formatAmount(income)}</Text>
              </View>
              <View style={[styles.pill, styles.expensePill]}>
                <Text style={styles.pillLabel}>↓ Expenses</Text>
                <Text style={styles.pillExpense}>{formatAmount(expenses)}</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <Icon name="search" size={16} color={color.inkFaint} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor={color.inkFaint}
                value={search}
                onChangeText={setSearch}
                selectionColor={color.forest}
                accessibilityLabel="Search transactions"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <Icon name="x" size={18} color={color.inkSoft} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filters}>
              {(['all', 'expense', 'income'] as FilterType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === f && styles.filterTextActive,
                    ]}
                  >
                    {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="💳"
            title="No transactions found"
            subtitle={
              search || filter !== 'all'
                ? 'Try changing your search or filter'
                : 'Add your first transaction'
            }
            actionLabel={!search && filter === 'all' ? 'Add Transaction' : undefined}
            onAction={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          />
        }
      />

      {/* Animated FAB */}
      <AnimatedFAB
        onPress={() => {
          haptics.medium();
          navigation.navigate('AddTransaction', { type: 'expense' });
        }}
      />

      <DeleteConfirmSheet
        visible={!!toDelete}
        title="Delete Transaction?"
        message={
          toDelete
            ? `Delete "${toDelete.description || toDelete.category}" of ${formatAmount(toDelete.amount)}?`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  listContent: { paddingHorizontal: 20 },
  screenTitle: {
    fontFamily: font.displayBold,
    fontSize: 26,
    color: color.ink,
    marginTop: 8,
    marginBottom: 16,
  },
  pills: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pill: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
  },
  incomePill: {},
  expensePill: {},
  pillLabel: { fontFamily: font.body, fontSize: 11, color: color.inkSoft, marginBottom: 4 },
  pillIncome: { fontFamily: font.bodySemi, fontSize: 16, color: color.forest2 },
  pillExpense: { fontFamily: font.bodySemi, fontSize: 16, color: color.clay },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.cream2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: font.body, fontSize: ftype.body, color: color.ink },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: color.cream2,
    borderWidth: 1,
    borderColor: color.line,
  },
  filterBtnActive: { backgroundColor: color.forest, borderColor: color.forest },
  filterText: { fontFamily: font.bodyMed, fontSize: 13, color: color.inkSoft },
  filterTextActive: { color: color.cream, fontFamily: font.bodySemi },
  dateHeader: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    color: color.inkFaint,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
