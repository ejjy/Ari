/**
 * Indian Income Tax Calculator — FY 2025-26 (AY 2026-27)
 *
 * Supports both Old and New tax regimes with all major deductions.
 * Pure utility — no API calls, instant calculations.
 */

import type { TaxProfile, TaxEstimate, TaxComparison } from '../types';

// ─── Slab Definitions ─────────────────────────────────────────────────────────

// New Regime FY 2025-26 (Budget 2025 slabs)
const NEW_REGIME_SLABS = [
  { from: 0,       to: 400000,   rate: 0    },
  { from: 400000,  to: 800000,   rate: 0.05 },
  { from: 800000,  to: 1200000,  rate: 0.10 },
  { from: 1200000, to: 1600000,  rate: 0.15 },
  { from: 1600000, to: 2000000,  rate: 0.20 },
  { from: 2000000, to: 2400000,  rate: 0.25 },
  { from: 2400000, to: Infinity, rate: 0.30 },
];

// Old Regime (unchanged)
const OLD_REGIME_SLABS = [
  { from: 0,       to: 250000,   rate: 0    },
  { from: 250000,  to: 500000,   rate: 0.05 },
  { from: 500000,  to: 1000000,  rate: 0.20 },
  { from: 1000000, to: Infinity, rate: 0.30 },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const CESS_RATE = 0.04; // 4% Health & Education Cess
const STANDARD_DEDUCTION_NEW = 75000; // New regime FY 2025-26
const STANDARD_DEDUCTION_OLD = 50000; // Old regime
const MAX_80C = 150000;
const MAX_80D_SELF = 25000;
const MAX_80D_SENIOR = 50000;
const MAX_HOME_LOAN_OLD = 200000;
const REBATE_LIMIT_NEW = 1200000; // Section 87A — New regime
const REBATE_LIMIT_OLD = 500000; // Section 87A — Old regime
const REBATE_MAX_NEW = 60000;
const REBATE_MAX_OLD = 12500;

// ─── Tax Calculation Helpers ──────────────────────────────────────────────────

function calcSlabTax(taxableIncome: number, slabs: typeof NEW_REGIME_SLABS): number {
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome <= slab.from) break;
    const taxableInSlab = Math.min(taxableIncome, slab.to) - slab.from;
    tax += taxableInSlab * slab.rate;
  }
  return Math.round(tax);
}

// ─── HRA Exemption (Old Regime Only) ──────────────────────────────────────────

export function calculateHRAExemption(
  basicSalary: number,
  hraReceived: number,
  rentPaid: number,
  isMetro: boolean
): number {
  if (!hraReceived || !rentPaid || !basicSalary) return 0;

  const metroPercent = isMetro ? 0.50 : 0.40;
  const exemptOptions = [
    hraReceived,
    rentPaid - 0.10 * basicSalary,
    metroPercent * basicSalary,
  ];
  return Math.max(0, Math.round(Math.min(...exemptOptions)));
}

// ─── Old Regime Calculation ───────────────────────────────────────────────────

export function calculateTaxOldRegime(profile: TaxProfile): TaxEstimate {
  const grossIncome =
    (profile.annualSalary || 0) +
    (profile.freelanceIncome || 0) +
    (profile.otherIncome || 0);

  // Deductions
  const standardDeduction = Math.min(STANDARD_DEDUCTION_OLD, profile.annualSalary || 0);
  const section80c = Math.min(profile.section80c || 0, MAX_80C);
  const section80d = Math.min(profile.section80d || 0, MAX_80D_SELF);
  const homeLoan = Math.min(profile.homeLoanInterest || 0, MAX_HOME_LOAN_OLD);
  const hraExemption = calculateHRAExemption(
    profile.annualSalary || 0,
    profile.hraReceived || 0,
    profile.rentPaid || 0,
    profile.metroCity
  );
  const otherDed = profile.otherDeductions || 0;

  const totalDeductions =
    standardDeduction + section80c + section80d + homeLoan + hraExemption + otherDed;

  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  let taxAmount = calcSlabTax(taxableIncome, OLD_REGIME_SLABS);

  // Section 87A Rebate
  if (taxableIncome <= REBATE_LIMIT_OLD) {
    taxAmount = Math.max(0, taxAmount - REBATE_MAX_OLD);
  }

  // Surcharge
  const surcharge = calculateSurcharge(taxAmount, taxableIncome);
  taxAmount += surcharge;

  const cess = Math.round(taxAmount * CESS_RATE);
  const totalTax = taxAmount + cess;

  return {
    grossIncome,
    totalDeductions,
    taxableIncome,
    taxAmount,
    cess,
    totalTax,
    monthlyTax: Math.round(totalTax / 12),
    effectiveTaxRate: grossIncome > 0 ? Math.round((totalTax / grossIncome) * 10000) / 100 : 0,
    hraExemption,
  };
}

