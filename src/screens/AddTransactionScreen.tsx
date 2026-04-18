import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { StackScreenProps } from '@react-navigation/stack';
import type { MainStackParamList } from '../navigation/navigationTypes';
import { useData } from '../context/DataContext';
import { ApiError } from '../api/client';
import TypeToggle from '../components/TypeToggle';
import CategoryPicker from '../components/CategoryPicker';
import QuickAmounts from '../components/QuickAmounts';
import ErrorBanner from '../components/ui/ErrorBanner';
import Button from '../components/ui/Button';
import { Colors } from '../constants/colors';
import { autoDetectCategory } from '../utils/autoDetectCategory';
import { parseMerchant } from '../utils/merchantParser';
import { todayISO } from '../utils/dateHelpers';
import { useHaptics } from '../hooks/useHaptics';
import Icon from '../components/ui/Icon';

type Props = StackScreenProps<MainStackParamList, 'AddTransaction'>;

export default function AddTransactionScreen({ navigation, route }: Props) {
  const initialType = route.params?.type ?? 'expense';
  const { addTransaction, userCategories, fetchUserCategories } = useData();
  const haptics = useHaptics();

  // Fetch custom categories on mount if not loaded
  React.useEffect(() => {
    if (userCategories.length === 0) fetchUserCategories();
  }, [userCategories.length, fetchUserCategories]);

  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState(
    initialType === 'expense' ? 'food' : 'salary'
  );
  const [date, setDate] = useState(todayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setCategory(newType === 'expense' ? 'food' : 'salary');
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    // Spec §3 fast-path: MerchantDB first (80% case). Fall back to the
    // keyword detector for free-form terms like "coffee" / "movie".
    const merchant = parseMerchant(text);
    if (merchant) {
      setCategory(merchant.category);
      if (merchant.type !== type) setType(merchant.type);
      return;
    }
    const detected = autoDetectCategory(text, type);
    if (detected) {
      setCategory(detected.category);
      if (detected.type !== type) setType(detected.type);
    }
  };

  const handleDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) {
      setDate(selected.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async () => {
    setError('');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amt > 10000000) {
      setError('Amount seems too large');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: amt,
        category,
        description: description.trim(),
        note: note.trim(),
        date,
      });

      // Success animation
      setSuccess(true);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      haptics.success();

      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (err) {
      haptics.error();
      setError(err instanceof ApiError ? err.message : 'Failed to save transaction');
      setLoading(false);
    }
  };

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  if (success) {
    return (
      <View style={styles.successScreen}>
        <Animated.View
          style={[
            styles.successContent,
            { opacity: successOpacity, transform: [{ scale: successScale }] },
          ]}
        >
          <Icon name="check-circle" size={72} color={Colors.primary} />
          <Text style={styles.successText}>Saved!</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Handle bar for modal */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ErrorBanner message={error} />

          {/* Type Toggle */}
          <TypeToggle value={type} onChange={handleTypeChange} />

          {/* Amount */}
          <View style={styles.amountRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
              selectionColor={Colors.primary}
            />
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickRow}>
            <QuickAmounts onSelect={(a) => setAmount(String(a))} />
          </View>

          {/* Description */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={handleDescriptionChange}
                placeholder="What was this for? (auto-detects category)"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="next"
                selectionColor={Colors.primary}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Category</Text>
            <CategoryPicker
              selected={category}
              type={type}
              onSelect={setCategory}
              customCategories={userCategories}
            />
          </View>

          {/* Date */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={16} color={Colors.textSecondary} />
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
              <Text style={styles.dateEdit}>Change</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(date + 'T00:00:00')}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          )}

          {/* Note */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={[styles.textInput, { minHeight: 60 }]}
                value={note}
                onChangeText={setNote}
                placeholder="Any extra details..."
                placeholderTextColor={Colors.textMuted}
                multiline
                selectionColor={Colors.primary}
              />
            </View>
          </View>

          <Button onPress={handleSubmit} loading={loading} fullWidth style={styles.saveBtn}>
            Save Transaction
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.card },
  handle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 10,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: Colors.border,
  },
  cancelText: { fontSize: 16, color: Colors.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, gap: 8,
  },
  rupeeSign: { fontSize: 40, fontWeight: '700', color: Colors.textMuted },
  amountInput: {
    fontSize: 52, fontWeight: '800', color: Colors.textPrimary,
    minWidth: 100, textAlign: 'center',
  },
  quickRow: { marginBottom: 24 },
  inputBlock: { marginBottom: 20 },
  inputLabel: {
    fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginBottom: 10,
  },
  textInputBox: {
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  textInput: { fontSize: 14, color: Colors.textPrimary, paddingVertical: 12 },
  dateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.input, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 14,
  },
  dateText: { fontSize: 14, color: Colors.textPrimary },
  dateEdit: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  doneBtn: { alignItems: 'center', padding: 12 },
  doneBtnText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  saveBtn: { marginTop: 8 },
  successScreen: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  successContent: { alignItems: 'center', gap: 12 },
  successEmoji: { fontSize: 72 },
  successText: { fontSize: 24, fontWeight: '700', color: Colors.primary },
});
