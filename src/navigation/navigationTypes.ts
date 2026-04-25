import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budget: undefined;
  Tomo: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  AddTransaction: { type?: 'expense' | 'income' } | undefined;
  // Accountant feature
  Accountant: undefined;
  SmartLedger: undefined;
  BudgetPlanner: undefined;
  SavingsGoals: undefined;
  TaxEstimator: undefined;
  PnlReport: undefined;
  TodoNotes: undefined;
  DailyHeatmap: undefined;
  // `source` is the upstream surface that triggered the paywall — drives
  // funnel attribution in PostHog (paywall_viewed, pro_purchase_*).
  // Add new sources here as you wire more paywall entry points.
  Paywall: { source: 'settings' | 'tomo_limit' | 'nudge' | 'aa_gate' | 'unknown' } | undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  AddSharedExpense: { groupId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
