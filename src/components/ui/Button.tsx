import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { color, font } from '../../theme/tokens';
import { Layout } from '../../constants/layout';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: color.forest },
    text: { color: color.cream },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: color.forest,
    },
    text: { color: color.forest },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: color.inkSoft },
  },
  danger: {
    container: { backgroundColor: color.clay },
    text: { color: color.cream },
  },
};

export default function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  accessibilityLabel,
  accessibilityRole = 'button',
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[
        styles.base,
        vStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? color.cream : color.forest}
        />
      ) : (
        <Text style={[styles.text, vStyle.text, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: font.bodySemi,
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
