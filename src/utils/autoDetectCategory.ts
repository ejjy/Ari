import type { Category, TransactionType } from '../types';

interface DetectionResult {
  category: Category;
  type: TransactionType;
}

export const autoDetectCategory = (
  description: string,
  currentType: TransactionType
): DetectionResult | null => {
  const d = description.toLowerCase();

  if (
    d.includes('zomato') || d.includes('swiggy') || d.includes('food') ||
    d.includes('lunch') || d.includes('dinner') || d.includes('breakfast') ||
    d.includes('coffee') || d.includes('chai') || d.includes('restaurant') ||
    d.includes('cafe') || d.includes('pizza') || d.includes('burger')
  ) return { category: 'food', type: 'expense' };

  if (
    d.includes('uber') || d.includes('ola') || d.includes('metro') ||
    d.includes('petrol') || d.includes('fuel') || d.includes('bus') ||
    d.includes('auto') || d.includes('rickshaw') || d.includes('rapido')
  ) return { category: 'transport', type: 'expense' };

  if (
    d.includes('amazon') || d.includes('flipkart') || d.includes('myntra') ||
    d.includes('clothes') || d.includes('shirt') || d.includes('shoes') ||
    d.includes('ajio') || d.includes('nykaa') || d.includes('meesho')
  ) return { category: 'shopping', type: 'expense' };

  if (
    d.includes('netflix') || d.includes('movie') || d.includes('game') ||
    d.includes('spotify') || d.includes('prime') || d.includes('hotstar') ||
    d.includes('concert') || d.includes('cricket')
  ) return { category: 'entertainment', type: 'expense' };

  if (
    d.includes('doctor') || d.includes('medicine') || d.includes('hospital') ||
    d.includes('pharmacy') || d.includes('clinic') || d.includes('health') ||
    d.includes('medical') || d.includes('apollo') || d.includes('1mg')
  ) return { category: 'health', type: 'expense' };

  if (
    d.includes('rent') || d.includes('electricity') || d.includes('water') ||
    d.includes('wifi') || d.includes('maintenance') || d.includes('gas') ||
    d.includes('housing') || d.includes('society')
  ) return { category: 'housing', type: 'expense' };

  if (
    d.includes('course') || d.includes('book') || d.includes('tuition') ||
    d.includes('school') || d.includes('college') || d.includes('udemy') ||
    d.includes('education') || d.includes('coaching')
  ) return { category: 'education', type: 'expense' };

  if (
    d.includes('salary') || d.includes('paycheck') || d.includes('ctc') ||
    d.includes('payroll') || d.includes('stipend')
  ) return { category: 'salary', type: 'income' };

  if (
    d.includes('freelance') || d.includes('client') || d.includes('project') ||
    d.includes('consulting') || d.includes('invoice')
  ) return { category: 'freelance', type: 'income' };

  if (
    d.includes('dividend') || d.includes('mutual fund') || d.includes('sip') ||
    d.includes('stock') || d.includes('investment') || d.includes('interest') ||
    d.includes('fd') || d.includes('ppf') || d.includes('returns')
  ) return { category: 'investment', type: 'income' };

  if (
    d.includes('gift') || d.includes('bonus') || d.includes('reward') ||
    d.includes('cashback') || d.includes('refund')
  ) return { category: 'gift', type: 'income' };

  return null;
};
