// app/beta/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  CheckCircle, Clock, Loader2, ArrowRight,
  Search, FileText, DollarSign, Globe, TrendingUp,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEADLINE = new Date('2026-04-30T23:59:59-03:00');

const PROVINCES = [
  'Alberta (AB)', 'British Columbia (BC)', 'Manitoba (MB)',
  'New Brunswick (NB)', 'Newfoundland and Labrador (NL)',
  'Northwest Territories (NT)', 'Nova Scotia (NS)', 'Nunavut (NU)',
  'Ontario (ON)', 'Prince Edward Island (PE)', 'Quebec (QC)',
  'Saskatchewan (SK)', 'Yukon (YT)',
];

const REFERRAL_SOURCES = [
  'LinkedIn', 'Trade commissioner / TCS', 'BDC / EDC',
  'Google search', 'Word of mouth', 'Event or conference', 'Other',
];

const EXPORT_EXPERIENCE_OPTIONS = [
  'First-time exporter',
  '1–2 completed export transactions',
  '3+ export markets currently active',
];

type CohortConfig = {
  cohort_number: number;
  cohort_status: 'open' | 'reviewing' | 'full' | 'closed';
};

type FormState = {
  full_name: string; email: string; company_name: string; province: string;
  website: string; product_description: string; hs_code: string;
  export_experience: string; biggest_challenge: string; selected_plan: string;
  referral_source: string; linkedin_url: string;
};

const EMPTY_FORM: FormState = {
  full_name: '', email: '', company_name: '', province: '',
  website: '', product_description: '', hs_code: '',
  export_experience: '', biggest_challenge: '', selected_plan: '',
  referral_source: '', linkedin_url: '',
};

// ─── Countdown timer ──────────────────────────────────────────────────────────

