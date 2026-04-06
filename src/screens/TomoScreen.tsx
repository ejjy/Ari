import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import ChatBubble from '../components/ChatBubble';
import Icon from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';

const QUICK_PROMPTS = [
  'How much did I spend this month?',
  'Am I saving enough?',
  'Tips to reduce food expenses?',
  'How to start investing in India?',
  'Help me create a budget plan',
  'What is SIP and how to start?',
];

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 250, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.delay(500),
        ])
      );

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={typing.row}>
      <View style={typing.avatar}><Icon name="bot" size={16} color={Colors.primary} /></View>
      <View style={typing.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[typing.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const typing = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: 16, gap: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  bubble: {
    flexDirection: 'row', gap: 4,
    backgroundColor: Colors.card, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textSecondary },
});

export default function TomoScreen() {
  const { chatHistory, tomoLoading, askTomo, clearChat } = useData();
  const haptics = useHaptics();
  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');

  const showQuickPrompts = chatHistory.length <= 1;

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(scrollToBottom, [chatHistory, tomoLoading]);

  const handleSend = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || tomoLoading) return;
    setInput('');
    haptics.light();
    await askTomo(text);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarBox}><Icon name="bot" size={22} color={Colors.primary} /></View>
            <View>
              <Text style={styles.headerName}>Tomo</Text>
              <Text style={styles.headerSub}>Your AI Finance Coach</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => { haptics.light(); clearChat(); }}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear chat history"
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <FlatList
          ref={listRef}
          data={chatHistory}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={
            <>
              {tomoLoading && <TypingIndicator />}
              {showQuickPrompts && !tomoLoading && (
                <View style={styles.prompts}>
                  <Text style={styles.promptsLabel}>Try asking:</Text>
                  {QUICK_PROMPTS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => handleSend(p)}
                      style={styles.promptBtn}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={p}
                    >
                      <Text style={styles.promptText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Tomo anything..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            selectionColor={Colors.primary}
            multiline
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || tomoLoading}
            style={[styles.sendBtn, (!input.trim() || tomoLoading) && styles.sendBtnDisabled]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Icon name="send" size={18} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,200,150,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.3)',
  },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  clearText: { fontSize: 14, color: Colors.textMuted },
  listContent: { paddingTop: 16, paddingBottom: 16 },
  prompts: { paddingHorizontal: 16, gap: 8, marginTop: 16 },
  promptsLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  promptBtn: {
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  promptText: { fontSize: 13, color: Colors.textSecondary },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  input: {
    flex: 1, backgroundColor: Colors.input,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
