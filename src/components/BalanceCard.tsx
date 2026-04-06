import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export default function BalanceCard({ income, expenses, balance, savingsRate }: Props) {
  return (
    <LinearGradient
      colors={['#1A3A3A', '#0D2B2B', '#0A1E1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.label}>Total Balance</Text>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>💰 {savingsRate}% saved</Text>
        </View>
      </View>

      <Text style={styles.balance}>{formatCurrency(balance)}</Text>

      <View style={styles.row}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>↑ Income</Text>
          <Text style={styles.statIncome}>{formatCurrency(income)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>↓ Expenses</Text>
          <Text style={styles.statExpense}>{formatCurrency(expenses)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: 'rgba(232,232,240,0.7)',
    letterSpacing: 0.5,
  },
  savingsBadge: {
    backgroundColor: 'rgba(0,200,150,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.3)',
  },
  savingsText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  balance: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(232,232,240,0.5)',
    marginBottom: 4,
  },
  statIncome: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  statExpense: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.danger,
  },
});
