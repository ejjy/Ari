import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font } from '../../theme/tokens';

interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠️ {message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.clayTint,
    borderWidth: 1,
    borderColor: color.clay,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: color.clay,
    fontSize: 13,
    fontFamily: font.body,
    lineHeight: 18,
  },
});
