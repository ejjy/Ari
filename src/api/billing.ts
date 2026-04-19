import { apiRequest } from './client';

export type PlanKey = 'pilot' | 'pro' | 'family';
export type Tier = 'free' | PlanKey;

export interface Plan {
  key: PlanKey;
  tier: Tier;
  price: number;         // rupees
  name: string;
  currency: 'INR';
  period: 'monthly';
}

export interface SubscriptionStatus {
  tier: Tier;
  subscriptionStatus: string;     // 'none' | 'active' | 'cancelled' | ...
  subscriptionId: string | null;
  tierValidUntil: string | null;  // ISO timestamp
  configured: boolean;            // false while RAZORPAY_* env vars are unset server-side
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  keyId: string;                  // Razorpay public key id — safe to pass to checkout
  customerId: string;
  planKey: PlanKey;
  shortUrl: string | null;        // fallback hosted-checkout URL
}

export const getPlans = () =>
  apiRequest<{ plans: Plan[] }>('/billing/plans');

export const getBillingStatus = () =>
  apiRequest<SubscriptionStatus>('/billing/status');

export const createSubscription = (plan: PlanKey) =>
  apiRequest<CreateSubscriptionResponse>('/billing/subscription', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });

export const cancelSubscription = () =>
  apiRequest<{ ok: boolean }>('/billing/subscription/cancel', { method: 'POST' });
