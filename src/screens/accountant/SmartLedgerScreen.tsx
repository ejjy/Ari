import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, FlatList, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/Icon';
import AnimatedEntry from '../../components/ui/AnimatedEntry';
import EmptyState from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { usePrivacy } from '../../context/PrivacyContext';
import { useHaptics } from '../../hooks/useHaptics';
import { CATEGORY_ICONS } from '../../components/ui/Icon';
import * as txnApi from '../../api/transactions';
import type { Transaction } from '../../types';

// ── Month helpers ────────────────────────────────────────────────────

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function offsetMonth(m: string, delta: number): string {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December',
};

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  return `${MONTH_NAMES[mo] || mo} ${y}`;
}

function formatDate(d: string): string {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return d;
  }
}

// ── Filter types ─────────────────────────────────────────────────────

type FilterType = 'all' | 'income' | 'expense';
type SortBy = 'date' | 'amount';

export default function SmartLedgerScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const { formatAmount } = usePrivacy();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());

  // Filters
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────

  const fetchTxns = useCallback(async () => {
    try {
      const data = await txnApi.getTransactions(month);
      setTransactions(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTxns();
    }, [fetchTxns])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTxns();
  };

  // ── Compute filtered + sorted list ─────────────────────────────────

  const filteredTxns = useMemo(() => {
    let list = [...transactions];

    // Type filter
    if (typeFilter !== 'all') {
      list = list.filter((t) => t.type === typeFilter);
    }

    // Category filter
    if (categoryFilter) {
      list = list.filter((t) => t.category === categoryFilter);
    }

    // Recurring only
    if (showRecurringOnly) {
      list = list.filter((t) => t.isRecurring);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.note?.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // Sort
    if (sortBy === 'amount') {
      list.sort((a, b) => b.amount - a.amount);
    } else {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }

    return list;
  }, [transactions, typeFilter, categoryFilter, searchQuery, sortBy, showRecurringOnly]);

  // ── Stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const income = filteredTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: filteredTxns.length };
  }, [filteredTxns]);

  // ── Category list for filter ───────────────────────────────────────

  const categories = useMemo(() => {
    const catSet = new Set(transactions.map((t) => t.category));
    return Array.from(catSet).sort();
  }, [transactions]);

  // ── Delete handler ─────────────────────────────────────────────────

  const handleDelete = (txn: Transaction) => {
    haptics.medium();
    Alert.alert(
      'Delete Transaction',
      `Delete "${txn.description}" (${formatAmount(txn.amount)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await txnApi.deleteTransaction(txn.id);
              setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
              haptics.success();
            } catch {
              Alert.alert('Error', 'Could not delete transaction.');
            }
          },
        },
      ]
    );
  };

  // ── Month Navigation ───────────────────────────────────────────────

  const goMonth = (delta: number) => {
    haptics.light();
    setMonth((m) => offsetMonth(m, delta));
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Smart Ledger</Text>
          <Text style={styles.headerSub}>Detailed transaction analysis</Text>
        </View>
        <TouchableOpacity
          onPress={() => { haptics.light(); setShowFilters(!showFilters); }}
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
        >
          <Icon name="search" size={18} color={showFilters ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => goMonth(-1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="chevron-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatMonth(month)}</Text>
        <TouchableOpacity onPress={() => goMonth(1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="chevron-right" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Search */}
          <View style={styles.searchRow}>
            <Icon name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, category, tags..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Type tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(['all', 'income', 'expense'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, typeFilter === f && styles.chipActive]}
                onPress={() => { haptics.light(); setTypeFilter(f); }}
              >
                <Text style={[styles.chipText, typeFilter === f && styles.chipTextActive]}>
                  {f === 'all' ? 'All' : f === 'income' ? '↑ Income' : '↓ Expense'}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.chipDivider} />
            <TouchableOpacity
              style={[styles.chip, showRecurringOnly && styles.chipActive]}
              onPress={() => { haptics.light(); setShowRecurringOnly(!showRecurringOnly); }}
            >
              <Icon name="refresh-cw" size={12} color={showRecurringOnly ? Colors.background : Colors.textMuted} />
              <Text style={[styles.chipText, showRecurringOnly && styles.chipTextActive]}>Recurring</Text>
            </TouchableOpacity>
            <View style={styles.chipDivider} />
            <TouchableOpacity
              style={[styles.chip, sortBy === 'amount' && styles.chipActive]}
              onPress={() => { haptics.light(); setSortBy(sortBy === 'date' ? 'amount' : 'date'); }}
            >
              <Text style={[styles.chipText, sortBy === 'amount' && styles.chipTextActive]}>
                {sortBy === 'amount' ? '₹ Amount' : '📅 Date'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Category chips */}
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !categoryFilter && styles.chipActive]}
                onPress={() => { haptics.light(); setCategoryFilter(null); }}
              >
                <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive]}>All Categories</Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const ci = CATEGORY_ICONS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, categoryFilter === cat && { backgroundColor: ci?.color || Colors.primary, borderColor: ci?.color || Colors.primary }]}
                    onPress={() => { haptics.light(); setCategoryFilter(categoryFilter === cat ? null : cat); }}
                  >
                    <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{stats.count} txns</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: Colors.primary }]}>↑ {formatAmount(stats.income)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: Colors.danger }]}>↓ {formatAmount(stats.expense)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: stats.net >= 0 ? Colors.primary : Colors.danger, fontWeight: '700' }]}>
            = {formatAmount(stats.net)}
          </Text>
        </View>
      </View>

      {/* Transaction list */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredTxns.length === 0 ? (
        <EmptyState
          emoji={searchQuery || categoryFilter || typeFilter !== 'all' ? '🔍' : '📝'}
          title={searchQuery || categoryFilter || typeFilter !== 'all' ? 'No matches' : 'No transactions'}
          subtitle={searchQuery || categoryFilter || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Add transactions to see them here'}
        />
      ) : (
        <FlatList
          data={filteredTxns}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item: txn, index }) => {
            const ci = CATEGORY_ICONS[txn.category];
            const isIncome = txn.type === 'income';
            return (
              <AnimatedEntry delay={Math.min(index * 30, 300)}>
                <TouchableOpacity
                  style={styles.txnCard}
                  onLongPress={() => handleDelete(txn)}
                  activeOpacity={0.8}
                  delayLongPress={500}
                >
                  {/* Left icon */}
                  <View style={[styles.txnIcon, { backgroundColor: (ci?.color || Colors.textMuted) + '20' }]}>
                    <Icon name={(ci?.icon || 'package') as IconName} size={18} color={ci?.color || Colors.textMuted} />
                  </View>

                  {/* Middle */}
                  <View style={styles.txnInfo}>
                    <View style={styles.txnTitleRow}>
                      <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
                      {txn.isRecurring && (
                        <View style={styles.recurBadge}>
                          <Icon name="refresh-cw" size={10} color={Colors.accent} />
                        </View>
                      )}
                    </View>
                    <View style={styles.txnMeta}>
                      <Text style={styles.txnCategory}>
                        {txn.category.charAt(0).toUpperCase() + txn.category.slice(1)}
                      </Text>
                      <Text style={styles.txnDot}>·</Text>
                      <Text style={styles.txnDate}>{formatDate(txn.date)}</Text>
                      {txn.incomeSource && (
                        <>
                          <Text style={styles.txnDot}>·</Text>
                          <Text style={styles.txnSource}>{txn.incomeSource}</Text>
                        </>
                      )}
                    </View>
                    {/* Tags */}
                    {txn.tags && txn.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {txn.tags.slice(0, 3).map((tag) => (
                          <View key={tag} style={styles.tagPill}>
                            <Text style={styles.tagText}>#{tag}</Text>
                          </View>
                        ))}
                        {txn.tags.length > 3 && (
                          <Text style={styles.tagMore}>+{txn.tags.length - 3}</Text>
                        )}
                      </View>
                    )}
                    {/* Note */}
                    {txn.note ? (
                      <Text style={styles.txnNote} numberOfLines={1}>{txn.note}</Text>
                    ) : null}
                  </View>

                  {/* Right amount */}
                  <Text style={[styles.txnAmount, { color: isIncome ? Colors.primary : Colors.danger }]}>
                    {isIncome ? '+' : '-'}{formatAmount(txn.amount)}
                  </Text>
                </TouchableOpacity>
              </AnimatedEntry>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, borderBottomWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  filterToggle: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.input, alignItems: 'center', justifyContent: 'center',
  },
  filterToggleActive: { backgroundColor: Colors.primary + '20' },

  // Month nav
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 20, paddingVertical: 12, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  monthText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, minWidth: 140, textAlign: 'center' },

  // Filter panel
  filterPanel: {
    backgroundColor: Colors.card, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },

  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.background },
  chipDivider: { width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 2 },

  // Stats bar
  statsBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  statVal: { fontSize: 12, fontWeight: '700' },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Transaction card
  txnCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8,
  },
  txnIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  txnInfo: { flex: 1 },
  txnTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  txnDesc: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  recurBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  txnMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  txnCategory: { fontSize: 12, color: Colors.textSecondary },
  txnDot: { fontSize: 12, color: Colors.textMuted },
  txnDate: { fontSize: 12, color: Colors.textMuted },
  txnSource: { fontSize: 12, color: Colors.accent, fontWeight: '500' },

  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tagPill: {
    backgroundColor: Colors.primary + '15', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: '600', color: Colors.primary },
  tagMore: { fontSize: 10, color: Colors.textMuted, marginLeft: 2 },

  txnNote: { fontSize: 12, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },

  txnAmount: { fontSize: 15, fontWeight: '800', marginTop: 2 },
});
