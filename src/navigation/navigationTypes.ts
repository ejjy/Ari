import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  PhoneOtp: undefined;
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
  Paywall: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  AddSharedExpense: { groupId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
