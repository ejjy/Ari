import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { color, font } from '../theme/tokens';
import { formatCurrency } from '../utils/formatCurrency';

const AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

interface Props {
  onSelect: (amount: number) => void;
}

export default function QuickAmounts({ onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {AMOUNTS.map((a) => (
        <TouchableOpacity
          key={a}
          onPress={() => onSelect(a)}
          style={styles.pill}
          activeOpacity={0.7}
        >
          <Text style={styles.text}>{formatCurrency(a)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    backgroundColor: color.cream2,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    fontFamily: font.bodyMed,
    color: color.inkSoft,
  },
});
