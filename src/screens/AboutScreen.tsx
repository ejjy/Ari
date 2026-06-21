import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, font } from '../theme/tokens';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';

interface Props {
  onBack: () => void;
}

export default function AboutScreen({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Go back" accessibilityRole="button">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntry delay={100}>
          <View style={styles.logoSection}>
            <View style={styles.logoRing}>
              <Icon name="sprout" size={40} color={color.forest} />
            </View>
            <Text style={styles.appName}>Ari</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.tagline}>Your Money, Your Future</Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={200}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What is Ari?</Text>
            <Text style={styles.cardText}>
              Ari is your personal finance companion built for India. Track expenses,
              set budgets, and get AI-powered insights from Tomo — your financial coach
              who understands the Indian context.
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={300}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meet Tomo</Text>
            <Text style={styles.cardText}>
              Tomo is your AI finance coach. From SIP advice to spending analysis,
              Tomo helps you build better money habits with personalized tips and
              real-time insights.
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={400}>
          <View style={styles.featuresCard}>
            {([
              { icon: 'bar-chart' as IconName, text: 'Smart expense tracking' },
              { icon: 'target' as IconName, text: 'Category-based budgets' },
              { icon: 'bot' as IconName, text: 'AI-powered coaching' },
              { icon: 'lightbulb' as IconName, text: 'Personalized insights' },
              { icon: 'flag' as IconName, text: 'Built for India' },
            ]).map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Icon name={f.icon} size={20} color={color.forest} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={500}>
          <Text style={styles.madeWith}>
            Made with love in India
          </Text>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: color.line,
  },
  backText: { fontSize: 16, color: color.inkSoft, fontFamily: font.body },
  title: { fontSize: 17, fontFamily: font.bodyBold, color: color.ink },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 20 },
  logoSection: { alignItems: 'center', marginBottom: 8 },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color.cream2,
    borderWidth: 2,
    borderColor: color.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 36,
    fontFamily: font.displayBold,
    color: color.forest,
    letterSpacing: -1,
    marginBottom: 4,
  },
  version: { fontSize: 14, color: color.inkFaint, marginBottom: 8, fontFamily: font.body },
  tagline: { fontSize: 15, color: color.inkSoft, fontFamily: font.body },
  card: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 20,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontFamily: font.bodyBold, color: color.ink },
  cardText: { fontSize: 14, color: color.inkSoft, lineHeight: 20, fontFamily: font.body },
  featuresCard: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    gap: 12,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  featureText: { fontSize: 14, color: color.inkSoft, fontFamily: font.body },
  madeWith: {
    fontSize: 13,
    color: color.inkFaint,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: font.body,
  },
});
