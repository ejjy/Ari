import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';

// LayoutAnimation needs to be enabled on Android — guarded so a hot-reload
// doesn't double-enable it.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  onBack: () => void;
}

interface Faq {
  q: string;
  a: string;
}

/**
 * Plain-English answers to the questions users actually ask in feedback.
 * Keep entries short — if an answer needs more than ~4 lines it probably
 * belongs in a doc, not in-app.
 */
const FAQS: Faq[] = [
  {
    q: 'How do I add a transaction?',
    a: 'On the Dashboard, use the Quick Actions row at the top — tap "Add Expense" or "Add Income". You can also use the Quick Entry tab to type a sentence like "350 lunch zomato" and Ari will categorise it.',
  },
  {
    q: 'How do I set or change my budget?',
    a: 'Open the Budget tab, then tap "+ Add" to create a category budget, or tap an existing one to edit it. Ari warns you when you cross 80% so there are no end-of-month surprises.',
  },
  {
    q: 'Who is Tomo?',
    a: 'Tomo is your AI finance coach — a chat tab built right into Ari. Ask anything, from "how should I split my salary" to "where did my money go this week". Tomo only sees the data you allow.',
  },
  {
    q: 'Is my financial data safe?',
    a: 'Yes. Your data is encrypted in transit and at rest. Sensitive details like card or account numbers are stripped before any AI request. Turn on Biometric Lock in Settings for an extra layer.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes — Settings → Export Data lets you download all your transactions as CSV. Your data is yours; you can take it with you any time.',
  },
  {
    q: 'How do I change the daily reminder time?',
    a: 'Settings → Daily Reminders. Toggle reminders on, then tap the time below to pick when Tomo should nudge you each day.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Settings → Delete Account. This permanently removes your account and all financial data. The action cannot be undone.',
  },
];

const SUPPORT_EMAIL = 'support@aritomo.in';

export default function HelpSupportScreen({ onBack }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === i ? null : i);
  };

  const openEmail = () => {
    const subject = encodeURIComponent('Ari Support Request');
    const body = encodeURIComponent(
      'Hi Ari team,\n\nDescribe what you need help with:\n\n\n— Sent from the Ari app'
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {
      // mailto: fails on devices with no mail client — fall back silently.
    });
  };

  const openWebsite = () => {
    Linking.openURL('https://aritomo.in').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Go back" accessibilityRole="button">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — sets a friendly, "real humans here" tone */}
        <AnimatedEntry delay={60}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Icon name="help-circle" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>How can we help?</Text>
            <Text style={styles.heroSubtitle}>
              Browse the FAQs below or get in touch — we read every message.
            </Text>
          </View>
        </AnimatedEntry>

        {/* Contact actions */}
        <AnimatedEntry delay={120}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={openEmail}
              activeOpacity={0.8}
              accessibilityLabel="Email support"
              accessibilityRole="button"
            >
              <Icon name="mail" size={22} color={Colors.primary} />
              <Text style={styles.actionLabel}>Email Us</Text>
              <Text style={styles.actionSubtitle}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={openWebsite}
              activeOpacity={0.8}
              accessibilityLabel="Visit website"
              accessibilityRole="button"
            >
              <Icon name="info" size={22} color={Colors.primary} />
              <Text style={styles.actionLabel}>Website</Text>
              <Text style={styles.actionSubtitle}>aritomo.in</Text>
            </TouchableOpacity>
          </View>
        </AnimatedEntry>

        {/* FAQs */}
        <AnimatedEntry delay={180}>
          <Text style={styles.sectionTitle}>Frequently Asked</Text>
          <View style={styles.faqCard}>
            {FAQS.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <View key={f.q}>
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => toggle(i)}
                    activeOpacity={0.7}
                    accessibilityLabel={f.q}
                    accessibilityRole="button"
                  >
                    <Text style={styles.faqQuestion}>{f.q}</Text>
                    <Icon
                      name={isOpen ? 'chevron-down' : 'chevron-right' as IconName}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.faqAnswerWrap}>
                      <Text style={styles.faqAnswer}>{f.a}</Text>
                    </View>
                  )}
                  {i < FAQS.length - 1 && <View style={styles.separator} />}
                </View>
              );
            })}
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={240}>
          <Text style={styles.footnote}>
            Still stuck? Email us — we usually reply within a day.
          </Text>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  backText: { fontSize: 16, color: Colors.textSecondary },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 20 },

  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,200,150,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  actionSubtitle: { fontSize: 11, color: Colors.textMuted },

  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  faqCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  faqAnswerWrap: {
    paddingBottom: 16,
    paddingRight: 24,
  },
  faqAnswer: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  separator: { height: 1, backgroundColor: Colors.border },

  footnote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
