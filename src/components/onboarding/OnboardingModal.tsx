'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Building2, Loader2, Package, X } from 'lucide-react';
import type { IndustrySector, SmeRecord } from '@/types';
import { SectorSelector } from '@/components/onboarding/SectorSelector';
import { CountrySelect } from '@/components/onboarding/CountrySelect';
import { HsCodeSearch } from '@/components/onboarding/HsCodeSearch';
import { cn } from '@/lib/cn';
import { buttonSpring, smooth, snappy } from '@/lib/animation/presets';

export interface SmeOnboardingPayload {
  name: string;
  province: string;
  industry: IndustrySector;
  productDescription: string;
  hsCode: string;
  exportQuantity: number;
  productionCost: number;
  unitPrice: number;
  targetProfitMargin: number;
  contactEmail: string | null;
  primaryContact: string | null;
  website: string | null;
  hasLocalAgent: boolean;
  employeeRange: string | null;
  revenueRange: string | null;
  targetCountry: string;
  targetCountryName: string;
}

export interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (sme: SmeRecord) => void;
}

const STEPS = [
  { id: 'profile', label: 'Company Profile', icon: Building2 },
  { id: 'sector', label: 'Sector', icon: Building2 },
  { id: 'product', label: 'Product & Market', icon: Package },
  { id: 'hscode', label: 'HS Code', icon: Package },
] as const;

const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
];

const EMPLOYEE_RANGES = ['1-9', '10-49', '50-199', '200+'];
const REVENUE_RANGES = ['Under $1M', '$1M–$5M', '$5M–$20M', '$20M+'];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

function emptyForm(): SmeOnboardingPayload {
  return {
    name: '',
    province: '',
    industry: 'Other / Unsure',
    productDescription: '',
    hsCode: '',
    exportQuantity: 0,
    productionCost: 0,
    unitPrice: 0,
    targetProfitMargin: 15,
    contactEmail: null,
    primaryContact: null,
    website: null,
    hasLocalAgent: false,
    employeeRange: null,
    revenueRange: null,
    targetCountry: '',
    targetCountryName: '',
  };
}

