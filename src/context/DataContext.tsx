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
import { getCurrentMonth } from '../utils/dateHelpers';
import { useAuth } from './AuthContext';
import type {
  Transaction,
  Summary,
  Budget,
  Nudge,
  Insight,
  ChatMessage,
} from '../types';

interface DataContextValue {
  transactions: Transaction[];
  summary: Summary | null;
  budgets: Budget[];
  nudge: Nudge | null;
  insights: Insight[];
  chatHistory: ChatMessage[];
  loadingData: boolean;
  refreshing: boolean;
  tomoLoading: boolean;
  fetchTransactions: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchAll: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchNudge: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  addTransaction: (data: {
    type: string;
    amount: number;
    category: string;
    description: string;
    note: string;
    date: string;
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (data: { category: string; limit: number; month: string }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
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
      const data = await txnApi.getTransactions(month);
      setTransactions(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const fetchSummary = useCallback(async () => {
    try {
      const month = getCurrentMonth();
      const data = await txnApi.getSummary(month);
      setSummary(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const fetchBudgets = useCallback(async () => {
    try {
      const month = getCurrentMonth();
      const data = await budgetApi.getBudgets(month);
      setBudgets(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const fetchNudge = useCallback(async () => {
    try {
      const data = await tomoApi.getNudge();
      setNudge(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const fetchInsights = useCallback(async () => {
    try {
      const data = await tomoApi.getInsights();
      setInsights(data.insights ?? []);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const fetchAll = useCallback(async () => {
    setLoadingData(true);
    await Promise.all([fetchTransactions(), fetchSummary()]);
    setLoadingData(false);
  }, [fetchTransactions, fetchSummary]);

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
    }) => {
      const txn = await txnApi.addTransaction(data);
      setTransactions((prev) => [txn, ...prev]);
      await fetchSummary();
    },
    [fetchSummary]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await txnApi.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await fetchSummary();
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
        loadingData,
        refreshing,
        tomoLoading,
        fetchTransactions,
        fetchSummary,
        fetchAll,
        fetchBudgets,
        fetchNudge,
        fetchInsights,
        addTransaction,
        deleteTransaction,
        saveBudget,
        deleteBudget,
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
