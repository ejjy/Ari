import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { ApiError } from '../api/client';
import * as txnApi from '../api/transactions';
import * as budgetApi from '../api/budgets';
import * as tomoApi from '../api/tomo';
import * as goalsApi from '../api/savingsGoals';
import * as catApi from '../api/categories';
import type { UserCategoryData } from '../api/categories';
import { getCurrentMonth } from '../utils/dateHelpers';
import { useAuth } from './AuthContext';
import { useOfflineCache } from '../hooks/useOfflineCache';
import type {
  Transaction,
  Summary,
  Budget,
  Nudge,
  Insight,
  ChatMessage,
  SavingsGoal,
} from '../types';

interface DataContextValue {
  transactions: Transaction[];
  summary: Summary | null;
  budgets: Budget[];
  nudge: Nudge | null;
  insights: Insight[];
  chatHistory: ChatMessage[];
  savingsGoals: SavingsGoal[];
  userCategories: UserCategoryData[];
  loadingData: boolean;
  refreshing: boolean;
  tomoLoading: boolean;
  fetchTransactions: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchAll: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchNudge: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchSavingsGoals: () => Promise<void>;
  fetchUserCategories: () => Promise<void>;
  addTransaction: (data: {
    type: string;
    amount: number;
    category: string;
    description: string;
    note: string;
    date: string;
    parseSource?: 'local' | 'fuzzy' | 'ai';
    confidence?: number;
    merchant?: string | null;
    rawInput?: string;
    entryType?: 'manual' | 'voice' | 'aa_sync';
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (data: { category: string; limit: number; month: string }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  createSavingsGoal: (data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: string;
    icon?: string;
    color?: string;
  }) => Promise<SavingsGoal>;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => Promise<SavingsGoal>;
  contributeToGoal: (id: string, amount: number) => Promise<SavingsGoal>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  askTomo: (message: string) => Promise<void>;
  clearChat: () => void;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const INITIAL_TOMO_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Namaste! 🙏 I'm Tomo, your personal finance coach. How can I help you build better money habits today?",
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { fetchWithCache } = useOfflineCache();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategoryData[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    INITIAL_TOMO_MESSAGE,
  ]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tomoLoading, setTomoLoading] = useState(false);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        logout();
      }
    },
    [logout]
  );

  const fetchTransactions = useCallback(async () => {
    try {
      const month = getCurrentMonth();
      const data = await fetchWithCache(`txns_${month}`, () =>
        txnApi.getTransactions(month)
      );
      setTransactions(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, fetchWithCache]);

  const fetchSummary = useCallback(async () => {
    try {
      const month = getCurrentMonth();
      const data = await fetchWithCache(`summary_${month}`, () =>
        txnApi.getSummary(month)
      );
      setSummary(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, fetchWithCache]);

  const fetchBudgets = useCallback(async () => {
    try {
      const month = getCurrentMonth();
      const data = await fetchWithCache(`budgets_${month}`, () =>
        budgetApi.getBudgets(month)
      );
      setBudgets(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, fetchWithCache]);

  const fetchNudge = useCallback(async () => {
    try {
      const data = await fetchWithCache('nudge', () => tomoApi.getNudge());
      setNudge(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, fetchWithCache]);

  const fetchInsights = useCallback(async () => {
    try {
      const data = await fetchWithCache('insights', () => tomoApi.getInsights());
      setInsights(data.insights ?? []);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, fetchWithCache]);

  const fetchUserCategories = useCallback(async () => {
    try {
      const data = await fetchWithCache('user_categories', () =>
        catApi.getCategories()
      );
      setUserCategories(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, fetchWithCache]);

  const fetchAll = useCallback(async () => {
    setLoadingData(true);
    await Promise.all([fetchTransactions(), fetchSummary(), fetchUserCategories()]);
    setLoadingData(false);
  }, [fetchTransactions, fetchSummary, fetchUserCategories]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTransactions(),
      fetchSummary(),
      fetchNudge(),
      fetchInsights(),
    ]);
    setRefreshing(false);
  }, [fetchTransactions, fetchSummary, fetchNudge, fetchInsights]);

  const addTransaction = useCallback(
    async (data: {
      type: string;
      amount: number;
      category: string;
      description: string;
      note: string;
      date: string;
      parseSource?: 'local' | 'fuzzy' | 'ai';
      confidence?: number;
      merchant?: string | null;
      rawInput?: string;
    }) => {
      const txn = await txnApi.addTransaction(data);
      setTransactions((prev) => [txn, ...prev]);
      await fetchSummary();
    },
    [fetchSummary]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      // Optimistic delete: remove from UI immediately
      setTransactions((prev) => {
        const txn = prev.find((t) => t.id === id);
        if (txn) {
          // Store for rollback
          (deleteTransaction as any).__rollback = { id, txn, prev };
        }
        return prev.filter((t) => t.id !== id);
      });

      try {
        await txnApi.deleteTransaction(id);
        await fetchSummary();
      } catch (err) {
        // Rollback on failure
        const rb = (deleteTransaction as any).__rollback;
        if (rb?.id === id) {
          setTransactions(rb.prev);
        }
        throw err;
      }
    },
    [fetchSummary]
  );

  const saveBudget = useCallback(
    async (data: { category: string; limit: number; month: string }) => {
      const budget = await budgetApi.saveBudget(data);
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.id === budget.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = budget;
          return next;
        }
        return [budget, ...prev];
      });
    },
    []
  );

  const deleteBudget = useCallback(async (id: string) => {
    await budgetApi.deleteBudget(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ── Savings Goals ────────────────────────────────────────────────────

  const fetchSavingsGoals = useCallback(async () => {
    try {
      const data = await fetchWithCache('savings_goals', () =>
        goalsApi.getSavingsGoals()
      );
      setSavingsGoals(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, fetchWithCache]);

  const createSavingsGoal = useCallback(
    async (data: {
      name: string;
      targetAmount: number;
      currentAmount?: number;
      targetDate?: string;
      icon?: string;
      color?: string;
    }) => {
      const goal = await goalsApi.createSavingsGoal(data);
      setSavingsGoals((prev) => [goal, ...prev]);
      return goal;
    },
    []
  );

  const updateSavingsGoal = useCallback(
    async (id: string, data: Partial<SavingsGoal>) => {
      const goal = await goalsApi.updateSavingsGoal(id, data);
      setSavingsGoals((prev) =>
        prev.map((g) => (g.id === id ? goal : g))
      );
      return goal;
    },
    []
  );

  const contributeToGoal = useCallback(
    async (id: string, amount: number) => {
      const goal = await goalsApi.contributeToGoal(id, amount);
      setSavingsGoals((prev) =>
        prev.map((g) => (g.id === id ? goal : g))
      );
      return goal;
    },
    []
  );

  const deleteSavingsGoal = useCallback(async (id: string) => {
    await goalsApi.deleteSavingsGoal(id);
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const askTomo = useCallback(
    async (message: string) => {
      const userMsg: ChatMessage = { role: 'user', content: message };
      const updatedHistory = [...chatHistory, userMsg];
      setChatHistory(updatedHistory);
      setTomoLoading(true);
      try {
        const { response } = await tomoApi.chatWithTomo(message, updatedHistory);
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: response },
        ]);
      } catch (err) {
        handleError(err);
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          },
        ]);
      } finally {
        setTomoLoading(false);
      }
    },
    [chatHistory, handleError]
  );

  const clearChat = useCallback(() => {
    setChatHistory([INITIAL_TOMO_MESSAGE]);
  }, []);

  return (
    <DataContext.Provider
      value={{
        transactions,
        summary,
        budgets,
        nudge,
        insights,
        chatHistory,
        savingsGoals,
        userCategories,
        loadingData,
        refreshing,
        tomoLoading,
        fetchTransactions,
        fetchSummary,
        fetchAll,
        fetchBudgets,
        fetchNudge,
        fetchInsights,
        fetchSavingsGoals,
        fetchUserCategories,
        addTransaction,
        deleteTransaction,
        saveBudget,
        deleteBudget,
        createSavingsGoal,
        updateSavingsGoal,
        contributeToGoal,
        deleteSavingsGoal,
        askTomo,
        clearChat,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
