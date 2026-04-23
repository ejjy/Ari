import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { listGroups, createGroup, joinByCode, type GroupSummary } from '../api/groups';
import type { MainStackParamList } from '../navigation/navigationTypes';

type Nav = StackNavigationProp<MainStackParamList>;

export default function GroupsListScreen() {
  const navigation = useNavigation<Nav>();
  const haptics = useHaptics();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await listGroups();
      setGroups(r.groups);
    } catch (e) {
      console.warn('listGroups failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const g = await createGroup(name.trim());
      haptics.success();
      setName(''); setShowCreate(false);
      navigation.navigate('GroupDetail', { groupId: g.id });
    } catch (e) {
      haptics.error();
      Alert.alert('Could not create group', e instanceof Error ? e.message : 'Try again');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    try {
      const r = await joinByCode(c);
      haptics.success();
      setCode(''); setShowJoin(false);
      navigation.navigate('GroupDetail', { groupId: r.groupId });
    } catch (e) {
      haptics.error();
      Alert.alert('Could not join', e instanceof Error ? e.message : 'Check the code and try again');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Shared expenses</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => { haptics.light(); setShowCreate((v) => !v); setShowJoin(false); }}
          >
            <Icon name="plus" size={20} color={Colors.primary} />
            <Text style={styles.actionLabel}>Create group</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => { haptics.light(); setShowJoin((v) => !v); setShowCreate(false); }}
          >
            <Icon name="user" size={20} color={Colors.accent} />
            <Text style={styles.actionLabel}>Join by code</Text>
          </TouchableOpacity>
        </View>

        {showCreate && (
          <View style={styles.inlineForm}>
            <Text style={styles.inputLabel}>Group name</Text>
            <TextInput
              style={styles.input}
              placeholder="Trip to Goa"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Button onPress={handleCreate} loading={creating} fullWidth>Create</Button>
          </View>
        )}

        {showJoin && (
          <View style={styles.inlineForm}>
            <Text style={styles.inputLabel}>Invite code</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 4, fontWeight: '700', textAlign: 'center' }]}
              placeholder="XXXXXXXX"
              placeholderTextColor={Colors.textMuted}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().slice(0, 8))}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              autoFocus
            />
            <Button onPress={handleJoin} fullWidth>Join</Button>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : groups.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <EmptyState
              emoji="👥"
              title="No groups yet"
              subtitle="Create a group for trips, roommates, or splits with friends. UPI settlement built in."
            />
          </View>
        ) : (
          groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={styles.groupCard}
              activeOpacity={0.85}
              onPress={() => { haptics.light(); navigation.navigate('GroupDetail', { groupId: g.id }); }}
            >
              <View style={styles.groupIcon}>
                <Text style={styles.groupEmoji}>{g.emoji ?? '👥'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{g.name}</Text>
                <Text style={styles.groupSub}>
                  {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))
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
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 20, paddingBottom: 40 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionCard: {
    flex: 1, padding: 16, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: 6,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  inlineForm: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16, gap: 8,
  },
  inputLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: Colors.input, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary, marginBottom: 8,
  },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 10,
  },
  groupIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.input,
  },
  groupEmoji: { fontSize: 22 },
  groupName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  groupSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
