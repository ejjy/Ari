import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
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
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
