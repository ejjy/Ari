import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { StackScreenProps } from '@react-navigation/stack';
import type { MainStackParamList } from '../navigation/navigationTypes';
import { useData } from '../context/DataContext';
import { ApiError } from '../api/client';
import CategoryPicker from '../components/CategoryPicker';
import Icon from '../components/ui/Icon';
import { color, font, type as ftype } from '../theme/tokens';
import { getCategoryDef } from '../constants/categories';
import { autoDetectCategory } from '../utils/autoDetectCategory';
import { parseMerchant } from '../utils/merchantParser';
import { parseExpenseAI, type AiParseResult } from '../api/parse';
import ConfidenceConfirmSheet from '../components/ConfidenceConfirmSheet';
import { todayISO, toLocalISODate, formatSectionDate } from '../utils/dateHelpers';
import { useHaptics } from '../hooks/useHaptics';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { Category, TransactionType } from '../types';

type Props = StackScreenProps<MainStackParamList, 'AddTransaction'>;

const MAX_AMOUNT = 10_000_000; // ₹1 crore (D5)
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/**
 * Fast Entry (Sprint 2, Commit 3). Keypad-first, amount-and-direction-only
 * happy path: a Spent/Received toggle, a big Fraunces amount with a blinking
 * caret, an in-app numeric keypad (no decimal — whole rupees, D5), and Save.
 * Everything else is an optional chip. The voice + MerchantDB + Gemini parse
 * pipeline is preserved (D1) behind the note chip: typing/speaking a
 * description auto-fills the category. Writes go through DataContext, which is
 * local-first (Commit 2), so Save returns instantly and works offline.
 */
