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
}) =>
  apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteTransaction = (id: string) =>
  apiRequest<{ message: string }>(`/transactions/${id}`, {
    method: 'DELETE',
  });