// ─── New Regime Calculation ───────────────────────────────────────────────────

export function calculateTaxNewRegime(profile: TaxProfile): TaxEstimate {
  const grossIncome =
    (profile.annualSalary || 0) +
    (profile.freelanceIncome || 0) +
    (profile.otherIncome || 0);

  // New regime: only standard deduction, no 80C/80D/HRA
  const standardDeduction = Math.min(STANDARD_DEDUCTION_NEW, profile.annualSalary || 0);
  const totalDeductions = standardDeduction;

  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  let taxAmount = calcSlabTax(taxableIncome, NEW_REGIME_SLABS);

  // Section 87A Rebate (New regime FY 2025-26)
  if (taxableIncome <= REBATE_LIMIT_NEW) {
    taxAmount = Math.max(0, taxAmount - REBATE_MAX_NEW);
  }

  // Surcharge
  const surcharge = calculateSurcharge(taxAmount, taxableIncome);
  taxAmount += surcharge;

  const cess = Math.round(taxAmount * CESS_RATE);
  const totalTax = taxAmount + cess;

  return {
    grossIncome,
    totalDeductions,
    taxableIncome,
    taxAmount,
    cess,
    totalTax,
    monthlyTax: Math.round(totalTax / 12),
    effectiveTaxRate: grossIncome > 0 ? Math.round((totalTax / grossIncome) * 10000) / 100 : 0,
    hraExemption: 0,
  };
}

// ─── Surcharge ────────────────────────────────────────────────────────────────

function calculateSurcharge(tax: number, taxableIncome: number): number {
  if (taxableIncome <= 5000000) return 0;
  if (taxableIncome <= 10000000) return Math.round(tax * 0.10);
  if (taxableIncome <= 20000000) return Math.round(tax * 0.15);
  if (taxableIncome <= 50000000) return Math.round(tax * 0.25);
  return Math.round(tax * 0.37);
}

// ─── Regime Comparison ────────────────────────────────────────────────────────

export function compareTaxRegimes(profile: TaxProfile): TaxComparison {
  const oldCalc = calculateTaxOldRegime(profile);
  const newCalc = calculateTaxNewRegime(profile);

  const savings = Math.abs(oldCalc.totalTax - newCalc.totalTax);
  const recommendedRegime = oldCalc.totalTax <= newCalc.totalTax ? 'old' : 'new';

  return {
    old: oldCalc,
    new: newCalc,
    recommendedRegime,
    savings,
  };
}

// ─── GST Estimate (Freelancers) ───────────────────────────────────────────────

export function calculateGST(
  freelanceIncome: number,
  isRegistered: boolean
): { gstLiability: number; threshold: boolean; rate: number } {
  const GST_THRESHOLD = 2000000; // ₹20L
  const GST_RATE = 0.18;

  if (!isRegistered && freelanceIncome <= GST_THRESHOLD) {
    return { gstLiability: 0, threshold: false, rate: 0 };
  }

  const gstLiability = Math.round(freelanceIncome * GST_RATE);
  return { gstLiability, threshold: freelanceIncome > GST_THRESHOLD, rate: GST_RATE };
}

// ─── Quick Summary ────────────────────────────────────────────────────────────

export function getTaxSummaryText(comparison: TaxComparison): string {
  const { recommendedRegime, savings } = comparison;
  const label = recommendedRegime === 'old' ? 'Old' : 'New';
  if (savings === 0) {
    return 'Both regimes result in the same tax. The New Regime is simpler.';
  }
  return `The ${label} Regime saves you ₹${savings.toLocaleString('en-IN')} per year.`;
}
