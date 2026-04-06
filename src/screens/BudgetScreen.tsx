import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import BudgetCard from '../components/BudgetCard';
import CategoryPicker from '../components/CategoryPicker';
import DeleteConfirmSheet from '../components/DeleteConfirmSheet';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorBanner from '../components/ui/ErrorBanner';
import Button from '../components/ui/Button';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonth } from '../utils/dateHelpers';
import { useHaptics } from '../hooks/useHaptics';
import type { Budget } from '../types';

export default function BudgetScreen() {
  const { budgets, loadingData, refreshing, fetchBudgets, saveBudget, deleteBudget, refresh } =
    useData();
  const haptics = useHaptics();

  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
    }, [fetchBudgets])
  );

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgets.filter((b) => b.percentage > 100).length;

  const openAdd = () => {
    setEditBudget(null);
    setCategory('food');
    setLimit('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (budget: Budget) => {
    setEditBudget(budget);
    setCategory(budget.category);
    setLimit(String(budget.limit));
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    const lmt = parseFloat(limit);
    if (!limit || isNaN(lmt) || lmt <= 0) {
      setError('Enter a valid budget amount');
      return;
    }
    setSaving(true);
    try {
      await saveBudget({ category, limit: lmt, month: getCurrentMonth() });
      haptics.medium();
      setShowModal(false);
    } catch {
      setError('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteBudget(toDelete.id);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
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
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {budgets.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Budgeted</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalBudget)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    totalSpent > totalBudget ? styles.danger : null,
                  ]}
                >
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
            </View>
            {overBudgetCount > 0 && (
              <View style={styles.overWarning}>
                <Text style={styles.overWarningText}>
                  ⚠️ {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Budget List */}
        {loadingData ? (
          <LoadingSpinner />
        ) : budgets.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="No budgets set"
            subtitle="Set spending limits for each category to stay on track"
            actionLabel="Create Budget"
            onAction={openAdd}
          />
        ) : (
          budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={openEdit}
              onDelete={(id) => {
                haptics.warning();
                const found = budgets.find((bgt) => bgt.id === id);
                if (found) setToDelete(found);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Budget Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowModal(false)}
            activeOpacity={1}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editBudget ? 'Edit Budget' : 'New Budget'}
            </Text>

            <ErrorBanner message={error} />

            <Text style={styles.sectionLabel}>Category</Text>
            <CategoryPicker
              selected={category}
              type="expense"
              onSelect={setCategory}
            />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Monthly Limit (₹)</Text>
            <View style={styles.limitRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.limitInput}
                value={limit}
                onChangeText={setLimit}
                placeholder="5000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
                selectionColor={Colors.primary}
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
        visible={!!toDelete}
        title="Delete Budget?"
        message="This will remove the budget limit for this category."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  addBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: Colors.background },
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  danger: { color: Colors.danger },
  overWarning: {
    marginTop: 12, backgroundColor: 'rgba(255,71,87,0.1)',
    borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)',
  },
  overWarningText: { fontSize: 13, color: Colors.danger, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay },
  modalSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20,
  },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginBottom: 12 },
  limitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  rupee: { fontSize: 22, fontWeight: '700', color: Colors.textMuted },
  limitInput: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.textPrimary, paddingVertical: 12 },
});
