import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { color, font } from '../../theme/tokens';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message, fullScreen }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={color.forest} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: color.cream,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: font.body,
    color: color.inkSoft,
  },
});
