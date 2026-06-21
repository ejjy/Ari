import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/ui/Icon';
import AnimatedEntry from '../../components/ui/AnimatedEntry';
import { color, font } from '../../theme/tokens';
import { usePrivacy } from '../../context/PrivacyContext';
import { useHaptics } from '../../hooks/useHaptics';
import * as taxApi from '../../api/taxProfile';
import type { TaxProfile, TaxComparison } from '../../types';
import {
  compareTaxRegimes,
  calculateGST,
  getTaxSummaryText,
} from '../../utils/taxCalculator';

// ── Helpers ──────────────────────────────────────────────────────────

const numVal = (s: string): number => {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

const fmtInput = (n: number): string => (n > 0 ? n.toString() : '');

// ── Types ────────────────────────────────────────────────────────────

type Section = 'income' | 'deductions' | 'housing' | 'result';

export default function TaxEstimatorScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const { formatAmount } = usePrivacy();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<Section>('income');

  // Form fields
  const [regime, setRegime] = useState<'old' | 'new'>('new');
  const [annualSalary, setAnnualSalary] = useState('');
  const [freelanceIncome, setFreelanceIncome] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [hraReceived, setHraReceived] = useState('');
  const [rentPaid, setRentPaid] = useState('');
  const [metroCity, setMetroCity] = useState(true);
  const [section80c, setSection80c] = useState('');
  const [section80d, setSection80d] = useState('');
  const [homeLoanInterest, setHomeLoanInterest] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');
  const [gstRegistered, setGstRegistered] = useState(false);

  // Computed
  const [comparison, setComparison] = useState<TaxComparison | null>(null);

  // ── Load saved profile ─────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const profile = await taxApi.getTaxProfile();
          if (profile && active) {
            setRegime(profile.regime || 'new');
            setAnnualSalary(fmtInput(profile.annualSalary));
            setFreelanceIncome(fmtInput(profile.freelanceIncome));
            setOtherIncome(fmtInput(profile.otherIncome));
            setHraReceived(fmtInput(profile.hraReceived));
            setRentPaid(fmtInput(profile.rentPaid));
            setMetroCity(profile.metroCity);
            setSection80c(fmtInput(profile.section80c));
            setSection80d(fmtInput(profile.section80d));
            setHomeLoanInterest(fmtInput(profile.homeLoanInterest));
            setOtherDeductions(fmtInput(profile.otherDeductions));
            setGstRegistered(profile.gstRegistered);
          }
        } catch {
          // fresh profile — use defaults
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  // ── Auto-recalculate on any field change ───────────────────────────

  useEffect(() => {
    const profile: TaxProfile = {
      financialYear: '2025-26',
      regime,
      annualSalary: numVal(annualSalary),
      freelanceIncome: numVal(freelanceIncome),
      otherIncome: numVal(otherIncome),
      hraReceived: numVal(hraReceived),
      rentPaid: numVal(rentPaid),
      metroCity,
      section80c: numVal(section80c),
      section80d: numVal(section80d),
      homeLoanInterest: numVal(homeLoanInterest),
      otherDeductions: numVal(otherDeductions),
      gstRegistered,
    };

    const grossIncome = profile.annualSalary + profile.freelanceIncome + profile.otherIncome;
    if (grossIncome > 0) {
      setComparison(compareTaxRegimes(profile));
    } else {
      setComparison(null);
    }
  }, [
    regime, annualSalary, freelanceIncome, otherIncome,
    hraReceived, rentPaid, metroCity, section80c, section80d,
    homeLoanInterest, otherDeductions, gstRegistered,
  ]);

  // ── Save profile ───────────────────────────────────────────────────

  const handleSave = async () => {
    haptics.medium();
    setSaving(true);
    try {
      await taxApi.saveTaxProfile({
        financialYear: '2025-26',
        regime,
        annualSalary: numVal(annualSalary),
        freelanceIncome: numVal(freelanceIncome),
        otherIncome: numVal(otherIncome),
        hraReceived: numVal(hraReceived),
        rentPaid: numVal(rentPaid),
        metroCity,
        section80c: numVal(section80c),
        section80d: numVal(section80d),
        homeLoanInterest: numVal(homeLoanInterest),
        otherDeductions: numVal(otherDeductions),
        gstRegistered,
      });
      haptics.success();
      Alert.alert('Saved!', 'Your tax profile has been saved. Tomo AI will use this for personalized tax advice.');
    } catch {
      Alert.alert('Error', 'Could not save your tax profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Section Toggle ─────────────────────────────────────────────────

  const toggleSection = (s: Section) => {
    haptics.light();
    setExpandedSection((prev) => (prev === s ? (null as any) : s));
  };

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={color.forest} />
          <Text style={styles.loadingText}>Loading tax profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const gst = numVal(freelanceIncome) > 0
    ? calculateGST(numVal(freelanceIncome), gstRegistered)
    : null;

  const recommended = comparison?.recommendedRegime;
  const result = comparison ? comparison[regime] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={color.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tax Estimator</Text>
          <Text style={styles.headerSub}>FY 2025-26 · Old vs New Regime</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveHeaderBtn}
        >
          {saving ? (
            <ActivityIndicator size="small" color={color.forest} />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Regime Toggle ─────────────────────────────────────── */}
          <AnimatedEntry delay={0}>
            <View style={styles.regimeCard}>
              <Text style={styles.regimeLabel}>Tax Regime</Text>
              <View style={styles.regimeTabs}>
                {(['new', 'old'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.regimeTab, regime === r && styles.regimeTabActive]}
                    onPress={() => { haptics.light(); setRegime(r); }}
                  >
                    <Text style={[styles.regimeTabText, regime === r && styles.regimeTabTextActive]}>
                      {r === 'new' ? '🆕 New' : '📋 Old'}
                    </Text>
                    {recommended === r && (
                      <View style={styles.recommendBadge}>
                        <Text style={styles.recommendText}>Best</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {comparison && (
                <Text style={styles.regimeHint}>{getTaxSummaryText(comparison)}</Text>
              )}
            </View>
          </AnimatedEntry>

          {/* ── Result Summary (always visible) ───────────────────── */}
          {result && (
            <AnimatedEntry delay={60}>
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <View style={styles.resultCol}>
                    <Text style={styles.resultLabel}>Total Tax</Text>
                    <Text style={styles.resultAmount}>
                      {formatAmount(result.totalTax)}
                    </Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultCol}>
                    <Text style={styles.resultLabel}>Monthly TDS</Text>
                    <Text style={styles.resultAmount}>
                      {formatAmount(result.monthlyTax)}
                    </Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultCol}>
                    <Text style={styles.resultLabel}>Effective</Text>
                    <Text style={styles.resultAmount}>{result.effectiveTaxRate}%</Text>
                  </View>
                </View>

                {/* Breakdown bar */}
                <View style={styles.breakdownBar}>
                  <View style={[styles.barSegment, { flex: result.totalDeductions, backgroundColor: color.forest }]} />
                  <View style={[styles.barSegment, { flex: result.totalTax, backgroundColor: color.clay }]} />
                  <View style={[styles.barSegment, { flex: Math.max(result.grossIncome - result.totalDeductions - result.totalTax, 0), backgroundColor: color.gold }]} />
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color.forest }]} />
                    <Text style={styles.legendText}>Deductions {formatAmount(result.totalDeductions)}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color.clay }]} />
                    <Text style={styles.legendText}>Tax {formatAmount(result.totalTax)}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color.gold }]} />
                    <Text style={styles.legendText}>Take Home</Text>
                  </View>
                </View>
              </View>
            </AnimatedEntry>
          )}

          {/* ── Old vs New Comparison ─────────────────────────────── */}
          {comparison && (
            <AnimatedEntry delay={100}>
              <View style={styles.comparisonCard}>
                <Text style={styles.sectionTitle}>Regime Comparison</Text>
                <View style={styles.compareRow}>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>Old Regime</Text>
                    <Text style={[styles.compareAmount, recommended === 'old' && styles.compareWinner]}>
                      {formatAmount(comparison.old.totalTax)}
                    </Text>
                    <Text style={styles.compareRate}>{comparison.old.effectiveTaxRate}% rate</Text>
                  </View>
                  <View style={styles.vsCircle}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>New Regime</Text>
                    <Text style={[styles.compareAmount, recommended === 'new' && styles.compareWinner]}>
                      {formatAmount(comparison.new.totalTax)}
                    </Text>
                    <Text style={styles.compareRate}>{comparison.new.effectiveTaxRate}% rate</Text>
                  </View>
                </View>
                {comparison.savings > 0 && (
                  <View style={styles.savingsBanner}>
                    <Icon name="trending-down" size={16} color={color.forest} />
                    <Text style={styles.savingsText}>
                      You save {formatAmount(comparison.savings)}/year with{' '}
                      {recommended === 'old' ? 'Old' : 'New'} Regime
                    </Text>
                  </View>
                )}
              </View>
            </AnimatedEntry>
          )}

          {/* ── Income Section ────────────────────────────────────── */}
          <AnimatedEntry delay={140}>
            <SectionAccordion
              title="Income Details"
              icon="💰"
              expanded={expandedSection === 'income'}
              onToggle={() => toggleSection('income')}
            >
              <FieldInput label="Annual Salary (CTC)" value={annualSalary} onChange={setAnnualSalary} placeholder="e.g. 1200000" />
              <FieldInput label="Freelance / Business Income" value={freelanceIncome} onChange={setFreelanceIncome} placeholder="e.g. 300000" />
              <FieldInput label="Other Income (FD, Rental, etc.)" value={otherIncome} onChange={setOtherIncome} placeholder="e.g. 50000" />
            </SectionAccordion>
          </AnimatedEntry>

          {/* ── Deductions Section (Old Regime) ───────────────────── */}
          <AnimatedEntry delay={180}>
            <SectionAccordion
              title="Deductions (Old Regime)"
              icon="📋"
              expanded={expandedSection === 'deductions'}
              onToggle={() => toggleSection('deductions')}
              hint={regime === 'new' ? 'Not applicable in New Regime, but entered for comparison' : undefined}
            >
              <FieldInput label="Section 80C (PPF, ELSS, LIC, EPF)" value={section80c} onChange={setSection80c} placeholder="Max ₹1,50,000" />
              <FieldInput label="Section 80D (Health Insurance)" value={section80d} onChange={setSection80d} placeholder="Max ₹25,000" />
              <FieldInput label="Home Loan Interest (Sec 24)" value={homeLoanInterest} onChange={setHomeLoanInterest} placeholder="Max ₹2,00,000" />
              <FieldInput label="Other Deductions (NPS 80CCD, etc.)" value={otherDeductions} onChange={setOtherDeductions} placeholder="e.g. 50000" />
            </SectionAccordion>
          </AnimatedEntry>

          {/* ── Housing Section ────────────────────────────────────── */}
          <AnimatedEntry delay={220}>
            <SectionAccordion
              title="HRA & Housing"
              icon="🏠"
              expanded={expandedSection === 'housing'}
              onToggle={() => toggleSection('housing')}
            >
              <FieldInput label="HRA Received (Annual)" value={hraReceived} onChange={setHraReceived} placeholder="e.g. 240000" />
              <FieldInput label="Rent Paid (Annual)" value={rentPaid} onChange={setRentPaid} placeholder="e.g. 360000" />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Metro City (Delhi, Mumbai, Kolkata, Chennai)</Text>
                <Switch
                  value={metroCity}
                  onValueChange={setMetroCity}
                  trackColor={{ false: color.line, true: color.forest2 }}
                  thumbColor={metroCity ? color.forest : color.inkFaint}
                />
              </View>
              {comparison && comparison.old.hraExemption > 0 && (
                <View style={styles.hraResult}>
                  <Icon name="check-circle" size={16} color={color.forest} />
                  <Text style={styles.hraResultText}>
                    HRA Exemption: {formatAmount(comparison.old.hraExemption)}
                  </Text>
                </View>
              )}
            </SectionAccordion>
          </AnimatedEntry>

          {/* ── GST for Freelancers ────────────────────────────────── */}
          {numVal(freelanceIncome) > 0 && (
            <AnimatedEntry delay={260}>
              <View style={styles.gstCard}>
                <Text style={styles.sectionTitle}>GST (Freelancers)</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>GST Registered?</Text>
                  <Switch
                    value={gstRegistered}
                    onValueChange={setGstRegistered}
                    trackColor={{ false: color.line, true: color.forest2 }}
                    thumbColor={gstRegistered ? color.forest : color.inkFaint}
                  />
                </View>
                {gst && (
                  <View style={styles.gstResult}>
                    <Text style={styles.gstResultLabel}>
                      {gst.gstLiability > 0 ? 'Estimated GST Liability' : 'Below GST Threshold'}
                    </Text>
                    <Text style={styles.gstResultAmount}>
                      {gst.gstLiability > 0 ? formatAmount(gst.gstLiability) : 'No GST required'}
                    </Text>
                    {gst.threshold && (
                      <Text style={styles.gstNote}>
                        Freelance income exceeds ₹20L — GST registration mandatory
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </AnimatedEntry>
          )}

          {/* ── Save Button ───────────────────────────────────────── */}
          <AnimatedEntry delay={300}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={color.cream} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Tax Profile</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              Estimates only. Consult a CA for exact tax calculations. Based on FY 2025-26 slabs.
            </Text>
          </AnimatedEntry>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Reusable Components ──────────────────────────────────────────────

function SectionAccordion({
  title, icon, expanded, onToggle, hint, children,
}: {
  title: string; icon: string; expanded: boolean;
  onToggle: () => void; hint?: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.accordionCard}>
      <TouchableOpacity style={styles.accordionHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.accordionIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.accordionTitle}>{title}</Text>
          {hint && <Text style={styles.accordionHint}>{hint}</Text>}
        </View>
        <Icon name={expanded ? 'chevron-left' : 'chevron-right'} size={18} color={color.inkFaint} />
      </TouchableOpacity>
      {expanded && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

function FieldInput({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (s: string) => void; placeholder?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Text style={styles.currencyPrefix}>₹</Text>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
          placeholder={placeholder}
          placeholderTextColor={color.inkFaint}
          keyboardType="number-pad"
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: color.inkSoft, fontFamily: font.body },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, gap: 12, borderBottomWidth: 1,
    borderColor: color.line, backgroundColor: color.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: font.bodyBold, color: color.ink },
  headerSub: { fontSize: 12, color: color.inkSoft, marginTop: 2, fontFamily: font.body },
  saveHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveHeaderText: { fontSize: 15, fontFamily: font.bodyBold, color: color.forest },

  scrollContent: { padding: 20, paddingBottom: 60 },

  // Regime
  regimeCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  regimeLabel: { fontSize: 14, fontFamily: font.bodySemi, color: color.inkSoft, marginBottom: 10 },
  regimeTabs: { flexDirection: 'row', gap: 10 },
  regimeTab: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: color.cream2, borderWidth: 1.5, borderColor: 'transparent',
  },
  regimeTabActive: { borderColor: color.forest, backgroundColor: color.cream2 },
  regimeTabText: { fontSize: 15, fontFamily: font.bodySemi, color: color.inkFaint },
  regimeTabTextActive: { color: color.forest },
  recommendBadge: {
    backgroundColor: color.forest, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 6,
  },
  recommendText: { fontSize: 10, fontFamily: font.displayBold, color: color.cream },
  regimeHint: { fontSize: 13, color: color.inkSoft, marginTop: 12, textAlign: 'center', fontFamily: font.body },

  // Result Summary
  resultCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultCol: { flex: 1, alignItems: 'center' },
  resultLabel: { fontSize: 11, color: color.inkSoft, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: font.body },
  resultAmount: { fontSize: 18, fontFamily: font.displayBold, color: color.ink },
  resultDivider: { width: 1, height: 36, backgroundColor: color.line },

  breakdownBar: {
    flexDirection: 'row', height: 8, borderRadius: 4,
    overflow: 'hidden', marginTop: 16, marginBottom: 10,
  },
  barSegment: { minWidth: 2 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: color.inkFaint, fontFamily: font.body },

  // Comparison
  comparisonCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontFamily: font.bodyBold, color: color.ink, marginBottom: 14 },
  compareRow: { flexDirection: 'row', alignItems: 'center' },
  compareCol: { flex: 1, alignItems: 'center' },
  compareLabel: { fontSize: 13, color: color.inkSoft, marginBottom: 6, fontFamily: font.body },
  compareAmount: { fontSize: 20, fontFamily: font.displayBold, color: color.ink },
  compareWinner: { color: color.forest },
  compareRate: { fontSize: 12, color: color.inkFaint, marginTop: 4, fontFamily: font.body },
  vsCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: color.cream2,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
  },
  vsText: { fontSize: 11, fontFamily: font.displayBold, color: color.inkFaint },
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: color.cream2, borderRadius: 10,
    padding: 12, marginTop: 14,
  },
  savingsText: { fontSize: 13, fontFamily: font.bodySemi, color: color.forest, flex: 1 },

  // Accordion
  accordionCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, marginBottom: 12, overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  accordionIcon: { fontSize: 22 },
  accordionTitle: { fontSize: 15, fontFamily: font.bodySemi, color: color.ink },
  accordionHint: { fontSize: 11, color: color.gold, marginTop: 2, fontFamily: font.body },
  accordionBody: { paddingHorizontal: 16, paddingBottom: 16 },

  // Field
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: color.inkSoft, marginBottom: 6, fontFamily: font.body },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: color.cream2, borderRadius: 12,
    borderWidth: 1, borderColor: color.line,
  },
  currencyPrefix: {
    fontSize: 16, fontFamily: font.bodySemi, color: color.inkFaint,
    paddingLeft: 14, paddingRight: 4,
  },
  fieldInput: {
    flex: 1, paddingVertical: 12, paddingRight: 14,
    fontSize: 16, fontFamily: font.bodyMed, color: color.ink,
  },

  // Switches
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabel: { fontSize: 13, color: color.inkSoft, flex: 1, marginRight: 12, fontFamily: font.body },

  // HRA
  hraResult: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: color.cream2, borderRadius: 10, padding: 12,
  },
  hraResultText: { fontSize: 13, fontFamily: font.bodySemi, color: color.forest },

  // GST
  gstCard: {
    backgroundColor: color.card, borderRadius: 16, borderWidth: 1,
    borderColor: color.line, padding: 16, marginBottom: 16,
  },
  gstResult: { marginTop: 12 },
  gstResultLabel: { fontSize: 13, color: color.inkSoft, fontFamily: font.body },
  gstResultAmount: { fontSize: 18, fontFamily: font.bodyBold, color: color.ink, marginTop: 4 },
  gstNote: { fontSize: 12, color: color.gold, marginTop: 6, fontFamily: font.body },

  // Save
  saveBtn: {
    backgroundColor: color.forest, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: font.bodyBold, color: color.cream },
  disclaimer: {
    fontSize: 11, color: color.inkFaint, textAlign: 'center',
    marginTop: 12, lineHeight: 16, fontFamily: font.body,
  },
});
