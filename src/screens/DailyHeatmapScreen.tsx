import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import { usePrivacy } from '../context/PrivacyContext';
import { getDailyHeatmap, type DailyHeatmap } from '../api/analytics';

/**
 * Daily spending heatmap — spec §6 "/api/analytics/daily ... daily spend
 * calendar data for heat map". A 7-column grid, one cell per day of the
 * month; intensity = amount relative to the highest-spend day. Dim cells
 * for zero-spend days, dotted outline for today.
 */

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function offsetMonth(m: string, delta: number): string {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyHeatmapScreen() {
  const navigation = useNavigation();
  const { formatAmount } = usePrivacy();

  const [month, setMonth] = useState(() => todayIso().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyHeatmap | null>(null);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    try {
      setData(await getDailyHeatmap(m));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  const sortedEntries = useMemo(() => {
    if (!data) return [] as [string, number][];
    return Object.entries(data.days).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  // Compute leading empty cells so the first day lines up to Monday-start columns.
  const leadingPad = useMemo(() => {
    if (sortedEntries.length === 0) return 0;
    const first = new Date(sortedEntries[0][0] + 'T00:00:00');
    // getDay: 0 Sun, 1 Mon ... shift so Mon=0, Sun=6
    return (first.getDay() + 6) % 7;
  }, [sortedEntries]);

  const heaviest = useMemo(() => {
    if (!data || sortedEntries.length === 0) return null;
    return sortedEntries.reduce((a, b) => (b[1] > a[1] ? b : a));
  }, [data, sortedEntries]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="chevron-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily heatmap</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => setMonth(offsetMonth(month, -1))} hitSlop={8}>
          <Icon name="chevron-left" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
        <TouchableOpacity
          onPress={() => setMonth(offsetMonth(month, 1))}
          hitSlop={8}
          disabled={month >= todayIso().slice(0, 7)}
        >
          <Icon
            name="chevron-right"
            size={18}
            color={month >= todayIso().slice(0, 7) ? Colors.textMuted : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : data ? (
          <>
            <View style={styles.summary}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Month total</Text>
                <Text style={styles.summaryAmount}>{formatAmount(data.total)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Heaviest day</Text>
                <Text style={styles.summaryAmount}>
                  {heaviest ? formatAmount(heaviest[1]) : '—'}
                </Text>
                {heaviest && (
                  <Text style={styles.summarySub}>
                    {new Date(heaviest[0] + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short',
                    })}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.dowRow}>
              {DOW.map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.dow}>{d}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {Array.from({ length: leadingPad }).map((_, i) => (
                <View key={`pad-${i}`} style={styles.cell} />
              ))}
              {sortedEntries.map(([date, amount]) => {
                const intensity = data.max > 0 ? amount / data.max : 0;
                const isToday = date === todayIso();
                const day = parseInt(date.slice(-2), 10);
                return (
                  <View
                    key={date}
                    style={[
                      styles.cell,
                      styles.cellFilled,
                      { backgroundColor: intensityColor(intensity) },
                      isToday && styles.cellToday,
                    ]}
                  >
                    <Text style={[styles.cellDay, intensity > 0.5 && { color: '#FFF' }]}>
                      {day}
                    </Text>
                    {amount > 0 && (
                      <Text style={[styles.cellAmount, intensity > 0.5 && { color: '#FFF' }]}>
                        {amount >= 1000 ? `${Math.round(amount / 1000)}k` : amount}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.error}>Couldn't load heatmap.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function intensityColor(i: number): string {
  // Green ramp matching brand — light bg for zero days, primary at peak.
  if (i === 0) return 'rgba(0,200,150,0.05)';
  if (i < 0.2) return 'rgba(0,200,150,0.2)';
  if (i < 0.5) return 'rgba(0,200,150,0.4)';
  if (i < 0.8) return 'rgba(0,200,150,0.65)';
  return Colors.primary;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 24,
  },
  monthLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  summary: {
    flexDirection: 'row', gap: 12, marginBottom: 20,
  },
  summaryCell: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  summarySub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dow: {
    flex: 1, textAlign: 'center', fontSize: 11, color: Colors.textMuted,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderRadius: 8,
    margin: 2,
    width: '12.5%',
  },
  cellToday: { borderWidth: 2, borderColor: Colors.accent },
  cellDay: { fontSize: 10, fontWeight: '600', color: Colors.textPrimary },
  cellAmount: { fontSize: 9, color: Colors.textSecondary, marginTop: 2 },
  error: { textAlign: 'center', marginTop: 40, color: Colors.textMuted },
});
