import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../context/AuthContext';
import { getPlans, createSubscription, type Plan, type PlanKey } from '../api/billing';
import Button from '../components/ui/Button';
import ErrorBanner from '../components/ui/ErrorBanner';
import Icon from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { track } from '../lib/analytics';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

/**
 * Paywall — three tiers, Razorpay Subscriptions checkout (spec Sprint 3).
 *
 * Flow:
 *   1. GET /api/billing/plans for the catalog.
 *   2. User taps a plan -> POST /api/billing/subscription -> we receive
 *      {subscriptionId, keyId}.
 *   3. Hand those to RazorpayCheckout.open with prefill info.
 *   4. On success, Razorpay fires a webhook server-side which flips
 *      ari_users.tier. Mobile re-fetches /me on screen dismiss.
 */

const PLAN_BULLETS: Record<PlanKey, string[]> = {
  pilot: [
    'Pilot pricing — locked for launch users',
    'Everything below',
    'Weekly coaching brief',
  ],
  pro: [
    'Unlimited Tomo AI chats',
    'Account Aggregator sync',
    'Monthly deep-dive report',
  ],
  family: [
    'Up to 4 members',
    'Shared expenses + UPI settlement',
    'Combined household insights',
  ],
};

export default function PaywallScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, { source?: string } | undefined>, string>>();
  const sourceScreen = route.params?.source ?? 'unknown';
  const { user, refreshFromSession } = useAuth();
  const haptics = useHaptics();

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<PlanKey>('pilot');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getPlans();
      setPlans(res.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Top of the monetization funnel — fires once on mount with the entry
  // point so we can A/B test paywall placement (settings vs. tomo-limit
  // vs. nudge-card) before the launch tightens the funnel.
  useEffect(() => {
    track('paywall_viewed', {
      source_screen: sourceScreen,
      current_tier: user?.tier ?? 'unknown',
    });
    // Intentionally fires once per mount — re-mounting is itself a signal
    // worth recording (user closed and reopened the paywall).
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubscribe = async () => {
    if (!user) return;
    setError('');
    setPaying(true);
    haptics.medium();

    const plan = plans?.find((p) => p.key === selected);
    const planPrice = plan?.price ?? null;

    // Funnel step 2: user committed to attempt purchase. Fires before the
    // network round-trip so dropped-network conversions still register.
    track('pro_purchase_initiated', {
      plan_key: selected,
      plan_price: planPrice,
      source_screen: sourceScreen,
      current_tier: user.tier ?? 'unknown',
    });

    try {
      const sub = await createSubscription(selected);
      const options = {
        key: sub.keyId,
        subscription_id: sub.subscriptionId,
        name: 'Ari',
        description: plan?.name ?? 'Subscription',
        image: 'https://web-production-7c65f.up.railway.app/static/icon.png',
        theme: { color: Colors.primary },
        prefill: {
          name: user.name,
          email: user.email ?? '',
          contact: user.phone ?? '',
        },
      };

      await RazorpayCheckout.open(options as never);
      // Success — Razorpay returns razorpay_payment_id, _subscription_id,
      // _signature. Server has already been webhook-notified; re-hydrate
      // our auth user so the tier shows updated.
      track('pro_purchase_completed', {
        plan_key: selected,
        plan_price: planPrice,
        source_screen: sourceScreen,
      });
      haptics.success();
      Alert.alert('Welcome to Ari ' + (plan?.name ?? 'Pro') + '!', 'Your upgrade is active.');
      // Best-effort refresh; tolerate transient 5xx
      try {
        const updated = { ...user, tier: (plan?.key ?? 'pilot') as typeof user.tier };
        await refreshFromSession(updated);
      } catch { /* noop */ }
      navigation.goBack();
    } catch (e: unknown) {
      haptics.error();
      // Razorpay cancel returns code==2 with a message; don't flag as error.
      const err = e as { code?: number; description?: string; message?: string };
      const isCancel = err?.code === 2 || /payment cancel/i.test(err?.description ?? '');
      if (isCancel) {
        track('pro_purchase_cancelled', {
          plan_key: selected,
          plan_price: planPrice,
          source_screen: sourceScreen,
        });
        setError('Payment cancelled');
      } else {
        track('pro_purchase_failed', {
          plan_key: selected,
          plan_price: planPrice,
          source_screen: sourceScreen,
          razorpay_code: err?.code ?? null,
          reason: (err?.description ?? err?.message ?? 'unknown').slice(0, 120),
        });
        setError(err?.description ?? err?.message ?? 'Payment failed');
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="x" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Upgrade Ari</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>
            Pick a plan. Cancel anytime from Settings.
          </Text>

          <ErrorBanner message={error} />

          {plans?.map((p) => {
            const isSelected = p.key === selected;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                activeOpacity={0.85}
                onPress={() => { haptics.light(); setSelected(p.key); }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${p.name}, ₹${p.price} per month`}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, isSelected && { color: Colors.primary }]}>
                    {p.name}
                  </Text>
                  <Text style={styles.planPrice}>
                    ₹{p.price}
                    <Text style={styles.planPriceSub}> /month</Text>
                  </Text>
                </View>
                {PLAN_BULLETS[p.key].map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Icon name="check-circle" size={14} color={Colors.primary} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </TouchableOpacity>
            );
          })}

          <Button onPress={handleSubscribe} loading={paying} fullWidth style={{ marginTop: 12 }}>
            {paying ? 'Opening Razorpay…' : `Subscribe to ${selected}`}
          </Button>

          <Text style={styles.fine}>
            Billed monthly via Razorpay. You'll be charged ₹
            {plans?.find((p) => p.key === selected)?.price ?? ''} today
            and every month until you cancel.
          </Text>
        </ScrollView>
      )}
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
  scroll: { padding: 20, paddingBottom: 48 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 18 },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 12,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0,200,150,0.06)',
  },
  planHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 10,
  },
  planName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  planPrice: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  planPriceSub: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  bulletText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  fine: {
    fontSize: 11, color: Colors.textMuted, textAlign: 'center',
    marginTop: 16, lineHeight: 16,
  },
});
