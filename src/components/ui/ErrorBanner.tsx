import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

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
    backgroundColor: 'rgba(255,71,87,0.12)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: Colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
