import { formatCurrency, formatCurrencyFull } from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('formats small amounts', () => {
    expect(formatCurrency(100)).toBe('₹100');
  });

  it('formats thousands with Indian locale separator', () => {
    const result = formatCurrency(12345);
    // Indian numbering: 12,345
    expect(result).toContain('₹');
    expect(result).toContain('12');
    expect(result).toContain('345');
  });

  it('formats lakhs', () => {
    const result = formatCurrency(150000);
    expect(result).toContain('₹');
    expect(result).toContain('1');
    expect(result).toContain('50');
    expect(result).toContain('000');
  });

  it('treats negative amounts as absolute values', () => {
    expect(formatCurrency(-500)).toBe(formatCurrency(500));
  });

  it('strips decimals', () => {
    const result = formatCurrency(99.99);
    expect(result).not.toContain('.');
  });
});

describe('formatCurrencyFull', () => {
  it('shows positive amounts without sign', () => {
    expect(formatCurrencyFull(500)).toBe('₹500');
  });

  it('shows negative amounts with minus sign', () => {
    expect(formatCurrencyFull(-500)).toBe('-₹500');
  });

  it('handles zero', () => {
    expect(formatCurrencyFull(0)).toBe('₹0');
  });
});
