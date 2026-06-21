import { apiRequest } from './client';
import type { Transaction, Summary } from '../types';

export const getTransactions = (month?: string) =>
  apiRequest<Transaction[]>(
    `/transactions${month ? `?month=${month}` : ''}`
  );

export const getSummary = (month?: string) =>
  apiRequest<Summary>(
    `/transactions/summary${month ? `?month=${month}` : ''}`
  );

export const addTransaction = (data: {
  // Client-generated UUID (offline-first, ID model A). When present the backend
  // upserts on it, so a retried create lands exactly once. Omit for the legacy
  // path and the server mints an id.
  id?: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  note: string;
  date: string;
  // Spec §4 parse provenance — optional; backend defaults to 'manual' / 'local'.
  parseSource?: 'local' | 'fuzzy' | 'ai';
  confidence?: number;
  merchant?: string | null;
  rawInput?: string;
  entryType?: 'manual' | 'voice' | 'aa_sync';
  // Sync engine sets this when flushing a backlog so old offline writes don't
  // fire stale budget pushes (G7).
  suppressAlerts?: boolean;
}) =>
  apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export interface UpdateConflict {
  conflict: true;
  current: Transaction;
}

export const updateTransaction = (
  id: string,
  patch: {
    type?: string;
    amount?: number;
    category?: string;
    description?: string;
    note?: string;
    date?: string;
    // Last-write-wins baseline: the updatedAt the client edited from. If the
    // server has moved past it, the PUT returns 409 (ApiError 409) and the
    // sync engine reconciles by taking the server's version.
    updatedAt?: string;
  }
) =>
  apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });

export const deleteTransaction = (id: string) =>
  apiRequest<{ message: string }>(`/transactions/${id}`, {
    method: 'DELETE',
  });
