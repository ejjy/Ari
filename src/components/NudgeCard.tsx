import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font } from '../theme/tokens';
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
          <Icon name="zap" size={20} color={color.forest} />
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
    backgroundColor: color.cream2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
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
    backgroundColor: color.cream2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: font.bodySemi,
    color: color.forest,
  },
  title: {
    fontSize: 15,
    fontFamily: font.bodyBold,
    color: color.ink,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    fontFamily: font.body,
    color: color.inkSoft,
    lineHeight: 20,
  },
});
