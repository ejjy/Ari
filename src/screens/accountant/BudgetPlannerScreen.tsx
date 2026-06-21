import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  RefreshControl, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CategoryPicker from '../../components/CategoryPicker';
import DeleteConfirmSheet from '../../components/DeleteConfirmSheet';
import AnimatedEntry from '../../components/ui/AnimatedEntry';
import ProgressBar from '../../components/ui/ProgressBar';
import { color, font } from '../../theme/tokens';
import { usePrivacy } from '../../context/PrivacyContext';
import { useHaptics } from '../../hooks/useHaptics';
import { useData } from '../../context/DataContext';
import * as budgetApi from '../../api/budgets';
import type { Budget } from '../../types';
import { CATEGORY_ICONS } from '../../components/ui/Icon';

export default function BudgetPlannerScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { saveBudget, deleteBudget } = useData();
  const { formatAmount } = usePrivacy();

  const [month, setMonth] = useState(getCurrentMonth());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    try {
      const data = await budgetApi.getBudgets(month);
      setBudgets(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBudgets();
    }, [fetchBudgets])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets();
    setRefreshing(false);
  };

  // Month navigation
  const changeMonth = (direction: -1 | 1) => {
    haptics.light();
    const [y, m] = month.split('-').map(Number);
    let newM = m + direction;
    let newY = y;
    if (newM < 1) { newM = 12; newY--; }
    if (newM > 12) { newM = 1; newY++; }
    setMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const monthLabel = formatMonthLabel(month);
  const isCurrentMonth = month === getCurrentMonth();

  // Summary
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudgetCount = budgets.filter(b => b.percentage > 100).length;
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Add/Edit handlers
  const openAdd = () => {
    setEditBudget(null);
    setCategory('food');
    setLimit('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (budget: Budget) => {
    setEditBudget(budget);
    setCategory(budget.category);
    setLimit(String(budget.limit));
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    const lmt = parseInt(limit, 10);
    if (!limit || isNaN(lmt) || lmt <= 0) {
      setFormError('Enter a valid budget amount');
      return;
    }
    setSaving(true);
    try {
      await saveBudget({ category, limit: lmt, month });
      haptics.medium();
      setShowModal(false);
      await fetchBudgets();
    } catch {
      setFormError('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBudget(deleteTarget.id);
      setBudgets(prev => prev.filter(b => b.id !== deleteTarget.id));
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={color.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Budget Planner</Text>
          <Text style={styles.headerSub}>Monthly targets & tracking</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtnHeader}>
          <Icon name="plus" size={18} color={color.cream} />
        </TouchableOpacity>
      </View>

      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
          <Icon name="chevron-left" size={22} color={color.ink} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMonth(getCurrentMonth())} activeOpacity={0.7}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          {!isCurrentMonth && <Text style={styles.monthHint}>Tap to go to current</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
          <Icon name="chevron-right" size={22} color={color.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
            tintColor={color.forest} colors={[color.forest]} />
        }
      >
        {loading ? <LoadingSpinner /> : (
          <>
            {/* Summary Card */}
            {budgets.length > 0 && (
              <AnimatedEntry delay={0}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Budgeted</Text>
                      <Text style={styles.summaryValue}>{formatAmount(totalBudget)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Spent</Text>
                      <Text style={[styles.summaryValue, totalSpent > totalBudget && { color: color.clay }]}>
                        {formatAmount(totalSpent)}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Remaining</Text>
                      <Text style={[styles.summaryValue, { color: totalRemaining >= 0 ? color.forest : color.clay }]}>
                        {formatAmount(Math.abs(totalRemaining))}
                      </Text>
                    </View>
                  </View>

                  {/* Overall progress */}
                  <View style={styles.overallBarBg}>
                    <View style={[
                      styles.overallBarFill,
                      { width: `${Math.min(overallPct, 100)}%` },
                      overallPct > 100 && { backgroundColor: color.clay },
                    ]} />
                  </View>

                  {overBudgetCount > 0 && (
                    <View style={styles.overWarning}>
                      <Text style={styles.overWarningText}>
                        {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
                      </Text>
                    </View>
                  )}
                </View>
              </AnimatedEntry>
            )}

            {/* Budget Cards */}
            {budgets.length === 0 ? (
              <EmptyState
                emoji="🎯"
                title={`No budgets for ${monthLabel}`}
                subtitle="Set spending limits for each category to stay on track"
                actionLabel="Create Budget"
                onAction={openAdd}
              />
            ) : (
              budgets.map((b, i) => (
                <AnimatedEntry key={b.id} delay={80 + i * 50}>
                  <BudgetCard
                    budget={b}
                    onEdit={() => openEdit(b)}
                    onDelete={() => { haptics.warning(); setDeleteTarget(b); }}
                  />
                </AnimatedEntry>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowModal(false)} activeOpacity={1} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editBudget ? 'Edit Budget' : 'New Budget'}</Text>
            <ErrorBanner message={formError} />

            <Text style={styles.fieldLabel}>Category</Text>
            <CategoryPicker selected={category} type="expense" onSelect={setCategory} />

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Monthly Limit</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={limit}
                onChangeText={setLimit}
                placeholder="5000"
                placeholderTextColor={color.inkFaint}
                keyboardType="numeric"
                selectionColor={color.forest}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            <Button onPress={handleSave} loading={saving} fullWidth style={{ marginTop: 24 }}>
              {editBudget ? 'Update Budget' : 'Set Budget'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DeleteConfirmSheet
        visible={!!deleteTarget}
        title="Delete Budget?"
        message="This will remove the budget limit for this category."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// BudgetCard Component
// ---------------------------------------------------------------------------
function BudgetCard({ budget, onEdit, onDelete }: { budget: Budget; onEdit: () => void; onDelete: () => void }) {
  const { formatAmount } = usePrivacy();
  const catInfo = CATEGORY_ICONS[budget.category] || { icon: 'package' as const, color: color.inkFaint };
  const isOver = budget.percentage > 100;
  const isWarning = budget.percentage > 80 && budget.percentage <= 100;
  const barColor = isOver ? color.clay : isWarning ? color.gold : color.forest;

  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetTopRow}>
        <View style={[styles.catIconWrap, { backgroundColor: `${catInfo.color}20` }]}>
          <Icon name={catInfo.icon} size={20} color={catInfo.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.catName}>{budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}</Text>
          <Text style={styles.budgetLimit}>Limit: {formatAmount(budget.limit)}</Text>
        </View>
        <View style={styles.budgetActions}>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="edit" size={16} color={color.inkFaint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="trash" size={16} color={color.inkFaint} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Spending progress */}
      <View style={styles.budgetProgressRow}>
        <Text style={styles.budgetSpent}>{formatAmount(budget.spent)} spent</Text>
        <Text style={[styles.budgetPct, { color: barColor }]}>{budget.percentage}%</Text>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min(budget.percentage, 100)}%`, backgroundColor: barColor }]} />
      </View>

      <Text style={[styles.budgetRemaining, isOver && { color: color.clay }]}>
        {isOver
          ? `Over by ${formatAmount(Math.abs(budget.remaining))}`
          : `${formatAmount(budget.remaining)} remaining`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${y}`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, borderBottomWidth: 1,
    borderColor: color.line, backgroundColor: color.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: font.bodyBold, color: color.ink },
  headerSub: { fontSize: 12, color: color.inkSoft, marginTop: 2, fontFamily: font.body },
  addBtnHeader: {
    backgroundColor: color.forest, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },

  // Month Nav
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: color.card, borderBottomWidth: 1, borderColor: color.line,
  },
  monthArrow: { padding: 8 },
  monthLabel: { fontSize: 17, fontFamily: font.bodyBold, color: color.ink, textAlign: 'center' },
  monthHint: { fontSize: 10, color: color.forest, textAlign: 'center', marginTop: 2, fontFamily: font.body },

  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Summary
  summaryCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: color.line },
  summaryLabel: { fontSize: 11, color: color.inkSoft, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: font.body },
  summaryValue: { fontSize: 16, fontFamily: font.bodyBold, color: color.ink },
  overallBarBg: {
    height: 6, backgroundColor: color.cream2, borderRadius: 3, marginTop: 14, overflow: 'hidden',
  },
  overallBarFill: { height: '100%', backgroundColor: color.forest, borderRadius: 3 },
  overWarning: {
    marginTop: 10, backgroundColor: color.clayTint, borderRadius: 8,
    padding: 8, borderWidth: 1, borderColor: color.clay,
  },
  overWarningText: { fontSize: 12, color: color.clay, textAlign: 'center', fontFamily: font.bodySemi },

  // Budget Card
  budgetCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 12,
  },
  budgetTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIconWrap: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  catName: { fontSize: 15, fontFamily: font.bodyBold, color: color.ink },
  budgetLimit: { fontSize: 12, color: color.inkSoft, marginTop: 2, fontFamily: font.body },
  budgetActions: { flexDirection: 'row', gap: 14 },
  budgetProgressRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14,
  },
  budgetSpent: { fontSize: 14, fontFamily: font.bodySemi, color: color.ink },
  budgetPct: { fontSize: 13, fontFamily: font.bodyBold },
  progressBg: {
    height: 8, backgroundColor: color.cream2, borderRadius: 4, marginTop: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  budgetRemaining: {
    fontSize: 12, color: color.inkSoft, marginTop: 8, fontFamily: font.body,
  },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(35,41,31,0.55)' },
  modalSheet: {
    backgroundColor: color.card, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: color.line,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: color.line,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: font.bodyBold, color: color.ink, marginBottom: 20 },
  fieldLabel: { fontSize: 13, color: color.inkSoft, fontFamily: font.bodySemi, marginBottom: 10 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: color.cream2, borderRadius: 12,
    borderWidth: 1, borderColor: color.line, paddingHorizontal: 14,
  },
  rupee: { fontSize: 22, fontFamily: font.bodyBold, color: color.inkFaint },
  amountInput: { flex: 1, fontSize: 24, fontFamily: font.bodyBold, color: color.ink, paddingVertical: 12 },
});
