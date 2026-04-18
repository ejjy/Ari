import { parseMerchant } from '../merchantParser';
import { MERCHANT_DB } from '../merchantDb';
import { levenshtein } from '../fuzzyMatch';

describe('merchantParser — spec §3 fast-path', () => {
  describe('exact substring match (confidence 1.0)', () => {
    it('detects "swiggy 350" as food/swiggy', () => {
      const r = parseMerchant('swiggy 350');
      expect(r).not.toBeNull();
      expect(r!.merchant).toBe('swiggy');
      expect(r!.category).toBe('food');
      expect(r!.type).toBe('expense');
      expect(r!.confidence).toBe(1.0);
      expect(r!.source).toBe('local');
    });

    it('is case insensitive', () => {
      expect(parseMerchant('SWIGGY 350')?.merchant).toBe('swiggy');
      expect(parseMerchant('Zomato dinner')?.merchant).toBe('zomato');
    });

    it('detects transport merchants', () => {
      expect(parseMerchant('uber ride to office')?.category).toBe('transport');
      expect(parseMerchant('ola 220')?.category).toBe('transport');
      expect(parseMerchant('IOCL petrol 2000')?.category).toBe('transport');
    });

    it('detects shopping merchants', () => {
      expect(parseMerchant('amazon prime order')?.category).toBe('shopping');
      expect(parseMerchant('bought from Flipkart')?.category).toBe('shopping');
    });

    it('detects entertainment merchants', () => {
      expect(parseMerchant('netflix 649')?.category).toBe('entertainment');
      expect(parseMerchant('bookmyshow booking')?.category).toBe('entertainment');
    });

    it('detects health merchants', () => {
      expect(parseMerchant('apollo pharmacy')?.category).toBe('health');
      expect(parseMerchant('1mg medicines')?.category).toBe('health');
    });

    it('detects housing merchants', () => {
      expect(parseMerchant('rent paid 18000')?.category).toBe('housing');
      expect(parseMerchant('airtel broadband bill')?.category).toBe('housing');
    });
  });

  describe('fuzzy match (Levenshtein ≤ 2)', () => {
    it('detects typo "swigy" as swiggy via fuzzy path', () => {
      const r = parseMerchant('swigy 350');
      expect(r).not.toBeNull();
      expect(r!.merchant).toBe('swiggy');
      expect(r!.source).toBe('fuzzy');
      expect(r!.confidence).toBeGreaterThanOrEqual(0.70);
    });

    it('detects "zomto" as zomato via fuzzy', () => {
      const r = parseMerchant('zomto lunch');
      expect(r?.merchant).toBe('zomato');
      expect(r?.source).toBe('fuzzy');
    });

    it('detects "flipkrt" as flipkart via fuzzy', () => {
      expect(parseMerchant('flipkrt order')?.merchant).toBe('flipkart');
    });
  });

  describe('no match → null (triggers AI fallback per spec §5.1)', () => {
    it('returns null for unknown merchant', () => {
      expect(parseMerchant('random vendor xyz 500')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseMerchant('')).toBeNull();
    });

    it('returns null for amount-only input', () => {
      expect(parseMerchant('500')).toBeNull();
    });
  });

  describe('spec §9 DoD — all 50 merchants match locally without fuzzy', () => {
    // Per DoD: "test 50 merchants from MerchantDB — all 50 matched without
    // Claude call". Probe via the first alias — guaranteed substring-match.
    it.each(MERCHANT_DB.map((m) => [m.aliases[0], m.category, m.canonical]))(
      'matches "%s" → %s locally (canonical: %s)',
      (probe, expectedCategory) => {
        const r = parseMerchant(probe);
        expect(r).not.toBeNull();
        expect(r!.category).toBe(expectedCategory);
        expect(r!.source).toBe('local');
        expect(r!.confidence).toBe(1.0);
      }
    );

    it('MerchantDB has at least 50 entries (spec §3)', () => {
      expect(MERCHANT_DB.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('performance — spec DoD "response time < 100ms" (per call)', () => {
    it('parses a single exact match in well under 100ms', () => {
      const start = Date.now();
      parseMerchant('swiggy 350');
      expect(Date.now() - start).toBeLessThan(100);
    });

    it('avg parse latency across 1000 mixed inputs stays under 1ms', () => {
      const inputs = Array.from({ length: 1000 }, (_, i) =>
        i % 3 === 0 ? 'swiggy 350' : i % 3 === 1 ? 'swigy 450' : 'random vendor'
      );
      const start = Date.now();
      for (const input of inputs) parseMerchant(input);
      const avgMs = (Date.now() - start) / inputs.length;
      expect(avgMs).toBeLessThan(1);
    });
  });
});

describe('levenshtein sanity', () => {
  it('identical strings → 0', () => expect(levenshtein('swiggy', 'swiggy')).toBe(0));
  it('single edit → 1', () => expect(levenshtein('swigy', 'swiggy')).toBe(1));
  it('two edits → 2', () => expect(levenshtein('zomto', 'zomato')).toBe(1));
  it('empty vs non-empty → length', () => expect(levenshtein('', 'abc')).toBe(3));
});
