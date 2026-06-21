import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';
import { Layout } from '../../constants/layout';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
  },
});
