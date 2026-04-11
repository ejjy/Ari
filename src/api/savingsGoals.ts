import { apiRequest } from './client';
import type { SavingsGoal } from '../types';

export const getSavingsGoals = () =>
  apiRequest<SavingsGoal[]>('/savings-goals');

export const createSavingsGoal = (data: {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  icon?: string;
  color?: string;
}) => apiRequest<SavingsGoal>('/savings-goals', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateSavingsGoal = (id: string, data: Partial<SavingsGoal>) =>
  apiRequest<SavingsGoal>(`/savings-goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const contributeToGoal = (id: string, amount: number) =>
  apiRequest<SavingsGoal>(`/savings-goals/${id}/contribute`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

export const deleteSavingsGoal = (id: string) =>
  apiRequest<{ message: string }>(`/savings-goals/${id}`, {
    method: 'DELETE',
  });
