import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, onForest, font, type } from '../theme/tokens';
import { usePrivacy } from '../context/PrivacyContext';

interface Props {
  /** Total spent today (money out). The hero number. */
  spentToday: number;
  /** Income received today. */
  moneyIn: number;
  /** Expenses today (same as spentToday; named for the pill). */
  moneyOut: number;
  /** moneyIn - moneyOut. Signed. */
  netToday: number;
}

/**
 * "Spent today" hero — flat forest block, no gradient (design rule #1).
 * Reframed from the old monthly balance card to a daily-spend focus, which
 * matches how the target user (daily house-budget logging) reads the app.
 * Mirrors `.hero` in docs/ari-v2-forest.html.
 */
export default function BalanceCard({ spentToday, moneyIn, moneyOut, netToday }: Props) {
  const { isPrivate } = usePrivacy();

  const amt = (n: number) => (isPrivate ? '••••' : n.toLocaleString('en-IN'));
  const signed = (n: number) =>
    isPrivate ? '••••' : `${n >= 0 ? '+' : '−'}₹${Math.abs(n).toLocaleString('en-IN')}`;

  return (
    <View style={styles.hero}>
      {/* Faint concentric-circle ornaments, clipped by overflow:hidden. */}
      <View style={[styles.ring, styles.ringOuter]} pointerEvents="none" />
      <View style={[styles.ring, styles.ringInner]} pointerEvents="none" />

      <Text style={styles.label}>Spent today</Text>
      <Text style={styles.amount}>
        <Text style={styles.rupee}>₹</Text>
        {amt(spentToday)}
      </Text>

      <View style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillKey}>Money out</Text>
          <Text style={[styles.pillVal, styles.pillValClay]}>₹{amt(moneyOut)}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillKey}>Money in</Text>
          <Text style={styles.pillVal}>₹{amt(moneyIn)}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillKey}>Net today</Text>
          <Text style={styles.pillVal}>{signed(netToday)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: color.forest,
    borderRadius: 26,
    paddingVertical: 26,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 999,
  },
  ringOuter: {
    right: -30,
    bottom: -50,
    width: 160,
    height: 160,
    borderColor: 'rgba(239,234,217,0.10)',
  },
  ringInner: {
    right: 6,
    bottom: -20,
    width: 100,
    height: 100,
    borderColor: 'rgba(239,234,217,0.08)',
  },
  label: {
    fontFamily: font.bodySemi,
    fontSize: type.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: onForest.muted,
  },
  amount: {
    fontFamily: font.display,
    fontSize: type.heroAmount,
    lineHeight: type.heroAmount,
    letterSpacing: -1,
    marginTop: 12,
    color: onForest.textBright,
  },
  rupee: {
    fontFamily: font.display,
    fontSize: 30,
    color: onForest.label,
  },
  pills: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 20,
  },
  pill: {
    gap: 2,
  },
  pillKey: {
    fontFamily: font.bodySemi,
    fontSize: 10.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: onForest.label,
  },
  pillVal: {
    fontFamily: font.display,
    fontSize: 17,
    color: onForest.text,
  },
  pillValClay: {
    color: onForest.clay,
  },
});
