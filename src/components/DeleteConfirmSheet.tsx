import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font } from '../theme/tokens';
import Icon from './ui/Icon';
import Button from './ui/Button';

interface Props {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmSheet({
  visible,
  title = 'Delete?',
  message = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const insets = useSafeAreaInsets();
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
            <Icon name="alert-triangle" size={40} color={color.clay} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Button
              variant="secondary"
              onPress={onCancel}
              style={styles.btn}
              disabled={loading}
              accessibilityLabel="Cancel deletion"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={onConfirm}
              style={styles.btn}
              loading={loading}
              accessibilityLabel="Confirm deletion"
            >
              Delete
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
    backgroundColor: 'rgba(35,41,31,0.55)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: color.line,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: color.line,
    borderRadius: 2,
    marginBottom: 20,
  },
  iconContainer: { marginBottom: 12 },
  title: {
    fontFamily: font.bodyBold,
    fontSize: 18,
    color: color.ink,
    marginBottom: 8,
  },
  message: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: { flex: 1 },
});
