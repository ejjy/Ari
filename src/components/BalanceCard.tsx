import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { usePrivacy } from '../context/PrivacyContext';

interface Props {
  income: number;
  expenses: number;
  /** Kept for caller compatibility; no longer rendered. */
  balance?: number;
  savingsRate?: number;
}

/**
 * Income + Expenses side-by-side. The "Total Balance" hero number was
 * removed because it conflated saved-up money with month-to-date net,
 * which most users misread. The two flows tell a clearer story on their
 * own.
 */
export default function BalanceCard({ income, expenses }: Props) {
  const { formatAmount } = usePrivacy();
  return (
    <LinearGradient
      colors={['#1A3A3A', '#0D2B2B', '#0A1E1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Income</Text>
          <Text style={[styles.amount, { color: Colors.primary }]}>
            {formatAmount(income)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Text style={styles.label}>Expenses</Text>
          <Text style={[styles.amount, { color: Colors.danger }]}>
            {formatAmount(expenses)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  label: {
    fontSize: 12,
    color: 'rgba(232,232,240,0.55)',
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
