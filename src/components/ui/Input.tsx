import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { color, font } from '../../theme/tokens';
import { Layout } from '../../constants/layout';
import Icon from './Icon';

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
          placeholderTextColor={color.inkFaint}
          selectionColor={color.forest}
          secureTextEntry={showPasswordToggle ? !visible : secureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
            accessibilityLabel="Toggle password visibility"
            accessibilityRole="button"
          >
            <Icon name={visible ? 'eye-off' : 'eye'} size={18} color={color.inkSoft} />
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
    fontFamily: font.bodyMed,
    fontSize: 13,
    color: color.inkSoft,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.cream2,
    borderRadius: Layout.inputRadius,
    borderWidth: 1,
    borderColor: color.line,
  },
  inputError: {
    borderColor: color.clay,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: font.body,
    fontSize: 15,
    color: color.ink,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: font.body,
    fontSize: 12,
    color: color.clay,
    marginTop: 6,
  },
});
