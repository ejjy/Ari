import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { listGroups, getBalances, type GroupSummary } from '../api/groups';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import Icon from './ui/Icon';
import { color, font } from '../theme/tokens';
import type { MainStackParamList } from '../navigation/navigationTypes';

/**
 * Dashboard card surfacing the user's net position across all shared
 * groups. "You owe Rs.X across N groups" or "Owed to you: Rs.Y" with
 * a one-tap into the Groups list. Hides itself when the user has no
 * groups or all balances are zero.
 *
 * Keeps math entirely local — sums getBalances per group on mount,
 * cached for the screen lifetime. Refresh on focus is handled by the
 * parent Dashboard's useFocusEffect.
 */

type Nav = StackNavigationProp<MainStackParamList>;

interface NetSummary {
  groups: GroupSummary[];
  owed_to_me: number;     // sum of positive balances
  i_owe: number;          // sum of negative balances (absolute)
  groups_with_activity: number;
}

export default function GroupBalanceCard() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { formatAmount } = usePrivacy();
  const [summary, setSummary] = useState<NetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { groups } = await listGroups();
      if (groups.length === 0) {
        setSummary({ groups: [], owed_to_me: 0, i_owe: 0, groups_with_activity: 0 });
        return;
      }
      // Fetch balances per group in parallel; ignore individual failures.
      const results = await Promise.all(
        groups.map(async (g) => {
          try {
            const b = await getBalances(g.id);
            return b.nets.find((n) => n.user.id === user.id)?.net ?? 0;
          } catch {
            return 0;
          }
        })
      );
      let owed_to_me = 0;
      let i_owe = 0;
      let active = 0;
      for (const net of results) {
        if (net > 0) { owed_to_me += net; active += 1; }
        else if (net < 0) { i_owe += -net; active += 1; }
      }
      setSummary({ groups, owed_to_me, i_owe, groups_with_activity: active });
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading || !summary || summary.groups.length === 0) return null;
  if (summary.owed_to_me === 0 && summary.i_owe === 0) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Groups')}
      accessibilityRole="button"
      accessibilityLabel="Open shared expenses"
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: color.cream2 }]}>
          <Icon name="user" size={16} color={color.forest2} />
        </View>
        <Text style={styles.kicker}>Shared expenses</Text>
        <Icon name="chevron-right" size={14} color={color.inkFaint} />
      </View>

      <View style={styles.amounts}>
        {summary.owed_to_me > 0 && (
          <View style={styles.amountBlock}>
            <Text style={styles.label}>Owed to you</Text>
            <Text style={[styles.amount, { color: color.forest }]}>
              +{formatAmount(summary.owed_to_me)}
            </Text>
          </View>
        )}
        {summary.i_owe > 0 && (
          <View style={styles.amountBlock}>
            <Text style={styles.label}>You owe</Text>
            <Text style={[styles.amount, { color: color.clay }]}>
              -{formatAmount(summary.i_owe)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.footer}>
        Across {summary.groups_with_activity}{' '}
        {summary.groups_with_activity === 1 ? 'group' : 'groups'} • Tap to settle
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: 14,
    borderWidth: 1, borderColor: color.line,
    padding: 14, marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.line,
  },
  kicker: {
    flex: 1,
    fontSize: 11, letterSpacing: 1,
    color: color.forest2, fontFamily: font.bodyBold, textTransform: 'uppercase',
  },
  amounts: { flexDirection: 'row', gap: 16 },
  amountBlock: { flex: 1 },
  label: { fontSize: 11, color: color.inkSoft, marginBottom: 2 },
  amount: { fontSize: 18, fontFamily: font.displayBold },
  footer: { fontSize: 11, color: color.inkFaint, marginTop: 10, textAlign: 'right' },
});
