import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import ErrorBanner from '../components/ui/ErrorBanner';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { useAuth } from '../context/AuthContext';
import { getGroupDetail, logSharedExpense, type GroupDetail } from '../api/groups';
import { todayISO } from '../utils/dateHelpers';
import type { MainStackParamList } from '../navigation/navigationTypes';

type Nav = StackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'AddSharedExpense'>;

export default function AddSharedExpenseScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const haptics = useHaptics();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'me_only'>('equal');
  // selected = members included in the equal split
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const g = await getGroupDetail(params.groupId);
    setGroup(g);
    setIncluded(new Set(g.members.map((m) => m.id)));
  }, [params.groupId]);

  useEffect(() => { load(); }, [load]);

  const toggleIncluded = (uid: string) => {
    haptics.light();
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user || !group) return;
    setError('');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (included.size === 0) {
      setError('Pick at least one person to split with');
      return;
    }
    if (!description.trim()) {
      setError('Add a short description');
      return;
    }

    // Equal split with paisa-correct rounding so the splits sum exactly.
    const ids = [...included];
    const each = Math.floor((amt / ids.length) * 100) / 100;
    const remainder = Math.round((amt - each * ids.length) * 100); // in paise
    const splits = ids.map((id, idx) => ({
      userId: id,
      // Distribute the residual paise to the first `remainder` users
      amount: (each + (idx < remainder ? 0.01 : 0)).toFixed(2),
    }));

    setSaving(true);
    try {
      await logSharedExpense(params.groupId, {
        amount: amt,
        description: description.trim(),
        category: 'other',
        date: todayISO(),
        splits,
      });
      haptics.success();
      navigation.goBack();
    } catch (e) {
      haptics.error();
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add to {group.name}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={error} />

          <View style={styles.amountRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amount}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>What was it for?</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Hotel, dinner, cab…"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Split equally between</Text>
          {group.members.map((m) => {
            const checked = included.has(m.id);
            const isYou = m.id === user?.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.memberRow}
                activeOpacity={0.8}
                onPress={() => toggleIncluded(m.id)}
              >
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked && <Icon name="check-circle" size={14} color="#fff" />}
                </View>
                <Text style={styles.memberName}>
                  {m.name}{isYou ? ' (you)' : ''}
                </Text>
                {checked && amount && parseFloat(amount) > 0 && (
                  <Text style={styles.share}>
                    ₹{(parseFloat(amount) / included.size).toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          <Button onPress={handleSave} loading={saving} fullWidth style={{ marginTop: 24 }}>
            Save
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
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
  cancel: { fontSize: 15, color: Colors.textSecondary },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginVertical: 8,
  },
  rupee: { fontSize: 36, color: Colors.textMuted, fontWeight: '700' },
  amount: {
    fontSize: 48, fontWeight: '800', color: Colors.textPrimary,
    minWidth: 100, textAlign: 'center',
  },
  label: {
    fontSize: 12, color: Colors.textSecondary, fontWeight: '600',
    marginTop: 16, marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.input, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: Colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  memberName: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  share: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
});
