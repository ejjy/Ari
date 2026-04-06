import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getCategoryDef } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateShort } from '../utils/dateHelpers';
import { Colors } from '../constants/colors';
import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function TransactionItem({ transaction, onDelete, showDelete }: Props) {
  const cat = getCategoryDef(transaction.category);
  const isExpense = transaction.type === 'expense';

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
        <Text style={styles.icon}>{cat.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>
          {transaction.description || cat.label}
        </Text>
        <Text style={styles.meta}>
          {cat.label} · {formatDateShort(transaction.date)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, isExpense ? styles.expenseColor : styles.incomeColor]}>
          {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
        </Text>
        {showDelete && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(transaction.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  desc: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  expenseColor: {
    color: Colors.danger,
  },
  incomeColor: {
    color: Colors.primary,
  },
  deleteIcon: {
    fontSize: 14,
  },
});
