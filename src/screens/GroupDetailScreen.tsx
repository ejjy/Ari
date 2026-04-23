import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Linking, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import {
  getGroupDetail, listSharedExpenses, getBalances, createInvite,
  settleSplit, confirmUpiSettlement,
  type GroupDetail, type SharedExpense, type BalancesResponse,
} from '../api/groups';
import type { MainStackParamList } from '../navigation/navigationTypes';

type Nav = StackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const haptics = useHaptics();
  const { formatAmount } = usePrivacy();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, e, b] = await Promise.all([
        getGroupDetail(params.groupId),
        listSharedExpenses(params.groupId),
        getBalances(params.groupId),
      ]);
      setGroup(g);
      setExpenses(e.expenses);
      setBalances(b);
    } catch (err) {
      Alert.alert('Could not load group', err instanceof Error ? err.message : 'Try again');
    } finally {
      setLoading(false);
    }
  }, [params.groupId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleInvite = async () => {
    haptics.light();
    try {
      const inv = await createInvite(params.groupId);
      await Share.share({
        message: `Join my Ari group "${group?.name}" with code ${inv.code} (expires in 7 days).`,
        title: 'Ari group invite',
      });
    } catch (e) {
      Alert.alert('Could not create invite', e instanceof Error ? e.message : 'Try again');
    }
  };

  const handleSettle = async (splitId: string, method: 'upi' | 'cash') => {
    if (!user) return;
    setSettling(splitId);
    try {
      const r = await settleSplit(params.groupId, splitId, method);
      if (method === 'upi' && r.upiLink) {
        const supported = await Linking.canOpenURL(r.upiLink);
        if (!supported) {
          Alert.alert('No UPI app installed', 'Install PhonePe / GPay / Paytm and try again.');
          return;
        }
        await Linking.openURL(r.upiLink);
        Alert.alert(
          'Did the payment go through?',
          'Tap "Yes" only after you confirmed the transfer in your UPI app.',
          [
            { text: 'Not yet', style: 'cancel' },
            {
              text: 'Yes, I paid',
              onPress: async () => {
                try {
                  await confirmUpiSettlement(params.groupId, splitId);
                  haptics.success();
                  load();
                } catch (e) {
                  Alert.alert('Could not confirm', e instanceof Error ? e.message : 'Try again');
                }
              },
            },
          ],
        );
      } else {
        haptics.success();
        load();
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      // The 422 'no_creditor_vpa' surfaces here; offer the fallback inline.
      Alert.alert(
        'Settle by cash instead?',
        err.message ?? 'Cash settlement marks the split as paid without a UPI transfer.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark cash',
            onPress: async () => {
              try {
                await settleSplit(params.groupId, splitId, 'cash');
                haptics.success();
                load();
              } catch (e2) {
                Alert.alert('Could not settle', e2 instanceof Error ? e2.message : 'Try again');
              }
            },
          },
        ],
      );
    } finally {
      setSettling(null);
    }
  };

  if (loading || !group) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const myNet = balances?.nets.find((n) => n.user.id === user?.id)?.net ?? 0;
  const owedToMe = balances?.pairs.filter((p) => p.creditor.id === user?.id) ?? [];
  const iOwe = balances?.pairs.filter((p) => p.debtor.id === user?.id) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{group.name}</Text>
        <TouchableOpacity onPress={handleInvite} hitSlop={8}>
          <Icon name="share" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Net balance summary */}
        <View style={[styles.summaryCard, myNet > 0 ? styles.summaryPositive : myNet < 0 ? styles.summaryNegative : null]}>
          <Text style={styles.summaryLabel}>Your net balance</Text>
          <Text style={styles.summaryAmount}>
            {myNet >= 0 ? '+' : '-'}{formatAmount(Math.abs(myNet))}
          </Text>
          <Text style={styles.summarySub}>
            {myNet > 0 ? 'You are owed money' : myNet < 0 ? 'You owe money' : 'All settled up'}
          </Text>
        </View>

        {/* Pairs you owe — actionable */}
        {iOwe.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>You owe</Text>
            {iOwe.map((p) => (
              <View key={`${p.debtor.id}-${p.creditor.id}`} style={styles.pairRow}>
                <Text style={styles.pairText}>
                  {p.creditor.name} • {formatAmount(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {owedToMe.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Owed to you</Text>
            {owedToMe.map((p) => (
              <View key={`${p.debtor.id}-${p.creditor.id}`} style={styles.pairRow}>
                <Text style={styles.pairText}>
                  {p.debtor.name} • {formatAmount(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Add expense */}
        <TouchableOpacity
          style={styles.addExpenseBtn}
          onPress={() => navigation.navigate('AddSharedExpense', { groupId: params.groupId })}
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.addExpenseText}>Add shared expense</Text>
        </TouchableOpacity>

        {/* Expense list */}
        <Text style={styles.sectionLabel}>Recent expenses</Text>
        {expenses.length === 0 ? (
          <Text style={styles.empty}>No shared expenses yet.</Text>
        ) : (
          expenses.map((e) => {
            const payerName = memberMap[e.paidBy]?.name ?? 'Someone';
            const myUnsettledSplit = e.splits.find(
              (s) => s.owedBy === user?.id && !s.settledAt,
            );
            return (
              <View key={e.id} style={styles.expenseCard}>
                <View style={styles.expenseTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc}>{e.description || 'Shared expense'}</Text>
                    <Text style={styles.expenseSub}>
                      {payerName} paid • {new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatAmount(e.amount)}</Text>
                </View>

                {myUnsettledSplit && (
                  <View style={styles.settleRow}>
                    <Text style={styles.youOwe}>
                      You owe {formatAmount(myUnsettledSplit.amount)}
                    </Text>
                    <TouchableOpacity
                      style={styles.settleBtn}
                      disabled={settling === myUnsettledSplit.id}
                      onPress={() => handleSettle(myUnsettledSplit.id, 'upi')}
                    >
                      <Text style={styles.settleText}>
                        {settling === myUnsettledSplit.id ? 'Opening UPI…' : 'Settle via UPI'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    padding: 18, borderRadius: 14, alignItems: 'center',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 16,
  },
  summaryPositive: { borderColor: Colors.primary, backgroundColor: 'rgba(0,200,150,0.06)' },
  summaryNegative: { borderColor: Colors.danger, backgroundColor: 'rgba(255,59,48,0.06)' },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  summarySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, color: Colors.textMuted, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 8,
  },
  pairRow: {
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: Colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  pairText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  addExpenseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12,
    marginBottom: 20, marginTop: 6,
  },
  addExpenseText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  expenseCard: {
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 10,
  },
  expenseTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expenseDesc: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  expenseSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  settleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  youOwe: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
  settleBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: 'rgba(0,200,150,0.15)', borderWidth: 1, borderColor: Colors.primary,
  },
  settleText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  empty: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 16 },
});
