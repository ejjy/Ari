import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export default function Input({
  label,
  error,
  rightElement,
  showPasswordToggle,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          secureTextEntry={showPasswordToggle ? !visible : secureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{visible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
        {rightElement && !showPasswordToggle && (
          <View style={styles.toggle}>{rightElement}</View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input,
    borderRadius: Layout.inputRadius,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
  },
});
