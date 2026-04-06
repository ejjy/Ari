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
import { Colors } from '../constants/colors';
import { groupTransactionsByDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatCurrency';
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
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <Text style={styles.screenTitle}>Transactions</Text>

            {/* Summary Pills */}
            <View style={styles.pills}>
              <View style={[styles.pill, styles.incomePill]}>
                <Text style={styles.pillLabel}>↑ Income</Text>
                <Text style={styles.pillIncome}>{formatCurrency(income)}</Text>
              </View>
              <View style={[styles.pill, styles.expensePill]}>
                <Text style={styles.pillLabel}>↓ Expenses</Text>
                <Text style={styles.pillExpense}>{formatCurrency(expenses)}</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <Icon name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
                selectionColor={Colors.primary}
                accessibilityLabel="Search transactions"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <Icon name="x" size={18} color={Colors.textSecondary} />
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
            ? `Delete "${toDelete.description || toDelete.category}" of ${formatCurrency(toDelete.amount)}?`
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
  safe: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: 20 },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  pills: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pill: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  incomePill: { backgroundColor: 'rgba(0,200,150,0.08)' },
  expensePill: { backgroundColor: 'rgba(255,71,87,0.08)' },
  pillLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  pillIncome: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  pillExpense: { fontSize: 16, fontWeight: '700', color: Colors.danger },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.background, fontWeight: '600' },
  dateHeader: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
