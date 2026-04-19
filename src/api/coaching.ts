import { apiRequest } from './client';

export interface BriefInsight {
  type: 'anomaly' | 'trend' | 'saving' | 'leakage';
  text: string;
  amount?: number;
}

export interface BriefContent {
  summary: string;
  insights: BriefInsight[];
  actions: string[];
  disclaimer?: string;
}

export interface CoachingBrief {
  id: string;
  userId: string;
  type: 'weekly_brief' | 'monthly_review' | 'anomaly' | 'subscription_leak' | 'budget_alert';
  content: BriefContent | Record<string, unknown>;
  periodStart: string;
  periodEnd: string;
  modelUsed: string | null;
  tokensUsed: number | null;
  isRead: boolean;
  createdAt: string;
}

/** Latest cached brief of any type for the signed-in user. */
export const getLatestBrief = () =>
  apiRequest<{ brief: CoachingBrief | null }>('/coaching/latest');
