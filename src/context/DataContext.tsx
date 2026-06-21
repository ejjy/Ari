import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { ApiError } from '../api/client';
import * as txnApi from '../api/transactions';
import * as budgetApi from '../api/budgets';
import * as tomoApi from '../api/tomo';
import * as goalsApi from '../api/savingsGoals';
import * as catApi from '../api/categories';
import type { UserCategoryData } from '../api/categories';
import { getCurrentMonth } from '../utils/dateHelpers';
import { useOfflineCache } from '../hooks/useOfflineCache';
import { localStore } from '../lib/localStore';
import { flushPending as engineFlush, startAutoFlush } from '../lib/syncEngine';
import { track, bucketAmount } from '../lib/analytics';
import { addBreadcrumb } from '../config/sentry';
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
  updateTransaction: (
    id: string,
    patch: {
      type?: string;
      amount?: number;
      category?: string;
      description?: string;
      note?: string;
      date?: string;
    }
  ) => Promise<void>;
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
        addBreadcrumb(
          'auth',
          'data fetch received 401 after refresh attempt; preserving local session',
          'warning',
        );
      }
    },
    []
  );

  const refreshFromLocal = useCallback(async () => {
    setTransactions(await localStore.getAll());
  }, []);

  // Backlog flush is owned by the sync engine (Commit 4): single-flight, with
  // AppState/interval/backoff triggers, OTA-safe (no NetInfo — D8). Backlog
  // rows go up with suppressAlerts so reconnecting doesn't fire stale budget
  // pushes (G7). Refresh the list only when something actually synced.
  const syncTransactions = useCallback(async () => {
    const { changed } = await engineFlush();
    if (changed) await refreshFromLocal();
  }, [refreshFromLocal]);

  const fetchTransactions = useCallback(async () => {
    try {
      // First run on this device: seed the local store from the server's full
      // history (no month filter — G6). Merges, so offline-born rows survive.
      // Offline first-run just stays empty and seeds on a later online open.
      if (!(await localStore.isSeeded())) {
        try {
          const server = await txnApi.getTransactions();
          await localStore.seed(server);
        } catch (err) {
          handleError(err);
        }
      }
      await refreshFromLocal();
      void syncTransactions();
    } catch (err) {
      handleError(err);
    }
  }, [handleError, refreshFromLocal, syncTransactions]);

  // Start the recurring background flush once for the provider's lifetime.
  useEffect(
    () => startAutoFlush(() => void refreshFromLocal()),
    [refreshFromLocal]
  );

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
    try {
      // allSettled (not all) so one rejecting fetch can't short-circuit the
      // others; the finally guarantees the spinner clears even on an
      // unexpected throw. Each fetch already swallows its own error via
      // handleError, so a rejection here is genuinely unexpected — log it.
      const results = await Promise.allSettled([
        fetchTransactions(),
        fetchSummary(),
        fetchUserCategories(),
      ]);
      results.forEach((r) => {
        if (r.status === 'rejected') {
          addBreadcrumb('data', `fetchAll sub-fetch rejected: ${r.reason}`, 'warning');
        }
      });
    } finally {
      setLoadingData(false);
    }
  }, [fetchTransactions, fetchSummary, fetchUserCategories]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        fetchTransactions(),
        fetchSummary(),
        fetchNudge(),
        fetchInsights(),
      ]);
      results.forEach((r) => {
        if (r.status === 'rejected') {
          addBreadcrumb('data', `refresh sub-fetch rejected: ${r.reason}`, 'warning');
        }
      });
    } finally {
      setRefreshing(false);
    }
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
      entryType?: 'manual' | 'voice' | 'aa_sync';
    }) => {
      // Offline-first: write to the local store first so the UI updates
      // instantly and the entry survives an app kill, with no network in the
      // path of the user's Save tap.
      const record = await localStore.create({
        type: data.type as Transaction['type'],
        amount: data.amount,
        category: data.category,
        description: data.description,
        note: data.note,
        date: data.date,
        merchant: data.merchant ?? null,
        entryType: data.entryType === 'voice' ? 'voice' : 'manual',
        rawInput: data.rawInput ?? null,
        parseSource: data.parseSource ?? 'local',
        confidence: data.confidence ?? null,
      });
      setTransactions(await localStore.getAll());

      // Habit-loop event — fire BEFORE the network round-trip so a slow or
      // absent network never delays it. Properties chosen for D1/D7/D30 cohort
      // math: amount bucketed (DPDPA-minimal), source/entry tags split funnels
      // by parsing path, day_of_week reveals weekday-vs-weekend habits.
      track('transaction_logged', {
        type: data.type,
        category: data.category,
        amount_bucket: bucketAmount(data.amount),
        entry_type: data.entryType ?? 'manual',
        parse_source: data.parseSource ?? 'unknown',
        confidence: data.confidence ?? null,
        merchant_known: !!data.merchant,
        day_of_week: new Date(data.date + 'T00:00:00').getDay(),
        has_note: !!data.note?.trim(),
      });

      // Opportunistic flush of this one live create (alerts ON — it's a
      // foreground spend). Offline: it stays pending and the engine flushes it
      // later. The backend upserts on the client id, so a retry never dupes.
      try {
        const server = await txnApi.addTransaction({ ...data, id: record.id });
        await localStore.markSynced(record.id, {
          updatedAt: (server as { updatedAt?: string }).updatedAt,
          userId: server.userId,
        });
        setTransactions(await localStore.getAll());
        await fetchSummary();
      } catch (err) {
        // 401 → handleError deals with session expiry. 4xx (validation / auth)
        // → mark the row failed so the UI shows a failed tag and stops retrying.
        // Network / 5xx → row stays pending for engine retry; no UI noise yet.
        handleError(err);
        if (err instanceof ApiError && err.status !== 401 && err.status >= 400 && err.status < 500) {
          await localStore.markFailed(
            record.id,
            err.message ?? 'Validation error — tap to retry'
          );
          setTransactions(await localStore.getAll());
        }
        // Do NOT rethrow: the local write succeeded (offline-first contract).
        // The caller's success-toast is correct — the entry is durably saved.
      }
    },
    [fetchSummary, handleError]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      // Offline-first delete: drop it locally first (a pending create vanishes
      // outright; a synced row becomes a pending-delete tombstone the flush
      // will propagate). getAll() already hides it, so the UI updates at once.
      await localStore.softDelete(id);
      setTransactions(await localStore.getAll());

      // Opportunistic flush. DELETE is idempotent server-side (G3), so a row
      // we never synced or a retried delete both just return 200. Offline: the
      // tombstone stays pending and the engine retries; the UI never blocks.
      try {
        await txnApi.deleteTransaction(id);
        await localStore.removeRow(id);
        await fetchSummary();
      } catch (err) {
        handleError(err);
      }
    },
    [fetchSummary, handleError]
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      patch: {
        type?: string;
        amount?: number;
        category?: string;
        description?: string;
        note?: string;
        date?: string;
      }
    ) => {
      // Read the current updatedAt BEFORE patching — it's the LWW baseline we
      // send to the server. After localStore.update() the field is nowISO().
      const existing = transactions.find((t) => t.id === id);
      const lwwBaseline = existing?.updatedAt;

      // Optimistic local update — instant UI, survives app kill.
      const updated = await localStore.update(id, {
        type: patch.type as Transaction['type'] | undefined,
        amount: patch.amount,
        category: patch.category ?? null,
        description: patch.description,
        note: patch.note,
        date: patch.date,
      });
      if (!updated) return; // row disappeared — nothing to do
      setTransactions(await localStore.getAll());
      track('transaction_edited', {
        type: patch.type,
        amount_bucket: patch.amount != null ? bucketAmount(patch.amount) : undefined,
        category: patch.category,
      });

      // Inline flush: PUT with the pre-edit updatedAt as the LWW baseline.
      // 409 (stale baseline) is handled by the sync engine's conflict pass;
      // here we just mark the row failed so the tag surfaces.
      try {
        const server = await txnApi.updateTransaction(id, {
          ...patch,
          updatedAt: lwwBaseline,
        });
        await localStore.markSynced(id, {
          updatedAt: (server as Transaction & { updatedAt?: string }).updatedAt,
          userId: server.userId,
        });
        setTransactions(await localStore.getAll());
        await fetchSummary();
      } catch (err) {
        handleError(err);
        if (err instanceof ApiError && err.status !== 401) {
          await localStore.markFailed(
            id,
            err.message ?? 'Update failed'
          );
          setTransactions(await localStore.getAll());
        }
        // Do NOT rethrow — the local edit is durable; engine will reconcile.
      }
    },
    [fetchSummary, handleError, transactions]
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

      // Send-side event fires before the round-trip so we can attribute
      // network failures to the right user-action. history_depth is the
      // number of prior messages (Tomo only sends last 8 to Gemini).
      track('tomo_message_sent', {
        message_length: message.length,
        history_depth: chatHistory.length,
      });
      const startedAt = Date.now();

      try {
        const { response } = await tomoApi.chatWithTomo(message, updatedHistory);
        track('tomo_response_received', {
          latency_ms: Date.now() - startedAt,
          response_length: response.length,
          success: true,
        });
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: response },
        ]);
      } catch (err) {
        track('tomo_response_received', {
          latency_ms: Date.now() - startedAt,
          response_length: 0,
          success: false,
          error_status: err instanceof ApiError ? err.status : null,
        });
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
        updateTransaction,
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