export default function AddTransactionScreen({ navigation, route }: Props) {
  const params = route.params as
    | { type?: 'expense' | 'income' }
    | { editTransaction: { id: string; type: 'expense' | 'income'; amount: number; category: string; description: string; note: string; date: string } }
    | undefined;
  const editTxn = params && 'editTransaction' in params ? params.editTransaction : null;
  const isEdit = !!editTxn;
  const initialType: TransactionType = editTxn?.type ?? (params as { type?: 'expense' | 'income' } | undefined)?.type ?? 'expense';

  const { addTransaction, updateTransaction, userCategories, fetchUserCategories } = useData();
  const haptics = useHaptics();

  useEffect(() => {
    if (userCategories.length === 0) fetchUserCategories();
  }, [userCategories.length, fetchUserCategories]);

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(editTxn ? String(editTxn.amount) : ''); // digits only, '' renders as 0
  const [description, setDescription] = useState(editTxn?.description ?? '');
  const [category, setCategory] = useState(editTxn?.category ?? (initialType === 'expense' ? 'food' : 'salary'));
  const [date, setDate] = useState(editTxn?.date ?? todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sheets
  const [showNote, setShowNote] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toast, setToast] = useState(false);

  // Parse provenance (kept from the previous screen — D1).
  const [parseSource, setParseSource] = useState<'local' | 'fuzzy' | 'ai' | undefined>();
  const [confidence, setConfidence] = useState<number | undefined>();
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState<string | undefined>();
  const [pendingAi, setPendingAi] = useState<AiParseResult | null>(null);
  const [aiConfirmVisible, setAiConfirmVisible] = useState(false);
  const [entryType, setEntryType] = useState<'manual' | 'voice'>('manual');
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTextRef = useRef('');

  const caretOpacity = useRef(new Animated.Value(1)).current;
  const toastY = useRef(new Animated.Value(20)).current;

  // Blinking caret on the amount display.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(caretOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(caretOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [caretOpacity]);

  useEffect(() => {
    return () => {
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, []);

  const handleTypeChange = (next: TransactionType) => {
    haptics.light();
    setType(next);
    setCategory(next === 'expense' ? 'food' : 'salary');
  };

  const applyAiResult = useCallback(
    (r: AiParseResult) => {
      setCategory(r.category);
      if (r.type !== type) setType(r.type);
      if (r.merchant) setMerchantName(r.merchant);
      if (!amount && r.amount > 0) setAmount(String(Math.round(r.amount)));
      setParseSource('ai');
      setConfidence(r.confidence);
      setRawInput(r.rawInput);
    },
    [amount, type]
  );

  // Description -> category via MerchantDB (sync), then keyword detector, then
  // a debounced Gemini call. Identical pipeline to the prior screen (D1).
  const handleDescriptionChange = useCallback(
    (text: string) => {
      setDescription(text);
      latestTextRef.current = text;

      const merchant = parseMerchant(text);
      if (merchant) {
        setCategory(merchant.category);
        if (merchant.type !== type) setType(merchant.type);
        setMerchantName(merchant.merchant);
        setParseSource(merchant.source);
        setConfidence(merchant.confidence);
        setRawInput(undefined);
        if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
        return;
      }

      const detected = autoDetectCategory(text, type);
      if (detected) {
        setCategory(detected.category);
        if (detected.type !== type) setType(detected.type);
        setMerchantName(null);
        setParseSource('local');
        setConfidence(1.0);
        setRawInput(undefined);
        if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
        return;
      }

      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
      if (text.trim().length < 4) return;
      aiDebounceRef.current = setTimeout(async () => {
        if (latestTextRef.current !== text) return;
        try {
          const r = await parseExpenseAI(text);
          if (latestTextRef.current !== text) return;
          if (r.confidence >= 0.7) applyAiResult(r);
          else {
            setPendingAi(r);
            setAiConfirmVisible(true);
          }
        } catch {
          /* opportunistic — user can still save */
        }
      }, 600);
    },
    [type, applyAiResult]
  );

  // Voice input streams into the description (D1 differentiator).
  const voice = useVoiceInput();
  useEffect(() => {
    if (!voice.transcript) return;
    setEntryType('voice');
    handleDescriptionChange(voice.transcript);
  }, [voice.transcript, handleDescriptionChange]);

  const handleAiConfirm = () => {
    if (pendingAi) applyAiResult(pendingAi);
    setAiConfirmVisible(false);
    setPendingAi(null);
  };
  const handleAiCancel = () => {
    setAiConfirmVisible(false);
    setPendingAi(null);
  };

  const press = (k: string) => {
    setError('');
    haptics.light();
    if (k === 'del') {
      setAmount((a) => a.slice(0, -1));
      return;
    }
    if (k === '') return;
    setAmount((a) => {
      if (a === '' && k === '0') return a; // no leading zero
      const next = a + k;
      if (Number(next) > MAX_AMOUNT) return a;
      if (next.length > 8) return a;
      return next;
    });
  };

  const handleDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(toLocalISODate(selected));
  };

  const numericAmount = amount === '' ? 0 : Number(amount);
  const canSave = numericAmount > 0 && !saving;

  const handleSave = async () => {
    if (numericAmount <= 0) {
      setError('Enter an amount');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editTxn) {
        await updateTransaction(editTxn.id, {
          type,
          amount: numericAmount,
          category,
          description: description.trim(),
          note: editTxn.note,
          date,
        });
      } else {
        await addTransaction({
          type,
          amount: numericAmount,
          category,
          description: description.trim(),
          note: '',
          date,
          parseSource,
          confidence,
          merchant: merchantName,
          rawInput,
          entryType,
        });
      }
      haptics.success();
      // Toast, then auto-return. DataContext write is local-first so this
      // is instant even offline.
      setToast(true);
      Animated.timing(toastY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      setTimeout(() => navigation.goBack(), 850);
    } catch (err) {
      haptics.error();
      setError(err instanceof ApiError ? err.message : 'Could not save. Try again.');
      setSaving(false);
    }
  };

  // Chip display uses the built-in defs; a custom category falls back to a
  // generic emoji + its capitalized name, which reads fine on the chip.
  const cat = getCategoryDef(category);
  const displayAmount = numericAmount.toLocaleString('en-IN');
  const dateLabel = date === todayISO() ? 'Today' : formatSectionDate(date);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.close}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit entry' : 'New entry'}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Spent / Received toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'expense' && styles.toggleOut]}
          onPress={() => handleTypeChange('expense')}
          accessibilityRole="button"
        >
          <Text style={[styles.toggleLabel, type === 'expense' && styles.toggleLabelOn]}>Spent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'income' && styles.toggleIn]}
          onPress={() => handleTypeChange('income')}
          accessibilityRole="button"
        >
          <Text style={[styles.toggleLabel, type === 'income' && styles.toggleLabelOn]}>Received</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>
          {type === 'expense' ? 'Amount spent' : 'Amount received'}
        </Text>
        <View style={styles.amountRow}>
          <Text style={[styles.amountValue, type === 'income' && { color: color.forest2 }]}>
            <Text style={styles.rupee}>₹</Text>
            {displayAmount}
          </Text>
          <Animated.View style={[styles.caret, { opacity: caretOpacity }]} />
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      {/* Optional chips */}
      <View style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, styles.chipAuto]}
          onPress={() => {
            haptics.light();
            setShowCategory(true);
          }}
          accessibilityLabel="Category"
          accessibilityRole="button"
        >
          {parseSource && <Text style={styles.chipAi}>✦</Text>}
          <Text style={styles.chipAutoText}>
            {cat.emoji} {cat.label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chip}
          onPress={() => {
            haptics.light();
            setShowNote(true);
          }}
          accessibilityLabel="Add a note"
          accessibilityRole="button"
        >
          <Text style={styles.chipText}>{description ? '✎ Note' : '＋ Note'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chip}
          onPress={() => {
            haptics.light();
            setShowDatePicker(true);
          }}
          accessibilityLabel="Date"
          accessibilityRole="button"
        >
          <Text style={styles.chipText}>{dateLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((k, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.key, k === '' && styles.keyEmpty]}
            activeOpacity={k === '' ? 1 : 0.7}
            onPress={() => press(k)}
            disabled={k === ''}
            accessibilityLabel={k === 'del' ? 'Delete' : k || undefined}
            accessibilityRole={k === '' ? undefined : 'button'}
          >
            <Text style={[styles.keyText, k === 'del' && styles.keyFn]}>
              {k === 'del' ? '⌫' : k}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.save, !canSave && styles.saveDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? 'Update entry' : 'Save entry'}
      >
        <Text style={styles.saveText}>{isEdit ? 'Update entry' : 'Save entry'}</Text>
      </TouchableOpacity>

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, { transform: [{ translateX: -70 }, { translateY: toastY }] }]}>
          <Text style={styles.toastText}>{isEdit ? '✓ Entry updated' : '✓ Entry saved'}</Text>
        </Animated.View>
      )}

      {/* Note sheet — also carries the voice mic (D1) */}
      <Modal visible={showNote} transparent animationType="slide" onRequestClose={() => setShowNote(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>What was this for?</Text>
            <View style={styles.noteRow}>
              <TextInput
                style={styles.noteInput}
                value={description}
                onChangeText={(t) => {
                  setEntryType('manual');
                  handleDescriptionChange(t);
                }}
                placeholder={voice.isListening ? 'Listening…' : 'e.g. groceries, auto, electricity'}
                placeholderTextColor={color.inkFaint}
                autoFocus
                editable={!voice.isListening}
                returnKeyType="done"
                onSubmitEditing={() => setShowNote(false)}
              />
              {voice.isAvailable && (
                <TouchableOpacity
                  style={[styles.mic, voice.isListening && styles.micActive]}
                  onPress={() => {
                    haptics.light();
                    if (voice.isListening) voice.stop();
                    else voice.start();
                  }}
                  accessibilityLabel={voice.isListening ? 'Stop voice' : 'Start voice'}
                  accessibilityRole="button"
                >
                  <Icon
                    name={voice.isListening ? 'mic-off' : 'mic'}
                    size={18}
                    color={voice.isListening ? color.card : color.forest}
                  />
                </TouchableOpacity>
              )}
            </View>
            {!!voice.error && <Text style={styles.error}>{voice.error}</Text>}
            <TouchableOpacity style={styles.sheetDone} onPress={() => setShowNote(false)}>
              <Text style={styles.sheetDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category sheet */}
      <Modal visible={showCategory} transparent animationType="slide" onRequestClose={() => setShowCategory(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Category</Text>
            <CategoryPicker
              selected={category}
              type={type}
              onSelect={(c) => {
                setCategory(c);
                setParseSource(undefined); // user override clears the AI guess mark
                setShowCategory(false);
              }}
              customCategories={userCategories}
            />
            <TouchableOpacity style={styles.sheetDone} onPress={() => setShowCategory(false)}>
              <Text style={styles.sheetDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(date + 'T00:00:00')}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {pendingAi && (
        <ConfidenceConfirmSheet
          visible={aiConfirmVisible}
          confidence={pendingAi.confidence}
          amount={pendingAi.amount}
          category={pendingAi.category as Category}
          type={pendingAi.type as TransactionType}
          merchant={pendingAi.merchant}
          onConfirm={handleAiConfirm}
          onCancel={handleAiCancel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream, paddingHorizontal: 22 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.lineStrong,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 17, color: color.inkSoft },
  title: { fontFamily: font.displaySemi, fontSize: ftype.screenTitle, color: color.forestDeep },
  toggle: {
    flexDirection: 'row',
    backgroundColor: color.cream2,
    borderRadius: 16,
    padding: 5,
    marginTop: 22,
    gap: 5,
    borderWidth: 1,
    borderColor: color.line,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  toggleOut: { backgroundColor: color.clay },
  toggleIn: { backgroundColor: color.forest },
  toggleLabel: { fontFamily: font.bodySemi, fontSize: 14.5, color: color.inkSoft },
  toggleLabelOn: { color: color.card },
  amountBox: { alignItems: 'center', paddingTop: 28, paddingBottom: 4 },
  amountLabel: {
    fontFamily: font.bodyBold,
    fontSize: ftype.eyebrow,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.inkFaint,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  amountValue: {
    fontFamily: font.display,
    fontSize: ftype.addAmount,
    letterSpacing: -1,
    color: color.ink,
  },
  rupee: { fontFamily: font.display, fontSize: 32, color: color.inkFaint },
  caret: { width: 2, height: 44, backgroundColor: color.clay, marginLeft: 3 },
  error: { fontFamily: font.bodyMed, fontSize: 12.5, color: color.clay, marginTop: 8 },
  chips: { flexDirection: 'row', gap: 9, justifyContent: 'center', flexWrap: 'wrap', marginVertical: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  chipText: { fontFamily: font.bodySemi, fontSize: 12.5, color: color.inkSoft },
  chipAuto: { backgroundColor: color.cream2, borderColor: color.lineStrong },
  chipAutoText: { fontFamily: font.bodySemi, fontSize: 12.5, color: color.forest },
  chipAi: { fontSize: 11, color: color.gold },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  key: {
    width: '31.5%',
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 9,
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontFamily: font.display, fontSize: 23, color: color.ink },
  keyFn: { fontFamily: font.body, fontSize: 18, color: color.inkSoft },
  save: {
    backgroundColor: color.forest,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  saveDisabled: { opacity: 0.45 },
  saveText: { fontFamily: font.bodySemi, fontSize: ftype.screenTitle, color: color.cream },
  toast: {
    position: 'absolute',
    bottom: 96,
    left: '50%',
    backgroundColor: color.forestDeep,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 13,
  },
  toastText: { fontFamily: font.bodySemi, fontSize: 13.5, color: color.cream },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(21,42,30,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: color.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
  },
  sheetTitle: { fontFamily: font.displaySemi, fontSize: ftype.sectionHead, color: color.forestDeep, marginBottom: 14 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteInput: {
    flex: 1,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 14,
    color: color.ink,
  },
  mic: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  micActive: { backgroundColor: color.forest, borderColor: color.forest },
  sheetDone: {
    marginTop: 18,
    backgroundColor: color.forest,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetDoneText: { fontFamily: font.bodySemi, fontSize: 15, color: color.cream },
});
