import {
  getCurrentMonth,
  formatDate,
  formatDateShort,
  formatSectionDate,
  groupTransactionsByDate,
  todayISO,
} from '../dateHelpers';
import type { Transaction } from '../../types';

describe('getCurrentMonth', () => {
  it('returns YYYY-MM format', () => {
    const result = getCurrentMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it('pads single-digit months', () => {
    const result = getCurrentMonth();
    const month = result.split('-')[1];
    expect(month.length).toBe(2);
  });
});

describe('formatDate', () => {
  it('formats a date string for Indian locale', () => {
    const result = formatDate('2026-01-15');
    expect(result).toContain('15');
    expect(result).toContain('Jan');
    expect(result).toContain('2026');
  });
});

describe('formatDateShort', () => {
  it('returns day and short month', () => {
    const result = formatDateShort('2026-03-25');
    expect(result).toContain('25');
    expect(result).toContain('Mar');
  });
});

describe('formatSectionDate', () => {
  it('returns "Today" for today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatSectionDate(today)).toBe('Today');
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    expect(formatSectionDate(dateStr)).toBe('Yesterday');
  });

  it('returns formatted date for older dates', () => {
    const result = formatSectionDate('2025-01-01');
    expect(result).not.toBe('Today');
    expect(result).not.toBe('Yesterday');
    expect(result).toContain('Jan');
  });
});

describe('groupTransactionsByDate', () => {
  const makeTxn = (id: string, date: string): Transaction => ({
    id,
    userId: 'u1',
    amount: 100,
    type: 'expense',
    category: 'food',
    description: 'Test',
    note: '',
    date,
    month: date.substring(0, 7),
    createdAt: date,
  });

  it('groups transactions by date', () => {
    const txns = [
      makeTxn('1', '2026-04-06'),
      makeTxn('2', '2026-04-06'),
      makeTxn('3', '2026-04-05'),
    ];
    const groups = groupTransactionsByDate(txns);
    expect(groups.length).toBe(2);
  });

  it('sorts groups newest first', () => {
    const txns = [
      makeTxn('1', '2026-04-01'),
      makeTxn('2', '2026-04-06'),
    ];
    const groups = groupTransactionsByDate(txns);
    expect(groups[0].data[0].date).toBe('2026-04-06');
  });

  it('returns empty array for no transactions', () => {
    expect(groupTransactionsByDate([])).toEqual([]);
  });
});

describe('todayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches current date', () => {
    const now = new Date();
    const expected = now.toISOString().split('T')[0];
    expect(todayISO()).toBe(expected);
  });
});
