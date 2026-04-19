import { apiRequest } from './client';
import { scrubPII } from '../utils/piiFilter';
import type { Category, TransactionType } from '../types';

export interface AiParseResult {
  amount: number;
  type: TransactionType;
  category: Category;
  merchant: string | null;
  description: string;
  date: string;         // YYYY-MM-DD
  confidence: number;   // 0–1
  parseSource: 'ai';
  rawInput: string;
}

/**
 * Spec §5.1 — AI fallback parser. Called only when the local MerchantDB +
 * fuzzy matcher (spec §3) fails. We scrub PII client-side before sending;
 * the backend does it again as defense in depth.
 *
 * Caller should handle:
 *   - network error (throws)
 *   - 400 / 503 from backend (throws)
 *   - confidence < 0.70 → show the confirmation modal before saving
 */
export const parseExpenseAI = (text: string) =>
  apiRequest<AiParseResult>('/parse/expense', {
    method: 'POST',
    body: JSON.stringify({ text: scrubPII(text) }),
  });
