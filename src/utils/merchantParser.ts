import type { Category, TransactionType } from '../types';
import { MERCHANT_DB, type MerchantEntry } from './merchantDb';
import { tokenFuzzyMatch } from './fuzzyMatch';

export interface ParseResult {
  merchant: string;           // canonical merchant key
  category: Category;
  type: TransactionType;
  confidence: number;         // 0.0 – 1.0
  source: 'local' | 'fuzzy';  // spec §4 expenses.parse_source
  matchedAlias: string;
}

/**
 * Spec §3 fast-path: exact-substring check first (the 80% case — free), then
 * Levenshtein ≤ 2 per token (handles typos: "swigy" → swiggy). Returns null
 * when no merchant is confidently matched, which is the trigger to escalate
 * to the Gemini fallback parser.
 */
export function parseMerchant(input: string): ParseResult | null {
  if (!input) return null;
  const lower = input.toLowerCase();

  // Pass 1 — exact substring on any alias (confidence 1.0)
  for (const entry of MERCHANT_DB) {
    for (const alias of entry.aliases) {
      if (lower.includes(alias)) {
        return {
          merchant: entry.canonical,
          category: entry.category,
          type: entry.type,
          confidence: 1.0,
          source: 'local',
          matchedAlias: alias,
        };
      }
    }
  }

  // Pass 2 — fuzzy per-token (distance ≤ 2, confidence 0.85/0.72)
  let bestEntry: MerchantEntry | null = null;
  let bestAlias = '';
  let bestDistance = Infinity;
  for (const entry of MERCHANT_DB) {
    for (const alias of entry.aliases) {
      // only single-word aliases make sense for token fuzzy match
      if (alias.includes(' ')) continue;
      const { matched, distance } = tokenFuzzyMatch(lower, alias, 2);
      if (matched && distance < bestDistance) {
        bestEntry = entry;
        bestAlias = alias;
        bestDistance = distance;
      }
    }
  }

  if (!bestEntry) return null;

  const confidence = bestDistance === 1 ? 0.85 : 0.72;
  return {
    merchant: bestEntry.canonical,
    category: bestEntry.category,
    type: bestEntry.type,
    confidence,
    source: 'fuzzy',
    matchedAlias: bestAlias,
  };
}
