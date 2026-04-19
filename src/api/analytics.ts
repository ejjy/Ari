import { apiRequest } from './client';

export interface DailyHeatmap {
  month: string;                    // "YYYY-MM"
  days: Record<string, number>;     // "YYYY-MM-DD" -> rupees spent
  max: number;
  total: number;
}

/** Daily spend for the requested month (default: current). Spec §6 "daily spend calendar data for heat map". */
export const getDailyHeatmap = (month?: string) =>
  apiRequest<DailyHeatmap>(`/analytics/daily${month ? `?month=${month}` : ''}`);
