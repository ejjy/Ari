import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/ui/Icon';
import AnimatedEntry from '../../components/ui/AnimatedEntry';
import EmptyState from '../../components/ui/EmptyState';
import { color, font } from '../../theme/tokens';
import { usePrivacy } from '../../context/PrivacyContext';
import { useHaptics } from '../../hooks/useHaptics';
import * as reportsApi from '../../api/reports';
import type { PnlReport, PnlMonth } from '../../types';
import { CATEGORY_ICONS } from '../../components/ui/Icon';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = 40;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2;

const PERIOD_OPTIONS = [3, 6, 12] as const;

const MONTH_SHORT: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

function monthLabel(m: string): string {
  const parts = m.split('-');
  return MONTH_SHORT[parts[1]] || parts[1];
}

export default function PnlReportScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const { formatAmount } = usePrivacy();

  const [report, setReport] = useState<PnlReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<3 | 6 | 12>(6);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getPnlReport(months);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [fetchReport])
  );

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={color.forest} />
          <Text style={styles.loadingText}>Generating report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report || report.months.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} />
        <EmptyState
          emoji="📊"
          title="No Data Yet"
          subtitle="Add some transactions to see your P&L report"
        />
      </SafeAreaView>
    );
  }

  const { totals, trends, categories, incomeBreakdown } = report;
  const pnlMonths = report.months;
  const maxBarVal = Math.max(...pnlMonths.map((m) => Math.max(m.income, m.expenses)), 1);

  // Sort categories by amount descending
  const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const incEntries = Object.entries(incomeBreakdown).sort((a, b) => b[1] - a[1]);
  const totalCatAmount = catEntries.reduce((s, [, v]) => s + v, 0);
  const totalIncAmount = incEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Period Selector ─────────────────────────────────────── */}
        <AnimatedEntry delay={0}>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, months === p && styles.periodBtnActive]}
                onPress={() => { haptics.light(); setMonths(p); }}
              >
                <Text style={[styles.periodText, months === p && styles.periodTextActive]}>
                  {p}M
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntry>

        {/* ── Summary Cards ───────────────────────────────────────── */}
        <AnimatedEntry delay={60}>
          <View style={styles.summaryRow}>
            <SummaryCard label="Total Income" amount={totals.income} cardColor={color.forest} />
            <SummaryCard label="Total Expenses" amount={totals.expenses} cardColor={color.clay} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryCard
              label="Net Savings"
              amount={totals.net}
              cardColor={totals.net >= 0 ? color.forest : color.clay}
            />
            <SummaryCard
              label="Avg Savings Rate"
              amount={totals.avgSavingsRate}
              isSuffix="%"
              cardColor={totals.avgSavingsRate >= 20 ? color.forest : color.gold}
            />
          </View>
        </AnimatedEntry>

        {/* ── Trends ──────────────────────────────────────────────── */}
        {(trends.expenseChange !== 0 || trends.incomeChange !== 0) && (
          <AnimatedEntry delay={100}>
            <View style={styles.trendsCard}>
              <Text style={styles.sectionTitle}>Month-over-Month</Text>
              <View style={styles.trendRow}>
                {trends.incomeChange !== 0 && (
                  <TrendBadge
                    label="Income"
                    change={trends.incomeChange}
                  />
                )}
                {trends.expenseChange !== 0 && (
                  <TrendBadge
                    label="Expenses"
                    change={trends.expenseChange}
                    invertColor
                  />
                )}
              </View>
            </View>
          </AnimatedEntry>
        )}

        {/* ── Bar Chart ───────────────────────────────────────────── */}
        <AnimatedEntry delay={140}>
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Income vs Expenses</Text>
            <View style={styles.chart}>
              {pnlMonths.map((m, i) => {
                const barW = Math.max((CHART_WIDTH / pnlMonths.length) - 8, 20);
                return (
                  <View key={m.month} style={[styles.barGroup, { width: barW }]}>
                    <View style={styles.barPair}>
                      <View
                        style={[styles.bar, styles.barIncome, {
                          height: Math.max((m.income / maxBarVal) * 120, 2),
                        }]}
                      />
                      <View
                        style={[styles.bar, styles.barExpense, {
                          height: Math.max((m.expenses / maxBarVal) * 120, 2),
                        }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{monthLabel(m.month)}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color.forest }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color.clay }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>
        </AnimatedEntry>

        {/* ── Net Savings Trend ────────────────────────────────────── */}
        <AnimatedEntry delay={180}>
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Net Savings Trend</Text>
            <View style={styles.savingsChart}>
              {pnlMonths.map((m, i) => {
                const maxNet = Math.max(...pnlMonths.map((pm) => Math.abs(pm.net)), 1);
                const h = Math.max((Math.abs(m.net) / maxNet) * 80, 4);
                const isPos = m.net >= 0;
                return (
                  <View key={m.month} style={styles.savingsBarWrap}>
                    <View
                      style={[styles.savingsBar, {
                        height: h,
                        backgroundColor: isPos ? color.forest : color.clay,
                      }]}
                    />
                    <Text style={styles.barLabel}>{monthLabel(m.month)}</Text>
                    <Text style={[styles.savingsVal, { color: isPos ? color.forest : color.clay }]}>
                      {isPos ? '+' : ''}{Math.round(m.net / 1000)}k
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </AnimatedEntry>

        {/* ── Expense Breakdown ────────────────────────────────────── */}
        {catEntries.length > 0 && (
          <AnimatedEntry delay={220}>
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>Expense Breakdown</Text>
              {catEntries.map(([cat, amount], i) => {
                const pct = totalCatAmount > 0 ? Math.round((amount / totalCatAmount) * 100) : 0;
                const catInfo = CATEGORY_ICONS[cat];
                return (
                  <View key={cat} style={styles.breakdownRow}>
                    <View style={[styles.catDot, { backgroundColor: catInfo?.color || color.inkFaint }]} />
                    <Text style={styles.catName} numberOfLines={1}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                    <View style={styles.catBarWrap}>
                      <View style={[styles.catBar, {
                        width: `${pct}%`,
                        backgroundColor: catInfo?.color || color.inkFaint,
                      }]} />
                    </View>
                    <Text style={styles.catPct}>{pct}%</Text>
                    <Text style={styles.catAmount}>{formatAmount(amount)}</Text>
                  </View>
                );
              })}
            </View>
          </AnimatedEntry>
        )}

        {/* ── Income Breakdown ─────────────────────────────────────── */}
        {incEntries.length > 0 && (
          <AnimatedEntry delay={260}>
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>Income Sources</Text>
              {incEntries.map(([src, amount]) => {
                const pct = totalIncAmount > 0 ? Math.round((amount / totalIncAmount) * 100) : 0;
                const catInfo = CATEGORY_ICONS[src];
                return (
                  <View key={src} style={styles.breakdownRow}>
                    <View style={[styles.catDot, { backgroundColor: catInfo?.color || color.forest }]} />
                    <Text style={styles.catName} numberOfLines={1}>
                      {src.charAt(0).toUpperCase() + src.slice(1)}
                    </Text>
                    <View style={styles.catBarWrap}>
                      <View style={[styles.catBar, {
                        width: `${pct}%`,
                        backgroundColor: catInfo?.color || color.forest,
                      }]} />
                    </View>
                    <Text style={styles.catPct}>{pct}%</Text>
                    <Text style={styles.catAmount}>{formatAmount(amount)}</Text>
                  </View>
                );
              })}
            </View>
          </AnimatedEntry>
        )}

        {/* ── Monthly Detail Table ─────────────────────────────────── */}
        <AnimatedEntry delay={300}>
          <View style={styles.tableCard}>
            <Text style={styles.sectionTitle}>Monthly Detail</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.2 }]}>Month</Text>
              <Text style={[styles.tableCell, styles.tableHeadText]}>Income</Text>
              <Text style={[styles.tableCell, styles.tableHeadText]}>Expense</Text>
              <Text style={[styles.tableCell, styles.tableHeadText]}>Net</Text>
            </View>
            {pnlMonths.map((m, i) => (
              <View key={m.month} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 1.2, fontFamily: font.bodySemi }]}>{monthLabel(m.month)}</Text>
                <Text style={[styles.tableCell, { color: color.forest }]}>{formatAmount(m.income)}</Text>
                <Text style={[styles.tableCell, { color: color.clay }]}>{formatAmount(m.expenses)}</Text>
                <Text style={[styles.tableCell, { color: m.net >= 0 ? color.forest : color.clay, fontFamily: font.bodyBold }]}>
                  {m.net >= 0 ? '+' : ''}{formatAmount(m.net)}
                </Text>
              </View>
            ))}
          </View>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Icon name="arrow-left" size={22} color={color.ink} />
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>P&L Reports</Text>
        <Text style={styles.headerSub}>Income vs expense analysis</Text>
      </View>
    </View>
  );
}

