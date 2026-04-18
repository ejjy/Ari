/**
 * Spec §7: client-side PII scrubber. MUST run before any raw user input is
 * forwarded to an AI provider (Gemini today, Claude tomorrow). Stripping
 * happens on the outbound payload only — the original input is preserved
 * locally for the user's own records.
 *
 * Conservative by design: false positives (over-redacting) are acceptable;
 * false negatives (leaking a card number) are not.
 */

const REDACT = '[REDACTED]';

// 13–19 digits with optional spaces/dashes — covers Visa/MC/RuPay/Amex.
// The \D anchors (or string boundary) prevent amounts like "500" from matching.
const CARD_RE = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g;

// 9–18 digit runs — Indian bank account numbers. Minimum 9 keeps amounts safe
// (₹99,999,999 is only 8 digits). Only triggers when NOT already matched as card.
const BANK_RE = /(?<!\d)\d{9,18}(?!\d)/g;

// OTP: 4–8 digit code preceded by otp/pin/code keywords. `[^\d\n]` absorbs
// connector words like "is"/"was"/" - " between keyword and the digits.
const OTP_RE = /\b(otp|o\.t\.p|one[ -]?time[ -]?(?:password|code)|pin|code|verification)\b[^\d\n]{0,15}(\d{4,8})/gi;

// Password/passphrase leakage. Allows "password is X", "pwd: X", "password=X".
const PASSWORD_RE = /\b(password|passwd|pwd|passcode)\b[\s:=]{1,5}(?:is\s+|was\s+|equals?\s+)?(\S+)/gi;

// UPI IDs shouldn't be leaked to AI either — format is user@handle.
const UPI_RE = /\b[\w.\-]+@(?:ok[a-z]+|paytm|ybl|axl|icici|hdfcbank|sbi|upi|apl|ibl|indus|federal|kotak)\b/gi;

// Aadhaar: 12 digits often spaced as 4-4-4. Broader than card, so run AFTER cards.
const AADHAAR_RE = /(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)/g;

// CVV — 3–4 digit code preceded by cvv/cvc keyword.
const CVV_RE = /\b(cvv|cvc)\b[^\w\d]{0,6}(\d{3,4})/gi;

/**
 * Returns the input with PII tokens replaced by [REDACTED]. Idempotent.
 * The ORDER matters: run card first (16-digit swallows Aadhaar's 12-digit),
 * then context-anchored matches, then bank/Aadhaar as fallbacks.
 */
export function scrubPII(input: string): string {
  if (!input) return input;
  let out = input;

  out = out.replace(CARD_RE, REDACT);
  out = out.replace(CVV_RE, (_m, kw) => `${kw}: ${REDACT}`);
  out = out.replace(OTP_RE, (_m, kw) => `${kw} ${REDACT}`);
  out = out.replace(PASSWORD_RE, (_m, kw) => `${kw}: ${REDACT}`);
  out = out.replace(UPI_RE, REDACT);
  out = out.replace(AADHAAR_RE, REDACT);
  out = out.replace(BANK_RE, REDACT);

  return out;
}

/** True when the input contains PII the scrubber would redact. Useful for audit flags. */
export function containsPII(input: string): boolean {
  if (!input) return false;
  // Fresh regexes — /g + .test() is stateful and the module-level patterns
  // are also used with .replace(), so reusing them here would race.
  return (
    /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/.test(input) ||
    /(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)/.test(input) ||
    /(?<!\d)\d{9,18}(?!\d)/.test(input) ||
    /\b[\w.\-]+@(?:ok[a-z]+|paytm|ybl|axl|icici|hdfcbank|sbi|upi|apl|ibl|indus|federal|kotak)\b/i.test(input) ||
    /\b(?:cvv|cvc)\b[^\w\d]{0,6}\d{3,4}/i.test(input) ||
    /\b(?:otp|o\.t\.p|one[ -]?time[ -]?(?:password|code)|pin|code|verification)\b[^\w\d]{0,15}\d{4,8}/i.test(input) ||
    /\b(?:password|passwd|pwd|passcode)\b[^\w\d]{0,6}[^\s,;.]+/i.test(input)
  );
}
