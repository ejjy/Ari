import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, ActivityIndicator,
  RefreshControl, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import EmptyState from '../components/ui/EmptyState';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import * as todosApi from '../api/todos';
import type { TodoNote } from '../api/todos';

// ── Constants ────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: 'High',   emoji: '🔴', color: Colors.danger },
  medium: { label: 'Medium', emoji: '🟡', color: Colors.accent },
  low:    { label: 'Low',    emoji: '🟢', color: Colors.primary },
} as const;

const NOTE_COLORS = [
  '#00C896', '#FF6B35', '#7C5CBF', '#FF4757',
  '#FFD93D', '#4ECDC4', '#45B7D1', '#FF69B4',
];

type Filter = 'all' | 'active' | 'done' | 'pinned';

export default function TodoNotesScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  const [todos, setTodos] = useState<TodoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editTodo, setEditTodo] = useState<TodoNote | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────

  const fetchTodos = useCallback(async () => {
    try {
      const data = await todosApi.getTodos();
      setTodos(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTodos();
    }, [fetchTodos])
  );

  // ── Filtered list ──────────────────────────────────────────────────

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.isDone;
    if (filter === 'done') return t.isDone;
    if (filter === 'pinned') return t.pinned;
    return true;
  });

  const activeCount = todos.filter((t) => !t.isDone).length;
  const doneCount = todos.filter((t) => t.isDone).length;

  // ── Open Add ───────────────────────────────────────────────────────

  const handleAdd = () => {
    haptics.light();
    setEditTodo(null);
    setTitle('');
    setBody('');
    setPriority('medium');
    setDueDate('');
    setDueTime('');
    setNoteColor(NOTE_COLORS[0]);
    setPinned(false);
    setModalVisible(true);
  };

  // ── Open Edit ──────────────────────────────────────────────────────

  const handleEdit = (todo: TodoNote) => {
    haptics.light();
    setEditTodo(todo);
    setTitle(todo.title);
    setBody(todo.body);
    setPriority(todo.priority);
    setDueDate(todo.dueDate || '');
    setDueTime(todo.dueTime || '');
    setNoteColor(todo.color || NOTE_COLORS[0]);
    setPinned(todo.pinned);
    setModalVisible(true);
  };

  // ── Save ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        priority,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        color: noteColor,
        pinned,
      };

      if (editTodo) {
        const updated = await todosApi.updateTodo(editTodo.id, payload);
        setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await todosApi.createTodo(payload);
        setTodos((prev) => [created, ...prev]);
      }
      haptics.success();
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Done ────────────────────────────────────────────────────

  const handleToggleDone = async (todo: TodoNote) => {
    haptics.light();
    const newDone = !todo.isDone;
    // Optimistic update
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, isDone: newDone } : t)));
    try {
      await todosApi.updateTodo(todo.id, { isDone: newDone });
    } catch {
      // Rollback
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, isDone: !newDone } : t)));
    }
  };

  // ── Toggle Pin ─────────────────────────────────────────────────────

  const handleTogglePin = async (todo: TodoNote) => {
    haptics.light();
    const newPin = !todo.pinned;
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, pinned: newPin } : t)));
    try {
      await todosApi.updateTodo(todo.id, { pinned: newPin });
    } catch {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, pinned: !newPin } : t)));
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────

  const handleDelete = (todo: TodoNote) => {
    haptics.medium();
    Alert.alert('Delete Note', `Delete "${todo.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await todosApi.deleteTodo(todo.id);
            setTodos((prev) => prev.filter((t) => t.id !== todo.id));
            haptics.success();
          } catch {
            Alert.alert('Error', 'Could not delete note.');
          }
        },
      },
    ]);
  };

  // ── Format helpers ─────────────────────────────────────────────────

  const formatDue = (date: string | null, time: string | null): string | null => {
    if (!date) return null;
    try {
      const d = new Date(date + 'T00:00:00');
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return time ? `${label} at ${time}` : label;
    } catch {
      return date;
    }
  };

  const isOverdue = (date: string | null): boolean => {
    if (!date) return false;
    try {
      const d = new Date(date + 'T23:59:59');
      return d < new Date();
    } catch {
      return false;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notes & To-Do</Text>
          <Text style={styles.headerSub}>
            {activeCount} active · {doneCount} done
          </Text>
        </View>
        <TouchableOpacity onPress={handleAdd} style={styles.addHeaderBtn}>
          <Icon name="plus" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {([
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'done', label: 'Done' },
          { key: 'pinned', label: 'Pinned' },
        ] as { key: Filter; label: string }[]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => { haptics.light(); setFilter(f.key); }}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji={filter !== 'all' ? '🔍' : '📝'}
          title={filter !== 'all' ? 'No matching notes' : 'No notes yet'}
          subtitle={filter !== 'all' ? 'Try a different filter' : 'Tap + to create your first note or to-do'}
          actionLabel={filter === 'all' ? 'Add Note' : undefined}
          onAction={filter === 'all' ? handleAdd : undefined}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTodos(); }} tintColor={Colors.primary} />
          }
        >
          {filtered.map((todo, i) => {
            const prio = PRIORITY_CONFIG[todo.priority];
            const dueLabel = formatDue(todo.dueDate, todo.dueTime);
            const overdue = !todo.isDone && isOverdue(todo.dueDate);

            return (
              <AnimatedEntry key={todo.id} delay={Math.min(i * 40, 300)}>
                <TouchableOpacity
                  style={[
                    styles.todoCard,
                    { borderLeftColor: todo.color || Colors.primary, borderLeftWidth: 4 },
                    todo.isDone && styles.todoCardDone,
                  ]}
                  onPress={() => handleEdit(todo)}
                  onLongPress={() => handleDelete(todo)}
                  delayLongPress={500}
                  activeOpacity={0.8}
                >
                  {/* Checkbox + Content */}
                  <View style={styles.todoRow}>
                    <TouchableOpacity
                      onPress={() => handleToggleDone(todo)}
                      style={[styles.checkbox, todo.isDone && styles.checkboxDone]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {todo.isDone && <Icon name="check-circle" size={18} color={Colors.primary} />}
                    </TouchableOpacity>

                    <View style={styles.todoContent}>
                      <View style={styles.todoTitleRow}>
                        <Text
                          style={[styles.todoTitle, todo.isDone && styles.todoTitleDone]}
                          numberOfLines={2}
                        >
                          {todo.title}
                        </Text>
                        {todo.pinned && (
                          <Text style={styles.pinEmoji}>📌</Text>
                        )}
                      </View>

                      {todo.body ? (
                        <Text style={styles.todoBody} numberOfLines={2}>{todo.body}</Text>
                      ) : null}

                      <View style={styles.todoMeta}>
                        <Text style={styles.priorityBadge}>
                          {prio.emoji} {prio.label}
                        </Text>
                        {dueLabel && (
                          <Text style={[styles.dueBadge, overdue && styles.dueOverdue]}>
                            {overdue ? '⚠️ ' : '📅 '}{dueLabel}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity
                      onPress={() => handleTogglePin(todo)}
                      style={styles.pinBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name="flag"
                        size={16}
                        color={todo.pinned ? Colors.accent : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </AnimatedEntry>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={handleAdd}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={24} color={Colors.background} />
      </TouchableOpacity>

      {/* ── Add/Edit Modal ───────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editTodo ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Title */}
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                placeholderTextColor={Colors.textMuted}
                maxLength={200}
                autoFocus={!editTodo}
              />

              {/* Body */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={body}
                onChangeText={setBody}
                placeholder="Add details..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={2000}
              />

              {/* Priority */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Priority</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  const isActive = priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityChip, isActive && { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}
                      onPress={() => { haptics.light(); setPriority(p); }}
                    >
                      <Text style={styles.priorityEmoji}>{cfg.emoji}</Text>
                      <Text style={[styles.priorityLabel, isActive && { color: cfg.color }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Due Date */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Due Date (optional)</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
              />

              {/* Due Time */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Time (optional)</Text>
              <TextInput
                style={styles.input}
                value={dueTime}
                onChangeText={setDueTime}
                placeholder="HH:MM (e.g. 14:30)"
                placeholderTextColor={Colors.textMuted}
                maxLength={5}
                keyboardType="numbers-and-punctuation"
              />

              {/* Color */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Color</Text>
              <View style={styles.colorRow}>
                {NOTE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, noteColor === c && styles.colorDotActive]}
                    onPress={() => { haptics.light(); setNoteColor(c); }}
                  >
                    {noteColor === c && <Icon name="check-circle" size={14} color={Colors.white} />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pinned toggle */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Pin to top</Text>
                <Switch
                  value={pinned}
                  onValueChange={setPinned}
                  trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                  thumbColor={pinned ? Colors.primary : Colors.textMuted}
                />
              </View>
            </ScrollView>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editTodo ? 'Save Changes' : 'Create Note'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, borderBottomWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  addHeaderBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },

  // Filters
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20,
    paddingVertical: 12, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: Colors.background },

  // List
  listContent: { padding: 16, paddingBottom: 100 },

  // Todo card
  todoCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 10, borderLeftWidth: 4,
  },
  todoCardDone: { opacity: 0.6 },
  todoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },

  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxDone: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },

  todoContent: { flex: 1 },
  todoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todoTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  todoTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  pinEmoji: { fontSize: 14 },
  todoBody: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },

  todoMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  priorityBadge: { fontSize: 11, color: Colors.textMuted },
  dueBadge: { fontSize: 11, color: Colors.textSecondary },
  dueOverdue: { color: Colors.danger, fontWeight: '600' },

  pinBtn: { padding: 4, marginTop: 2 },

  // FAB
  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, fontSize: 15, color: Colors.textPrimary,
  },

  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.input, borderWidth: 1.5, borderColor: Colors.border,
  },
  priorityEmoji: { fontSize: 14 },
  priorityLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  colorRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: Colors.white, transform: [{ scale: 1.15 }] },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: { fontSize: 14, color: Colors.textSecondary },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.background },
});
