import { Colors } from './colors';

export interface CategoryDef {
  value: string;
  emoji: string;
  label: string;
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { value: 'food',          emoji: '🍜', label: 'Food',          color: Colors.orange },
  { value: 'transport',     emoji: '🚗', label: 'Transport',     color: Colors.accent },
  { value: 'shopping',      emoji: '🛍️', label: 'Shopping',      color: Colors.danger },
  { value: 'entertainment', emoji: '🎬', label: 'Fun',           color: Colors.purple },
  { value: 'health',        emoji: '💊', label: 'Health',        color: Colors.primary },
  { value: 'housing',       emoji: '🏠', label: 'Housing',       color: '#2D7D7D' },
  { value: 'education',     emoji: '📚', label: 'Education',     color: Colors.teal },
  { value: 'other',         emoji: '📦', label: 'Other',         color: Colors.textSecondary },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { value: 'salary',     emoji: '💰', label: 'Salary',    color: Colors.primary },
  { value: 'freelance',  emoji: '💻', label: 'Freelance', color: Colors.accent },
  { value: 'investment', emoji: '📈', label: 'Returns',   color: Colors.purple },
  { value: 'gift',       emoji: '🎁', label: 'Gift',      color: '#FF69B4' },
  { value: 'other',      emoji: '📦', label: 'Other',     color: Colors.textSecondary },
];

export const ALL_CATEGORIES: CategoryDef[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];

export const getCategoryDef = (value: string): CategoryDef =>
  ALL_CATEGORIES.find((c) => c.value === value) ?? {
    value: 'other',
    emoji: '📦',
    label: value,
    color: Colors.textSecondary,
  };
