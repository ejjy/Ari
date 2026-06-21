import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProgressBar from './ui/ProgressBar';
import { getCategoryDef } from '../constants/categories';
import { usePrivacy } from '../context/PrivacyContext';
import { color, font } from '../theme/tokens';
import Icon from './ui/Icon';
import type { Budget } from '../types';

interface Props {
  budget: Budget;
  onDelete: (id: string) => void;
  onEdit: (budget: Budget) => void;
}

export default function BudgetCard({ budget, onDelete, onEdit }: Props) {
  const cat = getCategoryDef(budget.category);
  const isOver = budget.percentage > 100;
  const { formatAmount } = usePrivacy();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
          <Text style={styles.icon}>{cat.emoji}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.catName}>{cat.label}</Text>
          <Text style={styles.meta}>
            {formatAmount(budget.spent)} of {formatAmount(budget.limit)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(budget)}
            style={styles.actionBtn}
            accessibilityLabel="Edit budget"
            accessibilityRole="button"
          >
            <Icon name="edit" size={14} color={color.inkSoft} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(budget.id)}
            style={styles.actionBtn}
            accessibilityLabel="Delete budget"
            accessibilityRole="button"
          >
            <Icon name="trash" size={14} color={color.clay} />
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
            ? `${formatAmount(Math.abs(budget.remaining))} over`
            : `${formatAmount(budget.remaining)} left`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
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
    fontFamily: font.bodySemi,
    fontSize: 15,
    color: color.ink,
    marginBottom: 2,
  },
  meta: { fontFamily: font.body, fontSize: 12, color: color.inkSoft },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pct: { fontFamily: font.body, fontSize: 12, color: color.inkSoft },
  remaining: { fontFamily: font.body, fontSize: 12, color: color.inkSoft },
  over: { color: color.clay, fontFamily: font.bodySemi },
});
