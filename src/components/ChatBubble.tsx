import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './ui/Icon';
import { color, font } from '../theme/tokens';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Icon name="bot" size={16} color={color.forest} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleTomo,
        ]}
      >
        <Text style={[styles.text, isUser && styles.textUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.cream2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.line,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTomo: {
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: color.forest,
    borderBottomRightRadius: 4,
  },
  text: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.ink,
    lineHeight: 20,
  },
  textUser: {
    color: color.cream,
    fontFamily: font.bodyMed,
  },
});
