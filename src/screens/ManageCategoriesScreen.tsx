import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';
import type { UserCategoryData } from '../api/categories';
import * as catApi from '../api/categories';

// ── Emoji picker options ──────────────────────────────────────────
const EMOJI_OPTIONS = [
  '🍜', '🍕', '🥗', '☕', '🚗', '🚌', '✈️', '⛽',
  '🛍️', '👗', '💄', '🎬', '🎮', '🎵', '💊', '🏥',
  '🏠', '🔌', '📚', '🎓', '💰', '💻', '📈', '🎁',
  '📦', '🎯', '🏦', '🛡️', '🐕', '👶', '📱', '🔧',
  '🏋️', '🍺', '🎂', '💇', '🚿', '📰', '🎪', '💎',
];

const COLOR_OPTIONS = [
  '#FF6B35', '#FFD93D', '#FF4757', '#7C5CBF', '#00C896',
  '#4ECDC4', '#2D7D7D', '#FF69B4', '#45B7D1', '#95A5A6',
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
  '#1ABC9C',
];

interface Props {
  onBack: () => void;
}

export default function ManageCategoriesScreen({ onBack }: Props) {
  const haptics = useHaptics();
  const [categories, setCategories] = useState<UserCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<UserCategoryData | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('📦');
  const [formColor, setFormColor] = useState('#95A5A6');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await catApi.getCategories();
      setCategories(data);
    } catch {
      Alert.alert('Error', 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const filtered = categories.filter((c) => c.type === activeTab);
  const customCount = filtered.filter((c) => !c.isDefault).length;

  // ── Open Add ──────────────────────────────────────────────────────
  const handleAdd = () => {
    haptics.light();
    setEditingCat(null);
    setFormName('');
    setFormEmoji('📦');
    setFormColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    setModalVisible(true);
  };

  // ── Open Edit ─────────────────────────────────────────────────────
  const handleEdit = (cat: UserCategoryData) => {
    haptics.light();
    setEditingCat(cat);
    setFormName(cat.name);
    setFormEmoji(cat.emoji);
    setFormColor(cat.color);
    setModalVisible(true);
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const name = formName.trim().toLowerCase();
    if (!name) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }
    setSaving(true);
    try {
      if (editingCat) {
        const updated = await catApi.updateCategory(editingCat.id, {
          name: editingCat.isDefault ? undefined : name,
          emoji: formEmoji,
          color: formColor,
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await catApi.createCategory({
          name,
          type: activeTab,
          emoji: formEmoji,
          color: formColor,
        });
        setCategories((prev) => [...prev, created]);
      }
      haptics.success();
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = (cat: UserCategoryData) => {
    if (cat.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }
    haptics.medium();
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${cat.name}"? Existing transactions with this category will keep their category label.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await catApi.deleteCategory(cat.id);
              setCategories((prev) => prev.filter((c) => c.id !== cat.id));
              haptics.success();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not delete category.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <TouchableOpacity onPress={handleAdd} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="plus" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['expense', 'income'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { haptics.light(); setActiveTab(tab); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'expense' ? 'Expenses' : 'Income'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Default categories */}
        <Text style={styles.sectionLabel}>DEFAULT</Text>
        {filtered.filter((c) => c.isDefault).map((cat, i) => (
          <AnimatedEntry key={cat.id} delay={i * 40}>
            <TouchableOpacity style={styles.catRow} onPress={() => handleEdit(cat)} activeOpacity={0.7}>
              <View style={[styles.catEmoji, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.emojiText}>{cat.emoji}</Text>
              </View>
              <View style={styles.catInfo}>
                <Text style={styles.catName}>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</Text>
                <Text style={styles.catBadge}>Default</Text>
              </View>
              <Icon name="edit" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </AnimatedEntry>
        ))}

        {/* Custom categories */}
        {customCount > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>CUSTOM</Text>
            {filtered.filter((c) => !c.isDefault).map((cat, i) => (
              <AnimatedEntry key={cat.id} delay={i * 40}>
                <View style={styles.catRow}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }} onPress={() => handleEdit(cat)} activeOpacity={0.7}>
                    <View style={[styles.catEmoji, { backgroundColor: cat.color + '20' }]}>
                      <Text style={styles.emojiText}>{cat.emoji}</Text>
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</Text>
                      <Text style={[styles.catBadge, { color: Colors.primary }]}>Custom</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(cat)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Icon name="trash" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </AnimatedEntry>
            ))}
          </>
        )}

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Icon name="plus" size={18} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add Custom Category</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Add/Edit Modal ───────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCat ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon name="x" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={[styles.input, editingCat?.isDefault && styles.inputDisabled]}
              placeholder="e.g. Groceries, Pet, Gym..."
              placeholderTextColor={Colors.textMuted}
              value={formName}
              onChangeText={setFormName}
              maxLength={30}
              editable={!editingCat?.isDefault}
              autoCapitalize="none"
            />
            {editingCat?.isDefault && (
              <Text style={styles.hintText}>Default category names cannot be changed</Text>
            )}

            {/* Emoji */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Emoji</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiGrid}
            >
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, formEmoji === e && styles.emojiSelected]}
                  onPress={() => { haptics.light(); setFormEmoji(e); }}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }, formColor === c && styles.colorSelected]}
                  onPress={() => { haptics.light(); setFormColor(c); }}
                >
                  {formColor === c && <Icon name="check-circle" size={16} color={Colors.white} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewRow}>
              <View style={[styles.catEmoji, { backgroundColor: formColor + '20' }]}>
                <Text style={styles.emojiText}>{formEmoji}</Text>
              </View>
              <Text style={styles.previewName}>
                {(formName || 'Category').charAt(0).toUpperCase() + (formName || 'Category').slice(1)}
              </Text>
            </View>

            {/* Save button */}
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
                  {editingCat ? 'Save Changes' : 'Create Category'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  // Tabs
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.background },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1, marginBottom: 12,
  },

  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8,
  },
  catEmoji: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiText: { fontSize: 20 },
  catInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  catBadge: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: Colors.primary,
    borderStyle: 'dashed', borderRadius: 14,
    paddingVertical: 16, marginTop: 16,
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, fontSize: 15, color: Colors.textPrimary,
  },
  inputDisabled: { opacity: 0.5 },
  hintText: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  emojiGrid: { gap: 8, paddingVertical: 4 },
  emojiOption: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.input, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  emojiSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  emojiOptionText: { fontSize: 22 },

  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  colorOption: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorSelected: { borderColor: Colors.white, transform: [{ scale: 1.15 }] },

  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.input, borderRadius: 14, padding: 14, marginBottom: 20,
  },
  previewName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.background },
});
