import { apiRequest } from './client';
import type { Budget } from '../types';

export const getBudgets = (month?: string) =>
  apiRequest<Budget[]>(`/budgets${month ? `?month=${month}` : ''}`);

export const saveBudget = (data: {
  category: string;
  limit: number;
  month: string;
}) =>
  apiRequest<Budget>('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteBudget = (id: string) =>
  apiRequest<{ message: string }>(`/budgets/${id}`, { method: 'DELETE' });
