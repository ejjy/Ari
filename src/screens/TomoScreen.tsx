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
import { color, font } from '../theme/tokens';
import { useHaptics } from '../hooks/useHaptics';

const QUICK_PROMPTS = [
  'How much did I spend this month?',
  'Am I saving enough?',
  'Tips to reduce food expenses?',
  'Where can I cut back this month?',
  'Help me create a budget plan',
  'Explain the 50/30/20 rule',
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
      <View style={typing.avatar}><Icon name="bot" size={16} color={color.forest} /></View>
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
    backgroundColor: color.cream2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.line,
  },
  bubble: {
    flexDirection: 'row', gap: 4,
    backgroundColor: color.card, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: color.line, alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: color.inkSoft },
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
            <View style={styles.avatarBox}><Icon name="bot" size={22} color={color.forest} /></View>
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
            placeholderTextColor={color.inkFaint}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            selectionColor={color.forest}
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
            <Icon name="send" size={18} color={color.cream} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: color.line,
    backgroundColor: color.card,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: color.cream2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.line,
  },
  headerName: { fontFamily: font.bodySemi, fontSize: 16, color: color.ink },
  headerSub: { fontFamily: font.body, fontSize: 12, color: color.inkSoft },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  clearText: { fontFamily: font.body, fontSize: 14, color: color.inkFaint },
  listContent: { paddingTop: 16, paddingBottom: 16 },
  prompts: { paddingHorizontal: 16, gap: 8, marginTop: 16 },
  promptsLabel: { fontFamily: font.bodySemi, fontSize: 12, color: color.inkFaint, marginBottom: 4 },
  promptBtn: {
    backgroundColor: color.card, borderRadius: 20,
    borderWidth: 1, borderColor: color.line,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  promptText: { fontFamily: font.body, fontSize: 13, color: color.inkSoft },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderColor: color.line,
    backgroundColor: color.card,
  },
  input: {
    flex: 1, backgroundColor: color.cream2,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: font.body, fontSize: 14, color: color.ink, maxHeight: 100,
    borderWidth: 1, borderColor: color.line,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: color.forest, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: color.line },
});
