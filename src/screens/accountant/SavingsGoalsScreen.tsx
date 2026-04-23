import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  RefreshControl, KeyboardAvoidingView, Platform, Alert, StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DeleteConfirmSheet from '../../components/DeleteConfirmSheet';
import AnimatedEntry from '../../components/ui/AnimatedEntry';
import { Colors } from '../../constants/colors';
import { usePrivacy } from '../../context/PrivacyContext';
import { useHaptics } from '../../hooks/useHaptics';
import * as goalsApi from '../../api/savingsGoals';
import type { SavingsGoal } from '../../types';

const GOAL_ICONS: { icon: IconName; label: string; color: string }[] = [
  { icon: 'home-cat', label: 'Home', color: '#4ECDC4' },
  { icon: 'truck', label: 'Car', color: '#FFD93D' },
  { icon: 'briefcase', label: 'Business', color: '#FF6B35' },
  { icon: 'book-open', label: 'Education', color: '#7C5CBF' },
  { icon: 'heart', label: 'Wedding', color: '#FF4757' },
  { icon: 'shield', label: 'Emergency', color: '#00C896' },
  { icon: 'gift', label: 'Vacation', color: '#45B7D1' },
  { icon: 'star', label: 'Other', color: '#FFD93D' },
];

export default function SavingsGoalsScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { formatAmount } = usePrivacy();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Add/Edit modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Contribute modal
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const data = await goalsApi.getSavingsGoals();
      setGoals(data);
    } catch {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  // Summary
  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // --- Add/Edit ---
  const openAdd = () => {
    setEditGoal(null);
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setSelectedIcon(0);
    setFormError('');
    setShowAddModal(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setTargetDate(goal.targetDate || '');
    const idx = GOAL_ICONS.findIndex(i => i.icon === goal.icon);
    setSelectedIcon(idx >= 0 ? idx : 7);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveGoal = async () => {
    setFormError('');
    if (!goalName.trim()) { setFormError('Give your goal a name'); return; }
    const amt = parseInt(targetAmount, 10);
    if (!targetAmount || isNaN(amt) || amt <= 0) { setFormError('Enter a valid target amount'); return; }

    // Validate date format if provided
    if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      setFormError('Date must be YYYY-MM-DD format'); return;
    }

    setSaving(true);
    try {
      const payload = {
        name: goalName.trim(),
        targetAmount: amt,
        targetDate: targetDate || undefined,
        icon: GOAL_ICONS[selectedIcon].icon,
        color: GOAL_ICONS[selectedIcon].color,
      };

      if (editGoal) {
        const updated = await goalsApi.updateSavingsGoal(editGoal.id, payload);
        setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      } else {
        const created = await goalsApi.createSavingsGoal(payload);
        setGoals(prev => [created, ...prev]);
      }
      haptics.success();
      setShowAddModal(false);
    } catch {
      setFormError('Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  // --- Contribute ---
  const openContribute = (goal: SavingsGoal) => {
    setContributeGoal(goal);
    setContributeAmount('');
    haptics.light();
  };

  const handleContribute = async () => {
    if (!contributeGoal) return;
    const amt = parseInt(contributeAmount, 10);
    if (!contributeAmount || isNaN(amt) || amt <= 0) return;

    setContributing(true);
    try {
      const updated = await goalsApi.contributeToGoal(contributeGoal.id, amt);
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      haptics.success();
      if (updated.isCompleted) {
        Alert.alert('Goal Achieved!', `Congratulations! You've reached your "${updated.name}" goal!`);
      }
      setContributeGoal(null);
    } catch {
      haptics.error();
    } finally {
      setContributing(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await goalsApi.deleteSavingsGoal(deleteTarget.id);
      setGoals(prev => prev.filter(g => g.id !== deleteTarget.id));
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const quickAmounts = [1000, 2000, 5000, 10000];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Savings Goals</Text>
          <Text style={styles.headerSub}>Track your financial dreams</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtnHeader}>
          <Icon name="plus" size={18} color={Colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
            tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {loading ? <LoadingSpinner /> : (
          <>
            {/* Summary Card */}
            {goals.length > 0 && (
              <AnimatedEntry delay={0}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Saved</Text>
                      <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                        {formatAmount(totalSaved)}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Target</Text>
                      <Text style={styles.summaryValue}>{formatAmount(totalTarget)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Progress</Text>
                      <Text style={[styles.summaryValue, { color: Colors.accent }]}>{overallPct}%</Text>
                    </View>
                  </View>
                  {/* Overall progress bar */}
                  <View style={styles.overallBarBg}>
                    <View style={[styles.overallBarFill, { width: `${Math.min(overallPct, 100)}%` }]} />
                  </View>
                  {completedGoals.length > 0 && (
                    <Text style={styles.completedCount}>
                      {completedGoals.length} goal{completedGoals.length > 1 ? 's' : ''} achieved
                    </Text>
                  )}
                </View>
              </AnimatedEntry>
            )}

            {/* Active Goals */}
            {activeGoals.length === 0 && completedGoals.length === 0 ? (
              <EmptyState
                emoji="🎯"
                title="No savings goals yet"
                subtitle="Set a goal — dream car, vacation, emergency fund — and watch your savings grow!"
                actionLabel="Create Your First Goal"
                onAction={openAdd}
              />
            ) : (
              <>
                {activeGoals.map((goal, i) => (
                  <AnimatedEntry key={goal.id} delay={80 + i * 60}>
                    <GoalCard
                      goal={goal}
                      onContribute={() => openContribute(goal)}
                      onEdit={() => openEdit(goal)}
                      onDelete={() => { haptics.warning(); setDeleteTarget(goal); }}
                    />
                  </AnimatedEntry>
                ))}

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Achieved Goals</Text>
                    {completedGoals.map((goal, i) => (
                      <AnimatedEntry key={goal.id} delay={80 + (activeGoals.length + i) * 60}>
                        <GoalCard
                          goal={goal}
                          onContribute={() => {}}
                          onEdit={() => {}}
                          onDelete={() => { haptics.warning(); setDeleteTarget(goal); }}
                          completed
                        />
                      </AnimatedEntry>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Goal Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAddModal(false)} activeOpacity={1} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editGoal ? 'Edit Goal' : 'New Savings Goal'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
              <ErrorBanner message={formError} />

              <Text style={styles.fieldLabel}>Goal Name</Text>
              <TextInput
                style={styles.textInput}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="e.g., Dream Car, Emergency Fund"
                placeholderTextColor={Colors.textMuted}
                selectionColor={Colors.primary}
              />

              <Text style={styles.fieldLabel}>Target Amount</Text>
              <View style={styles.amountRow}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="5,00,000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  selectionColor={Colors.primary}
                />
              </View>

              <Text style={styles.fieldLabel}>Target Date (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                selectionColor={Colors.primary}
              />

              <Text style={styles.fieldLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {GOAL_ICONS.map((item, i) => (
                  <TouchableOpacity
                    key={item.icon}
                    style={[styles.iconOption, selectedIcon === i && { borderColor: item.color, backgroundColor: `${item.color}20` }]}
                    onPress={() => setSelectedIcon(i)}
                  >
                    <Icon name={item.icon} size={22} color={selectedIcon === i ? item.color : Colors.textMuted} />
                    <Text style={[styles.iconLabel, selectedIcon === i && { color: item.color }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button onPress={handleSaveGoal} loading={saving} fullWidth style={{ marginTop: 20, marginBottom: 20 }}>
                {editGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contribute Modal */}
      <Modal visible={!!contributeGoal} transparent animationType="slide" onRequestClose={() => setContributeGoal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setContributeGoal(null)} activeOpacity={1} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add to "{contributeGoal?.name}"</Text>
            {contributeGoal && (
              <Text style={styles.contributeStatus}>
                {formatAmount(contributeGoal.currentAmount)} of {formatAmount(contributeGoal.targetAmount)} saved
              </Text>
            )}

            <View style={[styles.amountRow, { marginTop: 16 }]}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={contributeAmount}
                onChangeText={setContributeAmount}
                placeholder="1,000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                selectionColor={Colors.primary}
                autoFocus
              />
            </View>

            {/* Quick amount buttons */}
            <View style={styles.quickAmounts}>
              {quickAmounts.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickBtn, contributeAmount === String(amt) && styles.quickBtnActive]}
                  onPress={() => setContributeAmount(String(amt))}
                >
                  <Text style={[styles.quickBtnText, contributeAmount === String(amt) && styles.quickBtnTextActive]}>
                    {formatAmount(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button onPress={handleContribute} loading={contributing} fullWidth style={{ marginTop: 20 }}>
              Add Savings
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmSheet
        visible={!!deleteTarget}
        title="Delete Goal?"
        message={`This will permanently remove "${deleteTarget?.name}" and its progress.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// GoalCard Component
// ---------------------------------------------------------------------------
function GoalCard({
  goal, onContribute, onEdit, onDelete, completed = false,
}: {
  goal: SavingsGoal;
  onContribute: () => void;
  onEdit: () => void;
  onDelete: () => void;
  completed?: boolean;
}) {
  const { formatAmount } = usePrivacy();
  const progressColor = completed
    ? Colors.primary
    : goal.percentage >= 75 ? Colors.primary
    : goal.percentage >= 40 ? Colors.accent
    : Colors.orange;

  const daysLeft = goal.targetDate
    ? Math.max(Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000), 0)
    : null;

  return (
    <View style={[styles.goalCard, completed && styles.goalCardCompleted]}>
      {/* Top row: icon + name + menu */}
      <View style={styles.goalTopRow}>
        <View style={[styles.goalIconWrap, { backgroundColor: `${goal.color || Colors.primary}20` }]}>
          <Icon name={(goal.icon as IconName) || 'flag'} size={24} color={goal.color || Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <View style={styles.goalMetaRow}>
            {daysLeft !== null && !completed && (
              <Text style={styles.goalMeta}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Past due'}
              </Text>
            )}
            {completed && <Text style={[styles.goalMeta, { color: Colors.primary }]}>Achieved!</Text>}
          </View>
        </View>
        {!completed && (
          <View style={styles.goalActions}>
            <TouchableOpacity onPress={onEdit} style={styles.goalActionBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="edit" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.goalActionBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="trash" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Amount display */}
      <View style={styles.goalAmountRow}>
        <Text style={styles.goalCurrentAmt}>{formatAmount(goal.currentAmount)}</Text>
        <Text style={styles.goalTargetAmt}> / {formatAmount(goal.targetAmount)}</Text>
        <Text style={[styles.goalPct, { color: progressColor }]}>{goal.percentage}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min(goal.percentage, 100)}%`, backgroundColor: progressColor }]} />
      </View>

      {/* Bottom row: monthly needed + contribute */}
      {!completed && (
        <View style={styles.goalBottomRow}>
          <View>
            {goal.monthlyRequired > 0 && (
              <Text style={styles.goalMonthly}>
                {formatAmount(goal.monthlyRequired)}/mo needed
              </Text>
            )}
            {goal.remainingAmount > 0 && (
              <Text style={styles.goalRemaining}>{formatAmount(goal.remainingAmount)} to go</Text>
            )}
          </View>
          <TouchableOpacity style={styles.contributeBtn} onPress={onContribute} activeOpacity={0.8}>
            <Icon name="plus" size={14} color={Colors.background} />
            <Text style={styles.contributeBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, borderBottomWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  addBtnHeader: {
    backgroundColor: Colors.primary, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textSecondary,
    marginTop: 24, marginBottom: 12,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, padding: 16, marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  overallBarBg: {
    height: 6, backgroundColor: Colors.input, borderRadius: 3, marginTop: 14,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: '100%', backgroundColor: Colors.primary, borderRadius: 3,
  },
  completedCount: {
    fontSize: 12, color: Colors.primary, fontWeight: '600',
    textAlign: 'center', marginTop: 10,
  },

  // Goal Card
  goalCard: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, padding: 16, marginBottom: 12,
  },
  goalCardCompleted: { opacity: 0.7, borderColor: Colors.primary },
  goalTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIconWrap: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  goalName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  goalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  goalMeta: { fontSize: 12, color: Colors.textSecondary },
  goalActions: { flexDirection: 'row', gap: 12 },
  goalActionBtn: { padding: 4 },
  goalAmountRow: {
    flexDirection: 'row', alignItems: 'baseline', marginTop: 14,
  },
  goalCurrentAmt: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  goalTargetAmt: { fontSize: 14, color: Colors.textSecondary },
  goalPct: { fontSize: 14, fontWeight: '700', marginLeft: 'auto' },
  progressBg: {
    height: 8, backgroundColor: Colors.input, borderRadius: 4,
    marginTop: 10, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  goalBottomRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 14,
  },
  goalMonthly: { fontSize: 12, color: Colors.textSecondary },
  goalRemaining: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  contributeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20,
  },
  contributeBtnText: { fontSize: 13, fontWeight: '700', color: Colors.background },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay },
  modalSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
    borderTopWidth: 1, borderColor: Colors.border,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  textInput: {
    backgroundColor: Colors.input, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: Colors.textPrimary,
  },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  rupee: { fontSize: 22, fontWeight: '700', color: Colors.textMuted },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.textPrimary, paddingVertical: 12 },
  iconGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  iconOption: {
    alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    minWidth: 68,
  },
  iconLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  contributeStatus: {
    fontSize: 14, color: Colors.textSecondary, marginTop: -8, marginBottom: 4,
  },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  quickBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}20` },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.primary },
});