function SummaryCard({
  label, amount, cardColor, isSuffix,
}: {
  label: string; amount: number; cardColor: string; isSuffix?: string;
}) {
  const { formatAmount } = usePrivacy();
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryAmount, { color: cardColor }]}>
        {isSuffix ? `${Math.round(amount)}${isSuffix}` : formatAmount(amount)}
      </Text>
    </View>
  );
}

function TrendBadge({
  label, change, invertColor,
}: {
  label: string; change: number; invertColor?: boolean;
}) {
  const isUp = change > 0;
  // For expenses, up is bad. For income, up is good.
  const isGood = invertColor ? !isUp : isUp;
  const badgeColor = isGood ? color.forest : color.clay;

  return (
    <View style={[styles.trendBadge, { borderColor: badgeColor + '40' }]}>
      <Icon name={isUp ? 'trending-up' : 'trending-down'} size={14} color={badgeColor} />
      <Text style={[styles.trendText, { color: badgeColor }]}>
        {label} {isUp ? '+' : ''}{Math.round(change)}%
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: color.inkSoft, fontFamily: font.body },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 16, gap: 12, borderBottomWidth: 1,
    borderColor: color.line, backgroundColor: color.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: font.bodyBold, color: color.ink },
  headerSub: { fontSize: 12, color: color.inkSoft, marginTop: 2, fontFamily: font.body },

  scrollContent: { padding: 20, paddingBottom: 60 },

  // Period selector
  periodRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16, justifyContent: 'center',
  },
  periodBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: color.card, borderWidth: 1, borderColor: color.line,
  },
  periodBtnActive: { backgroundColor: color.forest, borderColor: color.forest },
  periodText: { fontSize: 14, fontFamily: font.bodyBold, color: color.inkFaint },
  periodTextActive: { color: color.cream },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: {
    flex: 1, backgroundColor: color.card, borderRadius: 14,
    borderWidth: 1, borderColor: color.line, padding: 14,
  },
  summaryLabel: { fontSize: 12, color: color.inkSoft, marginBottom: 4, fontFamily: font.body },
  summaryAmount: { fontSize: 18, fontFamily: font.displayBold },

  // Trends
  trendsCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontFamily: font.bodyBold, color: color.ink, marginBottom: 12 },
  trendRow: { flexDirection: 'row', gap: 12 },
  trendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  trendText: { fontSize: 13, fontFamily: font.bodySemi },

  // Chart
  chartCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  chart: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'flex-end', height: 150, marginBottom: 12,
  },
  barGroup: { alignItems: 'center', gap: 6 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 10, borderRadius: 4, minHeight: 2 },
  barIncome: { backgroundColor: color.forest },
  barExpense: { backgroundColor: color.clay },
  barLabel: { fontSize: 10, color: color.inkFaint, fontFamily: font.body },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: color.inkSoft, fontFamily: font.body },

  // Savings chart
  savingsChart: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'flex-end', height: 130,
  },
  savingsBarWrap: { alignItems: 'center', gap: 4, flex: 1 },
  savingsBar: { width: 16, borderRadius: 4, minHeight: 4 },
  savingsVal: { fontSize: 10, fontFamily: font.bodySemi },

  // Breakdown
  breakdownCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { width: 70, fontSize: 13, color: color.ink, fontFamily: font.body },
  catBarWrap: {
    flex: 1, height: 8, backgroundColor: color.line, borderRadius: 4, overflow: 'hidden',
  },
  catBar: { height: 8, borderRadius: 4 },
  catPct: { width: 32, fontSize: 12, color: color.inkFaint, textAlign: 'right', fontFamily: font.body },
  catAmount: { width: 70, fontSize: 12, fontFamily: font.bodySemi, color: color.ink, textAlign: 'right' },

  // Table
  tableCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row', paddingBottom: 8,
    borderBottomWidth: 1, borderColor: color.line, marginBottom: 4,
  },
  tableHeadText: { fontSize: 12, fontFamily: font.bodyBold, color: color.inkFaint, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 8 },
  tableRowAlt: { backgroundColor: color.cream2 },
  tableCell: { flex: 1, fontSize: 13, color: color.ink, fontFamily: font.body },
});
