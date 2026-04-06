import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProgressBar from './ui/ProgressBar';
import { getCategoryDef } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';
import { Colors } from '../constants/colors';
import type { Budget } from '../types';

interface Props {
  budget: Budget;
  onDelete: (id: string) => void;
  onEdit: (budget: Budget) => void;
}

export default function BudgetCard({ budget, onDelete, onEdit }: Props) {
  const cat = getCategoryDef(budget.category);
  const isOver = budget.percentage > 100;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
          <Text style={styles.icon}>{cat.emoji}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.catName}>{cat.label}</Text>
          <Text style={styles.meta}>
            {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(budget)} style={styles.actionBtn}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(budget.id)} style={styles.actionBtn}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ProgressBar percentage={budget.percentage} color={cat.color} />

      <View style={styles.footer}>
        <Text style={[styles.pct, isOver ? styles.over : null]}>
          {Math.round(budget.percentage)}% used
        </Text>
        <Text style={[styles.remaining, isOver ? styles.over : null]}>
          {isOver
            ? `${formatCurrency(Math.abs(budget.remaining))} over`
            : `${formatCurrency(budget.remaining)} left`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  catName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  meta: { fontSize: 12, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  editIcon: { fontSize: 14 },
  deleteIcon: { fontSize: 14 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pct: { fontSize: 12, color: Colors.textSecondary },
  remaining: { fontSize: 12, color: Colors.textSecondary },
  over: { color: Colors.danger, fontWeight: '600' },
});
