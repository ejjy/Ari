export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date | string;
  type: 'income' | 'expense';
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  recurringId?: string;
  tags: string[];
  attachments?: string[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
  color: string;
  icon: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | string;
  deadline: Date;
  category: string | "savings" | "debt" | "investment" | "other";
  userId?: string;
  isCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM format
  totalBudget: number;
  totalSpent: number;
  categories: BudgetCategory[];
  userId?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyChange: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  streak: number;
  target: number;
  completed: boolean;
  lastCompleted: Date;
} 