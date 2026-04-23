import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { patchMe } from '../api/auth';
import Button from './ui/Button';
import Icon from './ui/Icon';
import ErrorBanner from './ui/ErrorBanner';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';

/** Settings sub-screen — set/clear the user's UPI VPA so other group
 * members can pay them back via UPI. Validates basic shape (`name@bank`). */
export default function UpiVpaEditor({ onBack }: { onBack: () => void }) {
  const { user, refreshFromSession } = useAuth();
  const haptics = useHaptics();
  const [vpa, setVpa] = useState(user?.upiVpa ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    const v = vpa.trim();
    if (v && !/^[\w.\-]+@[\w.\-]+$/.test(v)) {
      setError('VPA should look like name@bank (e.g. 9876543210@ybl)');
      return;
    }
    setSaving(true);
    try {
      const updated = await patchMe({ upiVpa: v || null });
      await refreshFromSession(updated);
      haptics.success();
      onBack();
    } catch (e) {
      haptics.error();
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} hitSlop={8}>
            <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>UPI for settlements</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.help}>
            Your UPI VPA is used to compose deeplinks when other group members
            settle a balance owed to you. We never see your bank account
            number.
          </Text>

          <ErrorBanner message={error} />

          <Text style={styles.label}>Your VPA</Text>
          <TextInput
            style={styles.input}
            value={vpa}
            onChangeText={setVpa}
            placeholder="9876543210@ybl"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.examples}>
            Examples: <Text style={styles.exampleCode}>name@okhdfcbank</Text>,{' '}
            <Text style={styles.exampleCode}>9876543210@paytm</Text>,{' '}
            <Text style={styles.exampleCode}>name@ybl</Text>
          </Text>

          <Button onPress={save} loading={saving} fullWidth style={{ marginTop: 24 }}>
            Save
          </Button>

          {user?.upiVpa && (
            <TouchableOpacity
              onPress={() => { setVpa(''); }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>Clear my VPA</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 20 },
  help: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 16 },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Colors.input, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: Colors.textPrimary,
  },
  examples: { fontSize: 12, color: Colors.textMuted, marginTop: 10 },
  exampleCode: { color: Colors.textPrimary, fontWeight: '600' },
  clearBtn: { marginTop: 12, alignItems: 'center', padding: 10 },
  clearText: { fontSize: 13, color: Colors.danger },
});