function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = DEADLINE.getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTime({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (expired) {
    return (
      <p className="text-sm text-white/70 my-6">
        Applications are now closed.{' '}
        <Link href="/waitlist" className="text-[#2DD4BF] font-medium hover:underline">
          Join the waitlist →
        </Link>
      </p>
    );
  }

  const blocks = [
    { value: time.days,    label: 'Days' },
    { value: time.hours,   label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ];

  return (
    <div className="flex items-center justify-center gap-3 my-6 max-w-xs mx-auto">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 min-w-[64px] flex flex-col items-center backdrop-blur-sm">
            <span className="text-3xl font-bold tabular-nums text-white">
              {String(b.value).padStart(2, '0')}
            </span>
            <span className="text-xs text-white/60 uppercase tracking-widest mt-1">{b.label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className="hidden sm:block text-white/40 text-xl select-none">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Plan selector cards ──────────────────────────────────────────────────────

const STARTER_NOW = [
  { label: 'HS Code Assistant',      desc: 'Classify your product to the correct HS code — get duty rates, misclassification risks, and GRI-based reasoning' },
  { label: 'Incoterms Analyzer',     desc: 'Get a recommended Incoterm for your shipment — plain-language breakdown of who pays and who bears risk' },
  { label: 'Deal Summary Generator', desc: 'Generate an export-ready deal summary from your product, buyer, and market inputs — ready for advisor or buyer review' },
  { label: 'Deal Wizard',            desc: 'Run a full landed-cost estimate end-to-end — from HS code through Incoterm to a deal summary, all in one flow' },
  { label: 'Export Compass',         desc: 'Score and rank international markets for your product using Stats Canada and UN Comtrade demand, FTA access, and risk data' },
  { label: 'Freight Connect',        desc: 'Match with CIFFA-verified freight forwarders by lane, shipping mode, and HS chapter — and receive quotes directly' },
];

const STARTER_GROWTH_ONLY = [
  { label: 'FTA Diversify',      desc: 'Find the best Free Trade Agreement rate for your product across active Canadian FTAs — see duty savings by market' },
  { label: 'Fund My Export',     desc: 'Identify BDC, EDC, and federal/provincial grant programs matched to your specific export scenario' },
];

const GROWTH_NOW = [
  { label: 'HS Code Assistant',      desc: 'Classify your product to the correct HS code — get duty rates, misclassification risks, and GRI-based reasoning' },
  { label: 'Incoterms Analyzer',     desc: 'Get a recommended Incoterm for your shipment — plain-language breakdown of who pays and who bears risk' },
  { label: 'Deal Summary Generator', desc: 'Generate an export-ready deal summary from your product, buyer, and market inputs — ready for advisor or buyer review' },
  { label: 'Deal Wizard',            desc: 'Run a full landed-cost estimate end-to-end — from HS code through Incoterm to a deal summary, all in one flow' },
  { label: 'Export Compass',         desc: 'Score and rank international markets for your product using Stats Canada and UN Comtrade demand, FTA access, and risk data' },
  { label: 'Freight Connect',        desc: 'Match with CIFFA-verified freight forwarders by lane, shipping mode, and HS chapter — and receive quotes directly' },
  { label: 'FTA Diversify',          desc: 'Find the best Free Trade Agreement rate for your product across active Canadian FTAs — see duty savings by market' },
  { label: 'Fund My Export',         desc: 'Identify BDC, EDC, and federal/provincial grant programs matched to your specific export scenario' },
];

const GROWTH_COMING = [
  { label: 'Tariff Engine',                    desc: 'Live duty rates and FTA savings updated from official tariff schedules' },
  { label: 'Buyer Intelligence',               desc: 'Find verified distributors and buyers in target markets' },
  { label: 'AI HS Classifier + GRI Reasoning', desc: 'Full 10-digit HS classification with complete legal reasoning trail' },
];

function PlanSelector({ selected, onSelect }: {
  selected: string;
  onSelect: (plan: string) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 mb-8">
      {/* Starter */}
      <button
        type="button"
        onClick={() => onSelect('starter')}
        className={`text-left rounded-xl border p-5 transition-all flex flex-col ${
          selected === 'starter'
            ? 'ring-2 ring-primary shadow-md border-primary'
            : 'border-black/8 opacity-80 hover:opacity-100 hover:border-black/20'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Starter</p>
          <span className="rounded-full bg-[#1F6FEB]/10 text-[#1F6FEB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            Founding Rate
          </span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Available now</p>
        <ul className="space-y-2 mb-4">
          {STARTER_NOW.map((f) => (
            <li key={f.label} className="flex items-start gap-2 text-xs">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
              <span><span className="font-medium">{f.label}</span><span className="text-muted-foreground"> — {f.desc}</span></span>
            </li>
          ))}
          {STARTER_GROWTH_ONLY.map((f) => (
            <li key={f.label} className="flex items-start gap-2 text-xs">
              <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center text-muted-foreground/40 mt-0.5">✕</span>
              <span className="flex-1"><span className="font-medium text-muted-foreground">{f.label}</span><span className="text-muted-foreground/70"> — {f.desc}</span></span>
              <span className="ml-auto rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0">
                Growth only
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-auto pt-3 border-t border-border">Support: Email</p>
      </button>

      {/* Growth */}
      <div className="relative">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="rounded-full bg-primary text-primary-foreground px-4 py-1 text-xs font-bold whitespace-nowrap">
            Most Popular
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelect('growth')}
          className={`w-full text-left rounded-xl border-2 p-5 transition-all flex flex-col ${
            selected === 'growth'
              ? 'ring-2 ring-primary shadow-md border-primary'
              : 'border-primary/30 hover:border-primary/60'
          }`}
        >
          <div className="flex items-center justify-between mb-4 mt-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Growth</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Available now</p>
          <ul className="space-y-2 mb-4">
            {GROWTH_NOW.map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                <span><span className="font-medium">{f.label}</span><span className="text-muted-foreground"> — {f.desc}</span></span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Coming during your lock</p>
          <p className="text-[10px] text-muted-foreground mb-2">Enabled automatically — no extra cost.</p>
          <ul className="space-y-2 mb-4">
            {GROWTH_COMING.map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-0.5" />
                <span><span className="font-medium">{f.label}</span><span className="text-muted-foreground"> — {f.desc}</span></span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-auto pt-3 border-t border-border">Support: Priority + onboarding call</p>
        </button>
      </div>
    </div>
  );
}

// ─── Application form ─────────────────────────────────────────────────────────

function ApplicationForm({ initialPlan, cohortClosed }: {
  initialPlan: string;
  cohortClosed: boolean;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, selected_plan: initialPlan });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverBanner, setServerBanner] = useState('');
  const [cohortClosedBanner, setCohortClosedBanner] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, selected_plan: initialPlan }));
  }, [initialPlan]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validateStep1(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim())    next.full_name    = 'Required.';
    if (!form.email.trim())        next.email        = 'Required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.';
    if (!form.company_name.trim()) next.company_name = 'Required.';
    if (!form.province.trim())     next.province     = 'Required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.product_description.trim()) next.product_description = 'Required.';
    if (!form.export_experience.trim())   next.export_experience   = 'Required.';
    if (!form.biggest_challenge.trim())   next.biggest_challenge   = 'Required.';
    if (!form.selected_plan.trim())       next.selected_plan       = 'Please select a plan above.';
    if (!form.referral_source.trim())     next.referral_source     = 'Required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleContinue() {
    if (validateStep1()) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) return;
    setSubmitting(true);
    setServerBanner('');

    try {
      const res = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as {
        success?: boolean; error?: string; message?: string;
        fields?: Record<string, string>;
      };

      if (res.ok && data.success) {
        setSuccess(true);
        return;
      }
      if (res.status === 409 || data.error === 'duplicate_email') {
        setErrors((prev) => ({ ...prev, email: 'An application with this email already exists.' }));
        setStep(1);
      } else if (res.status === 403 || data.error === 'cohort_closed') {
        setCohortClosedBanner(true);
      } else {
        setServerBanner('Something went wrong. Please try again or email hello@mercorama.com');
      }
    } catch {
      setServerBanner('Something went wrong. Please try again or email hello@mercorama.com');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
      errors[field] ? 'border-destructive' : 'border-input'
    }`;
  const labelClass = 'block text-sm font-medium mb-1';
  const errClass   = 'text-sm text-destructive mt-1';

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Application received</h3>
        <p className="text-muted-foreground mb-6">
          We&apos;ll review your application and be in touch within 48 hours.
          In the meantime, you&apos;re welcome to explore our tools.
        </p>
        <Link href="/" className="text-primary font-medium hover:underline">← Back to Mercorama</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {s}
            </div>
            <span className={`text-sm ${step === s ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              {s === 1 ? 'About You' : 'Export Context'}
            </span>
            {s < 2 && <span className="text-muted-foreground mx-1">→</span>}
          </div>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">Step {step} of 2</span>
      </div>

      {cohortClosedBanner && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Applications for Cohort 1 are now closed. You&apos;ve been added to the Cohort 2 waitlist.
        </div>
      )}

      {serverBanner && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverBanner}
        </div>
      )}

      {/* Plan selector (shown on step 2) */}
      {step === 2 && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">
            Plan selected: <span className="capitalize">{form.selected_plan || '—'}</span>
            <button type="button" onClick={() => setStep(1)} className="ml-2 text-primary text-xs hover:underline">Change</button>
          </p>
          {errors.selected_plan && <p className={errClass}>{errors.selected_plan}</p>}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name <span className="text-destructive">*</span></label>
              <input className={inputClass('full_name')} value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)} placeholder="Jane Smith" />
              {errors.full_name && <p className={errClass}>{errors.full_name}</p>}
            </div>
            <div>
              <label className={labelClass}>Work Email <span className="text-destructive">*</span></label>
              <input type="email" className={inputClass('email')} value={form.email}
                onChange={(e) => set('email', e.target.value)} placeholder="jane@company.ca" />
              {errors.email && <p className={errClass}>{errors.email}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Company Name <span className="text-destructive">*</span></label>
              <input className={inputClass('company_name')} value={form.company_name}
                onChange={(e) => set('company_name', e.target.value)} placeholder="Acme Export Co." />
              {errors.company_name && <p className={errClass}>{errors.company_name}</p>}
            </div>
            <div>
              <label className={labelClass}>Province / Territory <span className="text-destructive">*</span></label>
              <select className={inputClass('province')} value={form.province}
                onChange={(e) => set('province', e.target.value)}>
                <option value="">Select province…</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.province && <p className={errClass}>{errors.province}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Website URL</label>
            <input type="url" className={inputClass('website')} value={form.website}
              onChange={(e) => set('website', e.target.value)} placeholder="https://" />
          </div>
          <Button type="button" onClick={handleContinue} className="w-full gap-2" size="lg">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className={labelClass}>Product Description <span className="text-destructive">*</span></label>
            <textarea rows={3} className={`${inputClass('product_description')} resize-y`}
              value={form.product_description}
              onChange={(e) => set('product_description', e.target.value)}
              placeholder="What do you sell, and where are you trying to export it?" />
            {errors.product_description && <p className={errClass}>{errors.product_description}</p>}
          </div>
          <div>
            <label className={labelClass}>HS Code (optional)</label>
            <input className={inputClass('hs_code')} value={form.hs_code}
              onChange={(e) => set('hs_code', e.target.value)} placeholder="e.g. 0306.11" />
            <p className="text-xs text-muted-foreground mt-1">Don&apos;t know it? Mercorama will help you find it.</p>
          </div>
          <div>
            <label className={labelClass}>Export Experience <span className="text-destructive">*</span></label>
            <div className="space-y-2 mt-1">
              {EXPORT_EXPERIENCE_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="export_experience" value={opt}
                    checked={form.export_experience === opt}
                    onChange={() => set('export_experience', opt)}
                    className="h-4 w-4 text-primary border-input" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
            {errors.export_experience && <p className={errClass}>{errors.export_experience}</p>}
          </div>
          <div>
            <label className={labelClass}>Biggest Challenge <span className="text-destructive">*</span></label>
            <textarea rows={2} className={`${inputClass('biggest_challenge')} resize-y`}
              value={form.biggest_challenge}
              onChange={(e) => set('biggest_challenge', e.target.value)}
              placeholder="What's the #1 thing blocking your export growth right now?" />
            {errors.biggest_challenge && <p className={errClass}>{errors.biggest_challenge}</p>}
          </div>
          <div>
            <label className={labelClass}>How did you hear about Mercorama? <span className="text-destructive">*</span></label>
            <select className={inputClass('referral_source')} value={form.referral_source}
              onChange={(e) => set('referral_source', e.target.value)}>
              <option value="">Select…</option>
              {REFERRAL_SOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.referral_source && <p className={errClass}>{errors.referral_source}</p>}
          </div>
          <div>
            <label className={labelClass}>LinkedIn Profile URL (optional)</label>
            <input type="url" className={inputClass('linkedin_url')} value={form.linkedin_url}
              onChange={(e) => set('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
              ← Back
            </Button>
            <Button type="submit" disabled={submitting || cohortClosedBanner} className="flex-1 gap-2" size="lg">
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : <>Submit Application <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BetaPage() {
  const [cohort, setCohort]   = useState<CohortConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('growth');

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/beta/status')
      .then((r) => r.json())
      .then((d: { cohort: CohortConfig }) => setCohort(d.cohort))
      .finally(() => setLoading(false));
  }, []);

  function scrollToForm(plan?: string) {
    if (plan) setSelectedPlan(plan);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  const deadlinePassed = Date.now() > DEADLINE.getTime();
  const cohortOpen     = cohort?.cohort_status === 'open';
  const cohortClosed   = !cohortOpen;

  const features = [
    { icon: Search,     title: 'HS Code Assistant',      desc: 'Classify your products accurately — audit-ready from day one.' },
    { icon: FileText,   title: 'Incoterms Analyzer',     desc: 'Understand your trade terms and obligations for every shipment.' },
    { icon: FileText,   title: 'Deal Summary Generator', desc: 'Export-ready deal summaries built from your product and market inputs.' },
    { icon: DollarSign, title: 'Deal Wizard',            desc: 'Full landed cost calculator before you commit to any market.' },
    { icon: DollarSign, title: 'Fund My Export',         desc: 'Identify government grants and funding programs for your export scenario.' },
    { icon: Globe,      title: 'FTA Diversify Wizard',   desc: 'Find the best Free Trade Agreement rate for your product and market.' },
    { icon: TrendingUp, title: 'Export Compass',         desc: 'Find your best international markets — backed by Stats Canada and UN Comtrade data.' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* ── Urgency banner ── */}
      {!deadlinePassed && (
        <div className="border-b border-[#1F6FEB]/20 bg-[#1F6FEB]/8 py-2 text-sm text-center text-foreground">
          Beta closes April 30, 2026 — founding member applications close soon&nbsp;&nbsp;
          <button onClick={() => scrollToForm()} className="font-semibold text-[#1F6FEB] hover:underline">
            Apply Now →
          </button>
        </div>
      )}

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#0B1F3A] px-4 py-16 sm:py-24 sm:px-6">
          {/* Gradient overlays */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#1F6FEB] opacity-20 blur-3xl" />
            <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-[#2DD4BF] opacity-15 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#1F6FEB] opacity-10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            {!loading && cohortOpen && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                <span className="text-sm font-semibold text-[#2DD4BF]">
                  Early access applications open — closes April 30, 2026
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl mb-5 leading-tight text-white">
              Know exactly where your product sells — before you spend a dollar on export.
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-2 leading-relaxed">
              Mercorama gives Canadian SMEs AI-powered market intelligence: demand signals,
              landed costs, and HS code analysis — in minutes, not months.
            </p>

            <Countdown />

            {cohortOpen && (
              <Button size="lg" onClick={() => scrollToForm('growth')} className="gap-2 mt-2 bg-[#1F6FEB] hover:bg-[#1a5fd4] text-white border-0">
                Apply Before April 30 <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {!loading && cohortClosed && (
              <Link href="/waitlist">
                <Button size="lg" className="gap-2 mt-2 bg-[#1F6FEB] hover:bg-[#1a5fd4] text-white border-0">
                  Join the Waitlist for Cohort 2 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* ── Trust bar ── */}
        <section className="border-b bg-muted/40 px-4 py-4">
          <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            {['Stats Canada data · 2026', 'Built in Bedford, Nova Scotia', 'Response within 48 hours', 'No credit card required'].map((t, i, arr) => (
              <span key={t} className="flex items-center gap-2">
                {t}
                {i < arr.length - 1 && <span className="hidden sm:inline opacity-40">|</span>}
              </span>
            ))}
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="px-4 py-16 sm:px-6 border-b">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight mb-2">What you get</h2>
            <p className="text-muted-foreground mb-8">Tools available from day one, plus more shipping every two weeks.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <Icon className="w-5 h-5 shrink-0 mt-0.5 text-foreground" />
                    <div>
                      <p className="text-sm font-semibold mb-1">{f.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Why now ── */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 border-b bg-[#0B1F3A]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[#2DD4BF] opacity-10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#1F6FEB] opacity-15 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl">
            <h2 className="text-2xl font-semibold mb-3 text-white">Canada&apos;s export moment is now</h2>
            <p className="text-white/60 mb-10 max-w-2xl">
              Tariff pressure, supply chain pivots, and new trade corridors are reshaping where Canadian
              goods can win. Mercorama maps the opportunity before your competitors do.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { stat: '25%+',  desc: 'Canadian goods facing active US tariff exposure need new market routes' },
                { stat: '$28B',  desc: 'In underserved corridors across South America, Southeast Asia, and Gulf states' },
                { stat: '48 hr', desc: 'From application approval to your first market intelligence report' },
              ].map((c) => (
                <div key={c.stat} className="bg-white/10 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
                  <p className="text-3xl font-bold mb-2 text-white">{c.stat}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Plan + Form ── */}
        <section ref={formRef} className="px-4 py-16 sm:px-6 border-b bg-[#F6F8FB] dark:bg-muted/20" id="apply">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-10">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#1F6FEB]/10 px-3 py-1 text-xs font-semibold text-[#1F6FEB] uppercase tracking-widest">
                Founding Member Access
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Apply for Early Access</h2>
              <p className="text-muted-foreground">
                Locked pricing. Features keep shipping. Your rate stays fixed for 12 months.
              </p>
              {!deadlinePassed && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                  <Clock className="w-4 h-4" />
                  Applications close <strong className="ml-1">April 30, 2026</strong>
                </div>
              )}
            </div>

            {cohortOpen ? (
              <>
                <PlanSelector selected={selectedPlan} onSelect={setSelectedPlan} />
                <ApplicationForm initialPlan={selectedPlan} cohortClosed={false} />
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg font-semibold mb-2">Early access applications are now closed.</p>
                <p className="text-muted-foreground mb-6">Join the waitlist for Cohort 2.</p>
                <Link href="/waitlist">
                  <Button size="lg" className="gap-2">
                    Join the Waitlist <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {cohortOpen && (
              <p className="text-center text-xs text-muted-foreground mt-6">
                We review every application personally. You&apos;ll hear back within 48 hours.
              </p>
            )}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
