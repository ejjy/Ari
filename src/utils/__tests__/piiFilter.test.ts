import { scrubPII, containsPII } from '../piiFilter';

describe('scrubPII — spec §7 + §9 DoD', () => {
  describe('spec §9 DoD: card number stripping', () => {
    // Exact test case from the spec: card number must be stripped, "500" and
    // "amazon" must survive.
    it('strips 16-digit card number but preserves amount and merchant', () => {
      const input = 'my card number is 4111111111111111 spent 500 at amazon';
      const out = scrubPII(input);
      expect(out).not.toContain('4111111111111111');
      expect(out).toContain('[REDACTED]');
      expect(out).toContain('500');
      expect(out).toContain('amazon');
    });

    it('strips spaced card numbers (Visa format)', () => {
      const out = scrubPII('card 4111 1111 1111 1111 swiggy 350');
      expect(out).not.toMatch(/4111 1111 1111 1111/);
      expect(out).toContain('swiggy');
      expect(out).toContain('350');
    });

    it('strips dashed card numbers', () => {
      const out = scrubPII('4111-1111-1111-1111 done');
      expect(out).not.toMatch(/4111-1111/);
    });

    it('strips 15-digit Amex', () => {
      const out = scrubPII('amex 378282246310005 done');
      expect(out).not.toContain('378282246310005');
    });
  });

  describe('bank account numbers', () => {
    it('strips 12-digit bank account', () => {
      const out = scrubPII('transferred to account 123456789012 at hdfc');
      expect(out).not.toContain('123456789012');
      expect(out).toContain('hdfc');
    });

    it('preserves small amounts (< 9 digits)', () => {
      expect(scrubPII('paid 500')).toContain('500');
      expect(scrubPII('spent 99999999')).toContain('99999999'); // 8 digits = ₹10cr
    });
  });

  describe('OTP / PIN / verification codes', () => {
    it('strips OTP value', () => {
      const out = scrubPII('my otp is 123456');
      expect(out).not.toContain('123456');
      expect(out.toLowerCase()).toContain('otp');
    });

    it('strips "verification code"', () => {
      const out = scrubPII('verification code 7890');
      expect(out).not.toContain('7890');
    });

    it('strips PIN', () => {
      expect(scrubPII('my pin is 4321')).not.toContain('4321');
    });
  });

  describe('passwords', () => {
    it('strips "password is <value>"', () => {
      const out = scrubPII('my password is hunter2 btw');
      expect(out).not.toContain('hunter2');
      expect(out.toLowerCase()).toContain('password');
    });

    it('strips "pwd: <value>"', () => {
      const out = scrubPII('pwd: correcthorsebatterystaple');
      expect(out).not.toContain('correcthorsebatterystaple');
    });
  });

  describe('UPI IDs', () => {
    it('strips UPI handle @paytm', () => {
      const out = scrubPII('sent 500 to user@paytm');
      expect(out).not.toContain('user@paytm');
      expect(out).toContain('500');
    });

    it('strips UPI handle @okhdfcbank', () => {
      expect(scrubPII('pay rahul@okhdfcbank')).not.toContain('rahul@okhdfcbank');
    });

    it('does NOT strip regular emails', () => {
      const out = scrubPII('email me at foo@gmail.com');
      expect(out).toContain('foo@gmail.com');
    });
  });

  describe('Aadhaar', () => {
    it('strips 12-digit Aadhaar (spaced)', () => {
      const out = scrubPII('aadhaar 1234 5678 9012 verified');
      expect(out).not.toMatch(/1234 5678 9012/);
    });
  });

  describe('CVV', () => {
    it('strips CVV value', () => {
      const out = scrubPII('cvv 789 expiry 09/28');
      expect(out).not.toContain('789');
    });
  });

  describe('non-PII inputs pass through unchanged', () => {
    it('preserves normal expense text', () => {
      const inputs = [
        'swiggy 350',
        'lunch at cafe coffee day for 180',
        'bought books worth 2000 on amazon',
        'rent 18000 for april',
      ];
      for (const input of inputs) {
        expect(scrubPII(input)).toBe(input);
      }
    });

    it('handles empty string', () => {
      expect(scrubPII('')).toBe('');
    });
  });

  describe('idempotency', () => {
    it('running twice yields same result', () => {
      const input = 'card 4111111111111111 spent 500';
      expect(scrubPII(scrubPII(input))).toBe(scrubPII(input));
    });
  });
});

describe('containsPII', () => {
  it('detects card numbers', () => {
    expect(containsPII('card 4111111111111111')).toBe(true);
  });

  it('detects UPI handles', () => {
    expect(containsPII('user@paytm')).toBe(true);
  });

  it('returns false for clean text', () => {
    expect(containsPII('swiggy 350')).toBe(false);
    expect(containsPII('')).toBe(false);
  });

  it('is not stateful across calls (regex /g bug guard)', () => {
    // This would fail if module-level /g regexes were reused via .test()
    const pii = 'card 4111111111111111';
    expect(containsPII(pii)).toBe(true);
    expect(containsPII(pii)).toBe(true);
    expect(containsPII(pii)).toBe(true);
  });
});
