import type { UserCategoryData } from '../api/categories';

export interface CategoryDef {
  value: string;
  emoji: string;
  label: string;
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { value: 'food',          emoji: '🍜', label: 'Food',          color: '#B4612F' },
  { value: 'transport',     emoji: '🚗', label: 'Transport',     color: '#A8862C' },
  { value: 'shopping',      emoji: '🛍️', label: 'Shopping',      color: '#B4612F' },
  { value: 'entertainment', emoji: '🎬', label: 'Fun',           color: '#5C7A63' },
  { value: 'health',        emoji: '💊', label: 'Health',        color: '#1F3D2B' },
  { value: 'housing',       emoji: '🏠', label: 'Housing',       color: '#2E5239' },
  { value: 'education',     emoji: '📚', label: 'Education',     color: '#2E5239' },
  { value: 'savings',       emoji: '🎯', label: 'Savings',       color: '#1F3D2B' },
  { value: 'other',         emoji: '📦', label: 'Other',         color: '#6E6B5C' },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { value: 'salary',     emoji: '💰', label: 'Salary',    color: '#1F3D2B' },
  { value: 'freelance',  emoji: '💻', label: 'Freelance', color: '#A8862C' },
  { value: 'investment', emoji: '📈', label: 'Returns',   color: '#5C7A63' },
  { value: 'gift',       emoji: '🎁', label: 'Gift',      color: '#B4612F' },
  { value: 'other',      emoji: '📦', label: 'Other',     color: '#6E6B5C' },
];

export const ALL_CATEGORIES: CategoryDef[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];

export const getCategoryDef = (value: string, custom?: CategoryDef[]): CategoryDef => {
  const all = custom ? [...ALL_CATEGORIES, ...custom] : ALL_CATEGORIES;
  return all.find((c) => c.value === value) ?? {
    value,
    emoji: '📦',
    label: value.charAt(0).toUpperCase() + value.slice(1),
    color: '#6E6B5C',
  };
};

/**
 * Merge server-provided UserCategory records with default fallback lists.
 * Custom (non-default) categories are appended after defaults.
 * If server categories exist, they override emoji/color for matching defaults.
 */
export function buildCategoryList(
  type: 'expense' | 'income',
  serverCategories?: UserCategoryData[],
): CategoryDef[] {
  const defaults = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  if (!serverCategories || serverCategories.length === 0) {
    return defaults;
  }

  const filtered = serverCategories.filter((c) => c.type === type);
  if (filtered.length === 0) return defaults;

  const defaultNames = new Set(defaults.map((d) => d.value));
  const result: CategoryDef[] = [];

  // Merge defaults with server overrides (emoji/color)
  for (const def of defaults) {
    const override = filtered.find((s) => s.name === def.value);
    if (override) {
      result.push({
        value: def.value,
        emoji: override.emoji || def.emoji,
        label: def.label,
        color: override.color || def.color,
      });
    } else {
      result.push(def);
    }
  }

  // Append custom (non-default) categories
  for (const sc of filtered) {
    if (!defaultNames.has(sc.name)) {
      result.push({
        value: sc.name,
        emoji: sc.emoji || '📦',
        label: sc.name.charAt(0).toUpperCase() + sc.name.slice(1),
        color: sc.color || '#6E6B5C',
      });
    }
  }

  return result;
}
