import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getLatestBrief, type CoachingBrief, type BriefContent } from '../api/coaching';
import { Colors } from '../constants/colors';
import Icon from './ui/Icon';

/**
 * Weekly brief card on the Dashboard (spec §5.2 "Sunday 8PM: brief
 * generated, cached, push notification sent"). We render whatever the
 * backend cached — summary, top 2 insights, first 2 actions. Tapping
 * expands to reveal the rest. When there's no brief yet the card
 * self-hides.
 */

function isStructuredBrief(content: unknown): content is BriefContent {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;
  return typeof c.summary === 'string' && Array.isArray(c.insights) && Array.isArray(c.actions);
}

export default function CoachingBriefCard() {
  const [brief, setBrief] = useState<CoachingBrief | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { brief } = await getLatestBrief();
      setBrief(brief);
    } catch {
      /* silent — card hides if it can't load */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!brief || !isStructuredBrief(brief.content)) return null;
  if (brief.type !== 'weekly_brief' && brief.type !== 'monthly_review') return null;

  const { summary, insights, actions } = brief.content;
  const shownInsights = expanded ? insights : insights.slice(0, 2);
  const shownActions = expanded ? actions : actions.slice(0, 2);
  const hasMore = insights.length > 2 || actions.length > 2;

  return (
    <TouchableOpacity
      onPress={() => hasMore && setExpanded((v) => !v)}
      activeOpacity={hasMore ? 0.8 : 1}
      accessibilityLabel="Weekly coaching brief"
    >
      <LinearGradient
        colors={['#142828', '#0C1F1F', '#08181A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Icon name="sparkles" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.kicker}>
            {brief.type === 'monthly_review' ? 'Monthly review' : 'Weekly brief'}
          </Text>
          {!brief.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.summary}>{summary}</Text>

        {shownInsights.length > 0 && (
          <View style={styles.block}>
            {shownInsights.map((ins, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, insightColor(ins.type)]}>•</Text>
                <Text style={styles.bulletText}>{ins.text}</Text>
              </View>
            ))}
          </View>
        )}

        {shownActions.length > 0 && (
          <View style={[styles.block, styles.actionsBlock]}>
            <Text style={styles.actionsLabel}>Next steps</Text>
            {shownActions.map((a, i) => (
              <View key={i} style={styles.bulletRow}>
                <Icon name="check-circle" size={12} color={Colors.primary} />
                <Text style={[styles.bulletText, { marginLeft: 6 }]}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {hasMore && (
          <Text style={styles.expandHint}>
            {expanded ? 'Tap to collapse' : 'Tap to see more'}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function insightColor(type: BriefContent['insights'][number]['type']) {
  switch (type) {
    case 'anomaly':
    case 'leakage':
      return { color: Colors.danger };
    case 'saving':
      return { color: Colors.primary };
    case 'trend':
    default:
      return { color: Colors.accent };
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.2)',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.3)',
  },
  kicker: {
    fontSize: 11, letterSpacing: 1, color: Colors.primary,
    fontWeight: '700', textTransform: 'uppercase',
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginLeft: 4,
  },
  summary: {
    fontSize: 15, lineHeight: 21,
    color: Colors.textPrimary, fontWeight: '600',
    marginBottom: 10,
  },
  block: { marginTop: 8, gap: 6 },
  actionsBlock: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    marginTop: 12,
  },
  actionsLabel: {
    fontSize: 11, letterSpacing: 0.5,
    color: Colors.textSecondary, marginBottom: 2,
    textTransform: 'uppercase', fontWeight: '600',
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bulletDot: { fontSize: 14, marginRight: 6, fontWeight: '700' },
  bulletText: {
    flex: 1, fontSize: 13, lineHeight: 18,
    color: Colors.textSecondary,
  },
  expandHint: {
    marginTop: 10, fontSize: 11, color: Colors.textMuted,
    textAlign: 'center',
  },
});
