export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'housing'
  | 'education'
  | 'savings'
  | 'other';

export type IncomeCategory =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'gift'
  | 'other';

export type Category = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
  note: string;
  date: string;
  month: string;
  createdAt: string;
  // Accountant: Smart Ledger fields
  isRecurring?: boolean;
  recurrenceRule?: 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'yearly';
  tags?: string[];
  incomeSource?: string;
  parentRecurringId?: string;
}

export interface Summary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  categories: Record<string, number>;
  transactionCount: number;
}

export interface Budget {
  id: string;
  userId: string;
  category: Category;
  limit: number;
  month: string;
  icon: string;
  color: string;
  spent: number;
  remaining: number;
  percentage: number;
  createdAt: string;
}

export interface Nudge {
  type: string;
  emoji: string;
  title: string;
  message: string;
}

export interface Insight {
  type: 'warning' | 'tip' | 'positive';
  text: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ageGroup: string;
  incomeBracket: string;
  mainGoal: string;
  role: string;
  currency?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  ageGroup: string;
  incomeBracket: string;
  mainGoal: string;
  role?: string;
}

// ---------------------------------------------------------------------------
// Accountant Feature Types
// ---------------------------------------------------------------------------

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  icon: string;
  color: string;
  isCompleted: boolean;
  percentage: number;
  remainingAmount: number;
  monthlyRequired: number;
  createdAt: string;
}

export interface TaxProfile {
  id?: string;
  financialYear: string;
  regime: 'old' | 'new';
  annualSalary: number;
  freelanceIncome: number;
  otherIncome: number;
  hraReceived: number;
  rentPaid: number;
  metroCity: boolean;
  section80c: number;
  section80d: number;
  homeLoanInterest: number;
  otherDeductions: number;
  gstRegistered: boolean;
}

export interface TaxEstimate {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxAmount: number;
  cess: number;
  totalTax: number;
  monthlyTax: number;
  effectiveTaxRate: number;
  hraExemption: number;
}

export interface TaxComparison {
  old: TaxEstimate;
  new: TaxEstimate;
  recommendedRegime: 'old' | 'new';
  savings: number;
}

export interface PnlMonth {
  month: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

export interface PnlReport {
  months: PnlMonth[];
  categories: Record<string, number>;
  incomeBreakdown: Record<string, number>;
  totals: {
    income: number;
    expenses: number;
    net: number;
    avgSavingsRate: number;
  };
  trends: {
    expenseChange: number;
    incomeChange: number;
  };
}
