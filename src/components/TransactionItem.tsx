import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getCategoryDef } from '../constants/categories';
import { usePrivacy } from '../context/PrivacyContext';
import { formatSectionDate } from '../utils/dateHelpers';
import { color, font } from '../theme/tokens';
import Icon from './ui/Icon';
import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  showDelete?: boolean;
}

/**
 * Recent/ledger row in the forest-on-cream system. Hairline-divided list row
 * (not a card), warm emoji tile, Fraunces signed amount. Mirrors `.row` in
 * docs/ari-v2-forest.html. Subline uses inkSoft, not inkFaint, for legibility.
 */
export default function TransactionItem({ transaction, onDelete, onEdit, showDelete }: Props) {
  const cat = getCategoryDef(transaction.category);
  const isExpense = transaction.type === 'expense';
  const { formatAmount } = usePrivacy();
  const sync = transaction.syncStatus;
  const showSyncTag = sync === 'pending' || sync === 'failed';

  const handleLongPress = () => {
    if (onEdit) onEdit(transaction);
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onLongPress={handleLongPress}
      delayLongPress={400}
      activeOpacity={onEdit ? 0.7 : 1}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{cat.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>
          {transaction.description || cat.label}
        </Text>
        <Text style={styles.meta}>
          {cat.label} · {formatSectionDate(transaction.date)}
          {showSyncTag && (
            <Text style={sync === 'failed' ? styles.syncFailed : styles.syncPending}>
              {sync === 'failed' ? '  · ✗ not synced' : '  · ↑ syncing…'}
            </Text>
          )}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, isExpense ? styles.expenseColor : styles.incomeColor]}>
          {isExpense ? '−' : '+'}
          {formatAmount(transaction.amount)}
        </Text>
        {showDelete && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(transaction.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Delete transaction"
            accessibilityRole="button"
          >
            <Icon name="trash" size={16} color={color.clay} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.cream2,
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  desc: {
    fontFamily: font.bodySemi,
    fontSize: 14.5,
    color: color.ink,
  },
  meta: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: color.inkSoft,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontFamily: font.display,
    fontSize: 16,
  },
  expenseColor: {
    color: color.ink,
  },
  incomeColor: {
    color: color.forest2,
  },
  syncPending: {
    fontFamily: font.body,
    fontSize: 11,
    color: color.clay,
  },
  syncFailed: {
    fontFamily: font.body,
    fontSize: 11,
    color: color.clay,
  },
});
