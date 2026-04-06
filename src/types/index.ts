export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'housing'
  | 'education'
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
