import React from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import Icon, { CATEGORY_ICONS } from './ui/Icon';
import type { Category, TransactionType } from '../types';

/**
 * Quick Add Templates — the top 10 everyday expenses in India
 * (spec Sprint 1: "Quick Add Templates for top 10 recurring spends").
 *
 * A horizontal chip strip above the Description field. Tapping a chip
 * pre-fills description + merchant + category + type so the user only
 * has to set the amount. Amount stays empty — templates are about
 * categories, not assumed rupee values.
 */

export interface Template {
  key: string;
  label: string;
  description: string;
  merchant: string;
  category: Category;
  type: TransactionType;
}

export const QUICK_TEMPLATES: Template[] = [
  { key: 'swiggy',     label: 'Swiggy',    description: 'Swiggy order',      merchant: 'swiggy',          category: 'food',          type: 'expense' },
  { key: 'zomato',     label: 'Zomato',    description: 'Zomato order',      merchant: 'zomato',          category: 'food',          type: 'expense' },
  { key: 'uber',       label: 'Uber',      description: 'Uber ride',         merchant: 'uber',            category: 'transport',     type: 'expense' },
  { key: 'ola',        label: 'Ola',       description: 'Ola ride',          merchant: 'ola',             category: 'transport',     type: 'expense' },
  { key: 'petrol',     label: 'Petrol',    description: 'Petrol',            merchant: 'indian oil',      category: 'transport',     type: 'expense' },
  { key: 'groceries',  label: 'Groceries', description: 'Groceries',         merchant: 'big basket',      category: 'food',          type: 'expense' },
  { key: 'rent',       label: 'Rent',      description: 'Monthly rent',      merchant: 'rent',            category: 'housing',       type: 'expense' },
  { key: 'coffee',     label: 'Coffee',    description: 'Coffee',            merchant: 'starbucks',       category: 'food',          type: 'expense' },
  { key: 'recharge',   label: 'Recharge',  description: 'Mobile recharge',   merchant: 'jio recharge',    category: 'housing',       type: 'expense' },
  { key: 'salary',     label: 'Salary',    description: 'Monthly salary',    merchant: 'salary',          category: 'salary',        type: 'income' },
];


interface Props {
  onSelect: (t: Template) => void;
}

export default function QuickAddTemplates({ onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {QUICK_TEMPLATES.map((t) => {
        const iconMeta = CATEGORY_ICONS[t.category];
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.chip}
            activeOpacity={0.7}
            onPress={() => onSelect(t)}
            accessibilityRole="button"
            accessibilityLabel={`Quick add ${t.label}`}
          >
            {iconMeta && (
              <Icon name={iconMeta.icon} size={14} color={iconMeta.color} />
            )}
            <Text style={styles.chipText}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 2, paddingVertical: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.input,
    borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipText: {
    fontSize: 13, color: Colors.textPrimary, fontWeight: '600',
  },
});
