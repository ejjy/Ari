import { useState } from 'react';
import { generateFinancialInsights, generateTransactionCategory, generateFinancialAdvice } from '../services/aiService';
import { Transaction, BudgetCategory, FinancialGoal } from '../types/finance';

interface UseAIProps {
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  goals: FinancialGoal[];
  monthlyIncome: number;
  monthlyExpenses: number;
}

export const useAI = ({
  transactions,
  budgetCategories,
  goals,
  monthlyIncome,
  monthlyExpenses,
}: UseAIProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);

  const context = {
    transactions,
    budgetCategories,
    goals,
    monthlyIncome,
    monthlyExpenses,
  };

  const getInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFinancialInsights(context);
      setInsights(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFinancialAdvice(context);
      setAdvice(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate advice');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const categorizeTransaction = async (description: string, amount: number) => {
    setLoading(true);
    setError(null);
    try {
      const category = await generateTransactionCategory(description, amount);
      return category;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to categorize transaction');
      return 'Other';
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    insights,
    advice,
    getInsights,
    getAdvice,
    categorizeTransaction,
  };
}; 