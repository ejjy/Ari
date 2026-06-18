import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getLatestBrief, type CoachingBrief, type BriefContent } from '../api/coaching';
import { color, font, type } from '../theme/tokens';
import Icon from './ui/Icon';

/**
 * Weekly brief card on the Dashboard (spec §5.2). Renders whatever the backend
 * cached — summary, top 2 insights, first 2 actions; tap expands. Self-hides
 * when there's no brief. Forest-on-cream Tomo card per docs/ari-v2-forest.html
 * (flat `card` surface, forest Tomo glyph, gold kicker; no gradient).
 */

function isStructuredBrief(content: unknown): content is BriefContent {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;
  return typeof c.summary === 'string' && Array.isArray(c.insights) && Array.isArray(c.actions);
}

/** The forest square + gold/cream dots that mark anything spoken by Tomo. */
function TomoGlyph() {
  return (
    <View style={styles.face}>
      <View style={styles.faceDots}>
        <View style={styles.dotGold} />
        <View style={styles.dotCream} />
      </View>
    </View>
  );
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
      style={styles.card}
    >
      <View style={styles.headRow}>
        <TomoGlyph />
        <View style={styles.headText}>
          <Text style={styles.kicker}>
            {brief.type === 'monthly_review' ? 'Monthly review' : 'Weekly brief'}
          </Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
        {!brief.isRead && <View style={styles.unreadDot} />}
      </View>

      {shownInsights.length > 0 && (
        <View style={styles.block}>
          {shownInsights.map((ins, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: insightColor(ins.type) }]}>•</Text>
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
              <Icon name="check-circle" size={12} color={color.forest2} />
              <Text style={[styles.bulletText, { marginLeft: 6 }]}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      {hasMore && (
        <Text style={styles.expandHint}>{expanded ? 'Tap to collapse' : 'Tap to see more'}</Text>
      )}
    </TouchableOpacity>
  );
}

function insightColor(t: BriefContent['insights'][number]['type']): string {
  switch (t) {
    case 'anomaly':
    case 'leakage':
      return color.clay;
    case 'saving':
      return color.forest2;
    case 'trend':
    default:
      return color.gold;
  }
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    marginBottom: 16,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 22,
    padding: 18,
  },
  headRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  headText: { flex: 1 },
  face: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: color.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceDots: { flexDirection: 'row', gap: 4 },
  dotGold: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: color.gold },
  dotCream: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EFEAD9' },
  kicker: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: color.gold,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  summary: {
    fontFamily: font.bodySemi,
    fontSize: type.body,
    lineHeight: 21,
    color: color.ink,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.clay,
    marginTop: 4,
  },
  block: { marginTop: 12, gap: 6 },
  actionsBlock: {
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: 12,
  },
  actionsLabel: {
    fontFamily: font.bodySemi,
    fontSize: type.eyebrow,
    letterSpacing: 0.5,
    color: color.inkSoft,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bulletDot: { fontSize: 14, marginRight: 6, fontWeight: '700' },
  bulletText: {
    flex: 1,
    fontFamily: font.body,
    fontSize: type.body,
    lineHeight: 18,
    color: color.inkSoft,
  },
  expandHint: {
    marginTop: 10,
    fontFamily: font.bodySemi,
    fontSize: type.eyebrow,
    color: color.inkFaint,
    textAlign: 'center',
  },
});
