import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import Icon from './ui/Icon';
import Button from './ui/Button';
import type { Category, TransactionType } from '../types';

interface Props {
  visible: boolean;
  confidence: number;       // 0–1
  amount: number;
  category: Category;
  type: TransactionType;
  merchant?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Spec §5.1: "If confidence < 0.70: return to user with 'Confirm this
 * category?' prompt before saving." Shown after the Gemini fallback
 * parser returns a low-confidence result — user can tap Confirm to
 * accept the AI's guess, or Edit to tweak the form before saving.
 */
export default function ConfidenceConfirmSheet({
  visible,
  confidence,
  amount,
  category,
  type,
  merchant,
  onConfirm,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const pct = Math.round(confidence * 100);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.sheetWrapper}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.iconContainer}>
            <Icon name="help-circle" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Confirm this category?</Text>
          <Text style={styles.message}>
            Our AI is {pct}% confident this is a{' '}
            <Text style={styles.bold}>{category}</Text> {type}
            {merchant ? ` at ${merchant}` : ''}
            {amount > 0 ? ` for ₹${amount.toLocaleString('en-IN')}` : ''}.
          </Text>
          <View style={styles.buttons}>
            <Button
              variant="secondary"
              onPress={onCancel}
              style={styles.btn}
              accessibilityLabel="Edit manually"
            >
              Edit
            </Button>
            <Button
              variant="primary"
              onPress={onConfirm}
              style={styles.btn}
              accessibilityLabel="Confirm the AI's parse"
            >
              Confirm
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 20,
  },
  iconContainer: { marginBottom: 12 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  bold: { fontWeight: '700', color: Colors.textPrimary },
  buttons: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { flex: 1 },
});
