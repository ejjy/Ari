import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  buildCategoryList,
  CategoryDef,
} from '../constants/categories';
import { color, font } from '../theme/tokens';
import type { UserCategoryData } from '../api/categories';

interface Props {
  selected: string;
  type: 'expense' | 'income';
  onSelect: (value: string) => void;
  /** Server-fetched custom categories — merges with defaults */
  customCategories?: UserCategoryData[];
}

export default function CategoryPicker({ selected, type, onSelect, customCategories }: Props) {
  const cats: CategoryDef[] = customCategories
    ? buildCategoryList(type, customCategories)
    : type === 'expense'
      ? EXPENSE_CATEGORIES
      : INCOME_CATEGORIES;

  return (
    <View style={styles.grid}>
      {cats.map((cat) => {
        const isSelected = selected === cat.value;
        return (
          <TouchableOpacity
            key={cat.value}
            onPress={() => onSelect(cat.value)}
            activeOpacity={0.75}
            style={[
              styles.tile,
              { borderColor: isSelected ? cat.color : color.line },
              isSelected && { backgroundColor: cat.color + '20' },
            ]}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.label,
                { color: isSelected ? cat.color : color.inkSoft },
              ]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '22.5%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: color.cream2,
  },
  emoji: { fontSize: 20 },
  label: { fontSize: 10, fontFamily: font.bodyMed, textAlign: 'center' },
});
