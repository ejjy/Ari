import { apiRequest } from './client';
import type { PnlReport } from '../types';

export const getPnlReport = (months = 6) =>
  apiRequest<PnlReport>(`/reports/pnl?months=${months}`);

export const getCategoryTrend = (category: string, months = 6) =>
  apiRequest<{
    category: string;
    data: { month: string; amount: number }[];
    total: number;
    average: number;
  }>(`/reports/category-trends?category=${category}&months=${months}`);
