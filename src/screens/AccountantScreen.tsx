import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import type { MainStackParamList } from '../navigation/navigationTypes';

type Nav = StackNavigationProp<MainStackParamList>;

interface ModuleItem {
  key: keyof MainStackParamList;
  icon: IconName;
  iconColor: string;
  title: string;
  subtitle: string;
}

const MODULES: ModuleItem[] = [
  {
    key: 'SmartLedger',
    icon: 'list',
    iconColor: Colors.teal,
    title: 'Smart Ledger',
    subtitle: 'Recurring entries, tags & multi-source income',
  },
  {
    key: 'BudgetPlanner',
    icon: 'target',
    iconColor: Colors.orange,
    title: 'Budget Planner',
    subtitle: 'Monthly targets with rollover tracking',
  },
  {
    key: 'SavingsGoals',
    icon: 'flag',
    iconColor: Colors.primary,
    title: 'Savings Goals',
    subtitle: 'Track goals & contributions',
  },
  {
    key: 'TaxEstimator',
    icon: 'briefcase',
    iconColor: Colors.purple,
    title: 'Tax Estimator',
    subtitle: 'Old vs New regime, 80C/80D, HRA, GST',
  },
  {
    key: 'PnlReport',
    icon: 'bar-chart',
    iconColor: Colors.accent,
    title: 'P&L Reports',
    subtitle: 'Income vs expense trends & insights',
  },
  {
    key: 'DailyHeatmap',
    icon: 'calendar',
    iconColor: Colors.primary,
    title: 'Daily Heatmap',
    subtitle: 'Which days of the month you spend the most',
  },
];

export default function AccountantScreen() {
  const navigation = useNavigation<Nav>();
  const haptics = useHaptics();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ari Accountant</Text>
          <Text style={styles.headerSub}>Your personal finance toolkit</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.key}
            style={styles.moduleCard}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={mod.title}
            onPress={() => {
              haptics.light();
              navigation.navigate(mod.key as any);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: mod.iconColor + '20' }]}>
              <Icon name={mod.icon} size={24} color={mod.iconColor} />
            </View>
            <View style={styles.moduleText}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleSub}>{mod.subtitle}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: 20, gap: 12 },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: { flex: 1 },
  moduleTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  moduleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
});
