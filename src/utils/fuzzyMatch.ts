// Classic Levenshtein. Short strings only (aliases), so O(m*n) is fine.
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// True if any token in `haystack` is within `maxDistance` edits of `needle`.
// Tokenising means "swigy 350" still matches alias "swiggy" (distance 1).
export function tokenFuzzyMatch(
  haystack: string,
  needle: string,
  maxDistance = 2
): { matched: boolean; distance: number } {
  const tokens = haystack.toLowerCase().split(/[\s,.;:!?()/\-]+/).filter(Boolean);
  let best = Infinity;
  for (const token of tokens) {
    // Skip very short tokens — "jio" vs "ajio" is distance 1, but fuzzy-matching
    // 3-char inputs produces too many false positives. Require ≥ 4 chars.
    if (token.length < 4) continue;
    // Scale tolerance to alias length — short aliases must match more closely.
    const capped = Math.min(maxDistance, Math.max(1, Math.floor(needle.length / 3)));
    const d = levenshtein(token, needle);
    if (d <= capped && d < best) best = d;
  }
  return { matched: best !== Infinity, distance: best === Infinity ? -1 : best };
}
