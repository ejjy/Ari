import type { Category, TransactionType } from '../types';
import { MERCHANT_DB, type MerchantEntry } from './merchantDb';
import { levenshtein } from './fuzzyMatch';

export interface ParseResult {
  merchant: string;           // canonical merchant key
  category: Category;
  type: TransactionType;
  confidence: number;         // 0.0 – 1.0
  source: 'local' | 'fuzzy';  // spec §4 expenses.parse_source
  matchedAlias: string;
}

const ALIASES = MERCHANT_DB.flatMap((entry) =>
  entry.aliases.map((alias) => ({
    entry,
    alias,
    fuzzy: !alias.includes(' '),
    tolerance: Math.min(2, Math.max(1, Math.floor(alias.length / 3))),
  }))
);

const TOKEN_SPLIT_RE = /[\s,.;:!?()/\-]+/;
const PARSE_CACHE_MAX = 256;
const parseCache = new Map<string, ParseResult | null>();

function remember(input: string, result: ParseResult | null): ParseResult | null {
  if (parseCache.size >= PARSE_CACHE_MAX) {
    const oldest = parseCache.keys().next().value;
    if (oldest) parseCache.delete(oldest);
  }
  parseCache.set(input, result);
  return result;
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
  if (parseCache.has(lower)) return parseCache.get(lower) ?? null;

  // Pass 1 — exact substring on any alias (confidence 1.0)
  for (const item of ALIASES) {
    if (lower.includes(item.alias)) {
      return remember(lower, {
        merchant: item.entry.canonical,
        category: item.entry.category,
        type: item.entry.type,
        confidence: 1.0,
        source: 'local',
        matchedAlias: item.alias,
      });
    }
  }

  // Pass 2 — fuzzy per-token (distance ≤ 2, confidence 0.85/0.72)
  let bestEntry: MerchantEntry | null = null;
  let bestAlias = '';
  let bestDistance = Infinity;
  const tokens = lower.split(TOKEN_SPLIT_RE).filter((token) => token.length >= 4);
  for (const token of tokens) {
    for (const item of ALIASES) {
      if (!item.fuzzy) continue;
      const distance = levenshtein(token, item.alias);
      if (distance <= item.tolerance && distance < bestDistance) {
        bestEntry = item.entry;
        bestAlias = item.alias;
        bestDistance = distance;
        if (distance === 0) break;
      }
    }
    if (bestDistance === 0) break;
  }

  if (!bestEntry) return remember(lower, null);

  const confidence = bestDistance === 1 ? 0.85 : 0.72;
  return remember(lower, {
    merchant: bestEntry.canonical,
    category: bestEntry.category,
    type: bestEntry.type,
    confidence,
    source: 'fuzzy',
    matchedAlias: bestAlias,
  });
}