export function OnboardingModal({ open, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<SmeOnboardingPayload>(emptyForm);
  const [hsConfirmed, setHsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setDirection(1);
      setForm(emptyForm());
      setHsConfirmed(false);
      setSubmitError(null);
    }
  }, [open]);

  const patch = useCallback((partial: Partial<SmeOnboardingPayload>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return form.name.trim().length > 1 && form.province.length > 0;
      case 1:
        return Boolean(form.industry);
      case 2:
        return (
          form.productDescription.trim().length > 5 &&
          form.targetCountry.length === 3 &&
          form.exportQuantity > 0 &&
          form.productionCost > 0 &&
          form.unitPrice > 0
        );
      case 3:
        return form.hsCode.length >= 4 && hsConfirmed;
      default:
        return false;
    }
  }, [step, form, hsConfirmed]);

  const goNext = () => {
    if (!canAdvance || step >= STEPS.length - 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step <= 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!canAdvance) return;
    setSubmitting(true);
    setSubmitError(null);

    const submissionForm = { ...form };
    if (submissionForm.website) {
      let urlStr = submissionForm.website.trim();
      if (urlStr && !/^https?:\/\//i.test(urlStr)) {
        urlStr = `https://${urlStr}`;
      }
      submissionForm.website = urlStr;
    }

    try {
      const res = await fetch('/api/sme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionForm),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; details?: { fieldErrors?: Record<string, string[]> } };
        let msg = body.error ?? 'Failed to create SME profile';
        if (body.details?.fieldErrors) {
          const detailsStr = Object.entries(body.details.fieldErrors)
            .map(([field, errs]) => `${field}: ${errs.join(', ')}`)
            .join('; ');
          msg += ` (${detailsStr})`;
        }
        throw new Error(msg);
      }
      const sme = (await res.json()) as SmeRecord;
      onComplete(sme);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-premium)] focus:outline-none';

  const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[var(--bg-primary)] overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={smooth}
        >
          {/* Left Panel — Visual steps and brand info */}
          <div className="hidden md:flex md:w-5/12 bg-[var(--obsidian)] text-white p-12 flex-col justify-between border-r border-[var(--border)] relative overflow-hidden" style={{ background: '#09090b' }}>
            {/* Ambient Background Glow */}
            <div style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '120%',
              height: '120%',
              background: 'radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 50%)',
              pointerEvents: 'none',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p className="mono-label" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                Trade Portal Sandbox
              </p>
              <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)' }}>
                SME Onboarding Hub
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6', maxWidth: '24rem', marginBottom: '3rem' }}>
                Provide details about your enterprise profile, pricing structures, and export goals to construct a custom market readiness brief.
              </p>

              {/* Steps guide */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {STEPS.map((s, i) => {
                  const isActive = i === step;
                  const isDone = i < step;
                  return (
                    <div key={s.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: 'var(--radius-interactive)',
                        border: '1px solid ' + (isActive ? 'var(--accent-premium)' : isDone ? 'var(--accent-success)' : 'var(--border)'),
                        background: isActive ? 'var(--accent-muted)' : isDone ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? 'var(--accent-premium)' : isDone ? 'var(--accent-success)' : 'var(--text-secondary)',
                        transition: 'all 0.3s var(--ease-spring)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                      }}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {s.label}
                        </p>
                        <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {i === 0 && 'Legal name and region'}
                          {i === 1 && 'SME industry domain classification'}
                          {i === 2 && 'Pricing margins and volume targets'}
                          {i === 3 && 'Commodity HS matching classification'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                &quot;Precise pricing inputs and HS commodity details allow the analysis engine to compute exact landed margins and trade flows.&quot;
              </p>
            </div>
          </div>

          {/* Right Panel — Form wizard */}
          <div className="flex flex-col flex-1 bg-[var(--bg-secondary)] h-full overflow-hidden">
            <header className="flex items-center justify-between border-b border-[var(--border-low-contrast)] px-8 py-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-mono">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 id="onboarding-title" className="text-xl font-semibold text-[var(--text-primary)]" style={{ margin: 0 }}>
                  {STEPS[step].label}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-[var(--radius-card)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            {/* Top Steps Progress Bar */}
            <div className="flex gap-1 px-8 pt-4">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    'h-1 flex-1 rounded-[var(--radius-pill)] transition-colors',
                    i <= step ? 'bg-[var(--accent-premium)]' : 'bg-[var(--border-low-contrast)]'
                  )}
                />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 md:px-16 md:py-12">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={snappy}
                >
                  {step === 0 && (
                    <div className="grid gap-4">
                      <div>
                        <label className={labelClass}>Company name</label>
                        <input
                          className={inputClass}
                          value={form.name}
                          onChange={(e) => patch({ name: e.target.value })}
                          placeholder="Atlantic Maple Foods Inc."
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Province / territory</label>
                        <select
                          className={inputClass}
                          value={form.province}
                          onChange={(e) => patch({ province: e.target.value })}
                        >
                          <option value="">Select province</option>
                          {PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Primary contact</label>
                          <input
                            className={inputClass}
                            value={form.primaryContact ?? ''}
                            onChange={(e) => patch({ primaryContact: e.target.value || null })}
                            placeholder="Claire Beaumont"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Contact email</label>
                          <input
                            type="email"
                            className={inputClass}
                            value={form.contactEmail ?? ''}
                            onChange={(e) => patch({ contactEmail: e.target.value || null })}
                            placeholder="exports@company.ca"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Website</label>
                        <input
                          type="url"
                          className={inputClass}
                          value={form.website ?? ''}
                          onChange={(e) => patch({ website: e.target.value || null })}
                          placeholder="https://www.company.ca"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Employees</label>
                          <select
                            className={inputClass}
                            value={form.employeeRange ?? ''}
                            onChange={(e) => patch({ employeeRange: e.target.value || null })}
                          >
                            <option value="">Select range</option>
                            {EMPLOYEE_RANGES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Annual revenue</label>
                          <select
                            className={inputClass}
                            value={form.revenueRange ?? ''}
                            onChange={(e) => patch({ revenueRange: e.target.value || null })}
                          >
                            <option value="">Select range</option>
                            {REVENUE_RANGES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                        <input
                          type="checkbox"
                          checked={form.hasLocalAgent}
                          onChange={(e) => patch({ hasLocalAgent: e.target.checked })}
                          className="h-4 w-4 rounded border-[var(--border-medium-contrast)] accent-[var(--accent-premium)]"
                        />
                        We have a local agent or distributor in the target market
                      </label>
                    </div>
                  )}

                  {step === 1 && (
                    <SectorSelector
                      value={form.industry}
                      onChange={(industry) => patch({ industry })}
                    />
                  )}

                  {step === 2 && (
                    <div className="grid gap-4">
                      <div>
                        <label className={labelClass}>Product description</label>
                        <textarea
                          className={cn(inputClass, 'min-h-24 resize-y')}
                          value={form.productDescription}
                          onChange={(e) => patch({ productDescription: e.target.value })}
                          placeholder="Describe your export product in detail for classification and market analysis…"
                        />
                      </div>
                      <CountrySelect
                        value={form.targetCountry}
                        onChange={(iso3, name) => patch({ targetCountry: iso3, targetCountryName: name })}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Annual export quantity (units)</label>
                          <input
                            type="number"
                            min={1}
                            className={inputClass}
                            value={form.exportQuantity || ''}
                            onChange={(e) => patch({ exportQuantity: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Target profit margin (%)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            className={inputClass}
                            value={form.targetProfitMargin || ''}
                            onChange={(e) =>
                              patch({ targetProfitMargin: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Production cost (CAD / unit)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            className={inputClass}
                            value={form.productionCost || ''}
                            onChange={(e) => patch({ productionCost: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Unit price (CAD)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            className={inputClass}
                            value={form.unitPrice || ''}
                            onChange={(e) => patch({ unitPrice: Number(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <HsCodeSearch
                      productDescription={form.productDescription}
                      value={form.hsCode}
                      onChange={(code) => {
                        patch({ hsCode: code });
                        setHsConfirmed(false);
                      }}
                      onConfirmedChange={setHsConfirmed}
                      showComplianceWarning={
                        form.industry === 'Defence, Dual-Use & Critical Supply Chains'
                      }
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {step === 3 && form.hsCode && !hsConfirmed && (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  Confirm your HS code selection before finishing onboarding.
                </p>
              )}
            </div>

            {submitError && (
              <p className="px-5 text-sm text-[var(--accent-danger)]" role="alert">
                {submitError}
              </p>
            )}

            <footer className="flex items-center justify-between gap-3 border-t border-[var(--border-low-contrast)] px-5 py-4">
              <motion.button
                type="button"
                onClick={goBack}
                disabled={step === 0 || submitting}
                className="inline-flex items-center gap-2 rounded-[var(--radius-card)] px-3 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-40"
                {...buttonSpring}
              >
                <ArrowLeft size={16} />
                Back
              </motion.button>

              {step < STEPS.length - 1 ? (
                <motion.button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--accent-premium)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-40"
                  {...buttonSpring}
                >
                  Continue
                  <ArrowRight size={16} />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!canAdvance || submitting}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--accent-premium)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-40"
                  {...buttonSpring}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Complete onboarding
                </motion.button>
              )}
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
