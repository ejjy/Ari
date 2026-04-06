import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import Icon from './ui/Icon';
import type { Nudge } from '../types';

interface Props {
  nudge: Nudge;
}

export default function NudgeCard({ nudge }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {nudge.emoji ? (
          <Text style={styles.emoji}>{nudge.emoji}</Text>
        ) : (
          <Icon name="zap" size={20} color={Colors.primary} />
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Tomo says</Text>
        </View>
      </View>
      <Text style={styles.title}>{nudge.title}</Text>
      <Text style={styles.message}>{nudge.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0,200,150,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.25)',
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  badge: {
    backgroundColor: 'rgba(0,200,150,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
