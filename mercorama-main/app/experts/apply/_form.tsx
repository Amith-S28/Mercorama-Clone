'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, ArrowRight, ArrowLeft, Check, ShieldCheck, Flag, Handshake, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRY_PHONE: { country: string; code: string; iso: string }[] = [
  { country: 'Canada', code: '+1', iso: 'CA' },
  { country: 'United States', code: '+1', iso: 'US' },
  { country: 'Algeria', code: '+213', iso: 'DZ' },
  { country: 'Argentina', code: '+54', iso: 'AR' },
  { country: 'Australia', code: '+61', iso: 'AU' },
  { country: 'Austria', code: '+43', iso: 'AT' },
  { country: 'Bangladesh', code: '+880', iso: 'BD' },
  { country: 'Belgium', code: '+32', iso: 'BE' },
  { country: 'Brazil', code: '+55', iso: 'BR' },
  { country: 'Chile', code: '+56', iso: 'CL' },
  { country: 'China', code: '+86', iso: 'CN' },
  { country: 'Colombia', code: '+57', iso: 'CO' },
  { country: 'Czech Republic', code: '+420', iso: 'CZ' },
  { country: 'Denmark', code: '+45', iso: 'DK' },
  { country: 'Egypt', code: '+20', iso: 'EG' },
  { country: 'Ethiopia', code: '+251', iso: 'ET' },
  { country: 'France', code: '+33', iso: 'FR' },
  { country: 'Germany', code: '+49', iso: 'DE' },
  { country: 'Ghana', code: '+233', iso: 'GH' },
  { country: 'Hong Kong', code: '+852', iso: 'HK' },
  { country: 'India', code: '+91', iso: 'IN' },
  { country: 'Indonesia', code: '+62', iso: 'ID' },
  { country: 'Ireland', code: '+353', iso: 'IE' },
  { country: 'Israel', code: '+972', iso: 'IL' },
  { country: 'Italy', code: '+39', iso: 'IT' },
  { country: 'Japan', code: '+81', iso: 'JP' },
  { country: 'Jordan', code: '+962', iso: 'JO' },
  { country: 'Kenya', code: '+254', iso: 'KE' },
  { country: 'Malaysia', code: '+60', iso: 'MY' },
  { country: 'Mexico', code: '+52', iso: 'MX' },
  { country: 'Morocco', code: '+212', iso: 'MA' },
  { country: 'Netherlands', code: '+31', iso: 'NL' },
  { country: 'New Zealand', code: '+64', iso: 'NZ' },
  { country: 'Nigeria', code: '+234', iso: 'NG' },
  { country: 'Norway', code: '+47', iso: 'NO' },
  { country: 'Pakistan', code: '+92', iso: 'PK' },
  { country: 'Peru', code: '+51', iso: 'PE' },
  { country: 'Philippines', code: '+63', iso: 'PH' },
  { country: 'Poland', code: '+48', iso: 'PL' },
  { country: 'Portugal', code: '+351', iso: 'PT' },
  { country: 'Qatar', code: '+974', iso: 'QA' },
  { country: 'Saudi Arabia', code: '+966', iso: 'SA' },
  { country: 'Singapore', code: '+65', iso: 'SG' },
  { country: 'South Africa', code: '+27', iso: 'ZA' },
  { country: 'South Korea', code: '+82', iso: 'KR' },
  { country: 'Spain', code: '+34', iso: 'ES' },
  { country: 'Sweden', code: '+46', iso: 'SE' },
  { country: 'Switzerland', code: '+41', iso: 'CH' },
  { country: 'Taiwan', code: '+886', iso: 'TW' },
  { country: 'Thailand', code: '+66', iso: 'TH' },
  { country: 'Turkey', code: '+90', iso: 'TR' },
  { country: 'United Arab Emirates', code: '+971', iso: 'AE' },
  { country: 'United Kingdom', code: '+44', iso: 'GB' },
  { country: 'Vietnam', code: '+84', iso: 'VN' },
  { country: 'Other', code: '+', iso: 'XX' },
];

// Lookup for country → code
const COUNTRY_CODES: Record<string, string> = Object.fromEntries(
  COUNTRY_PHONE.map((c) => [c.country, c.code])
);

// Convert ISO code to flag emoji (works in JSX text nodes, NOT in <option>)
function isoToFlag(iso: string): string {
  if (iso === 'XX' || iso.length !== 2) return '';
  return String.fromCodePoint(
    ...iso.toUpperCase().split('').map((c) => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

const CA_PROVINCES = [
  'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador',
  'Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island',
  'Quebec','Saskatchewan','Yukon',
];

const EXPERT_TYPES = [
  'Market Entry & Global Expansion','Growth Strategy & Planning','Market Intelligence & Research',
  'Executive Advisory & Partnerships','Customs Broker','Freight & Logistics Specialist',
  'CITP / FIBP Advisor','Trade Finance Specialist','Export Documentation Specialist','Other',
];

const CREDENTIALS = [
  'CITP','FIBP','CCS','CBSA-Certified','P.Log','C.P.L.','CIFFA Member',
  'Licensed Customs Broker','None / Other',
];

const SPECIALIZATIONS = [
  'HS Classification','Customs Compliance','CETA','CPTPP','CUSMA/USMCA','Incoterms',
  'Export Documentation','Market Entry Strategy','Freight Procurement','Trade Finance',
  'Tariff Engineering','Supply Chain Optimization','Sanctions & Export Controls',
  'Agri-Food Exports','Tech & IP Exports',
];

const EXPERIENCE_OPTIONS = ['1–3 years','4–7 years','8–15 years','15+ years'];

const REGIONS = [
  'Canada (domestic)','United States','European Union','United Kingdom','Asia-Pacific',
  'Latin America','Middle East & North Africa','Sub-Saharan Africa','Global',
];

const LANGUAGES = ['English','French','Spanish','Mandarin','Arabic','Portuguese','Other'];

const ENGAGEMENT_TYPES = [
  'Advisory Calls (30–60 min sessions)','Project-Based Engagements (custom scope)',
  'Document Review','Platform Q&A (async responses)','Webinars / Group Sessions',
];

const COLLABORATION_TYPES = [
  'Answer SME questions on the platform','Partner on export deal workflows',
  'Contribute expert articles / content','Offer group webinars or workshops',
];

const AVAILABILITY_OPTIONS = [
  'Actively taking new clients','Limited availability','Available for platform collaboration only',
];

const REFERRAL_OPTIONS = ['LinkedIn','Google Search','Colleague / Referral','Trade Association','Conference / Event','Other'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  full_name: string; email: string; phone_code: string; phone: string; linkedin_url: string; website_url: string;
  location_country: string; location_province: string; location_city: string;
  expert_type: string; credentials: string[]; additional_certifications: string; notable_achievements: string; video_intro_url: string; specializations: string[];
  years_experience: string; regions_served: string[]; languages: string[];
  bio: string; engagement_types: string[]; session_ideas: string;
  collaboration_types: string[]; availability: string;
  referral_source: string; additional_notes: string; consent_terms: boolean;
}

const INITIAL: FormData = {
  full_name: '', email: '', phone_code: '+1', phone: '', linkedin_url: '', website_url: '',
  location_country: 'Canada', location_province: '', location_city: '',
  expert_type: '', credentials: [], additional_certifications: '', notable_achievements: '', video_intro_url: '', specializations: [],
  years_experience: '', regions_served: [], languages: [],
  bio: '', engagement_types: [], session_ideas: '',
  collaboration_types: [], availability: '',
  referral_source: '', additional_notes: '', consent_terms: false,
};

// ── Phone input with flags ────────────────────────────────────────────────────

function PhoneInput({ code, phone, onCodeChange, onPhoneChange }: {
  code: string; phone: string; onCodeChange: (v: string) => void; onPhoneChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRY_PHONE.find((c) => c.code === code) ?? COUNTRY_PHONE[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div ref={ref} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm w-full sm:w-[200px] hover:bg-muted/80 transition-colors"
        >
          <span className="text-base leading-none">{isoToFlag(selected.iso)}</span>
          <span>{selected.code}</span>
          <span className="text-muted-foreground truncate flex-1 text-left">{selected.country}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full sm:w-[280px] max-h-60 overflow-y-auto rounded-lg border bg-background shadow-lg">
            {COUNTRY_PHONE.map((c) => (
              <button
                key={c.country}
                type="button"
                onClick={() => { onCodeChange(c.code); setOpen(false); }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[#01696f]/10 transition-colors text-left',
                  c.code === code && 'bg-[#01696f]/10 text-[#01696f] font-medium',
                )}
              >
                <span className="text-base leading-none w-6 text-center">{isoToFlag(c.iso)}</span>
                <span className="font-mono text-xs w-10">{c.code}</span>
                <span className="truncate">{c.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Input type="tel" value={phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="(555) 123-4567" className="flex-1" />
    </div>
  );
}

// ── Pill components ───────────────────────────────────────────────────────────

function PillSingle({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={cn('rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200',
            value === o ? 'bg-[#01696f] text-white border-[#01696f]' : 'bg-card text-muted-foreground border-border hover:border-[#01696f]/40')}>
          {value === o && <Check className="inline h-3 w-3 mr-1" />}{o}
        </button>
      ))}
    </div>
  );
}

function PillMulti({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  function toggle(o: string) {
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200',
              active ? 'bg-[#01696f] text-white border-[#01696f]' : 'bg-card text-muted-foreground border-border hover:border-[#01696f]/40')}>
            {active && <Check className="inline h-3 w-3 mr-1" />}{o}
          </button>
        );
      })}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label key={o} className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors">
          <input type="radio" checked={value === o} onChange={() => onChange(o)} className="accent-[#01696f]" />
          <span className="text-sm">{o}</span>
        </label>
      ))}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: number }) {
  const steps = ['About You', 'Your Expertise', 'Collaboration'];
  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-0 mb-8">
        {steps.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={label} className="flex items-center">
              {i > 0 && <div className={cn('w-12 h-px', done ? 'bg-[#01696f]' : 'bg-border')} />}
              <div className="flex items-center gap-2">
                <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  done ? 'bg-[#01696f] text-white' : active ? 'bg-[#01696f] text-white' : 'bg-muted text-muted-foreground')}>
                  {done ? <Check className="h-4 w-4" /> : num}
                </div>
                <span className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile */}
      <p className="sm:hidden text-center text-sm text-muted-foreground mb-6">Step {step} of 3 — {steps[step - 1]}</p>
    </>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function ExpertApplyForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.full_name.trim()) e.full_name = 'Required';
      if (!form.email.trim()) e.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
      if (!form.linkedin_url.trim()) e.linkedin_url = 'Required';
      if (!form.location_country) e.location_country = 'Required';
      if (!form.location_city.trim()) e.location_city = 'Required';
    }
    if (s === 2) {
      if (!form.expert_type) e.expert_type = 'Select your primary role';
      if (!form.years_experience) e.years_experience = 'Select your experience level';
      if (form.regions_served.length === 0) e.regions_served = 'Select at least one region';
      // Video intro validation
      if (!form.video_intro_url.trim()) {
        e.video_intro_url = 'A video introduction is required. It helps us verify your expertise before approving your profile.';
      } else {
        const url = form.video_intro_url.trim();
        if (!url.startsWith('https://')) {
          e.video_intro_url = 'URL must start with https://';
        } else if (!/(loom\.com|youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com|dropbox\.com|wistia\.com)/.test(url)) {
          e.video_intro_url = 'Please use Loom, YouTube, Vimeo, Google Drive, or Dropbox to share your video.';
        }
      }
    }
    if (s === 3) {
      if (form.bio.trim().length < 100) e.bio = 'Bio must be at least 100 characters';
      if (form.bio.trim().length > 600) e.bio = 'Bio must be 600 characters or fewer';
      if (form.engagement_types.length === 0) e.engagement_types = 'Select at least one';
      if (form.collaboration_types.length === 0) e.collaboration_types = 'Select at least one';
      if (!form.availability) e.availability = 'Select your availability';
      if (!form.consent_terms) e.consent_terms = 'You must agree to the terms';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() { if (validateStep(step)) setStep((s) => Math.min(s + 1, 3)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setApiError('');
    try {
      const res = await fetch('/api/experts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setSubmitted(true); return; }
      if (data.errors) setErrors(data.errors);
      setApiError(data.error ?? 'Submission failed');
    } catch { setApiError('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (submitted) {
    const firstName = form.full_name.split(' ')[0];
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Application Received!</h1>
        <p className="text-muted-foreground">
          Thanks, {firstName}. We&apos;ve received your expert application and will review it within 5 business days.
          You&apos;ll hear from us at <span className="font-medium text-foreground">{form.email}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"><Button variant="outline">Explore the Platform</Button></Link>
          <Link href="/experts"><Button>Meet Our Experts</Button></Link>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-10 md:py-14 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Join Mercorama&apos;s Verified Trade Expert Network
          </h1>
          <p className="text-base text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Mercorama connects verified trade professionals — from customs brokers and CITP/FIBP advisors
            to market entry strategists and executive consultants — with Canadian SMEs navigating global
            expansion. Whether your expertise is in growth strategy, cross-border partnerships, or
            international market intelligence, we want you on the platform.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />Verified Profiles Only
            </span>
            <span className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-400" />Canadian SMEs · Global Markets
            </span>
            <span className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-blue-400" />Platform-Integrated Collaboration
            </span>
          </div>
        </div>
      </div>

      {/* Who we're looking for */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-center mb-6">Who We&apos;re Looking For</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Global Expansion & Market Entry', desc: 'Advisors who help SMEs identify, evaluate, and enter new international markets — from feasibility to go-to-market.' },
            { title: 'Growth Strategy & Planning', desc: 'Strategists who build export growth roadmaps, competitive positioning, and scalable international distribution models.' },
            { title: 'Market Intelligence & Research', desc: 'Analysts with expertise in competitive intelligence, trade data, market sizing, and opportunity mapping across global markets.' },
            { title: 'Executive Advisory & Partnerships', desc: 'Senior leaders who advise on cross-border M&A, strategic alliances, joint ventures, and international partnership structures.' },
            { title: 'Trade Compliance & Customs', desc: 'Licensed customs brokers, CITP/FIBP professionals, and compliance officers navigating tariffs, FTAs, and regulatory frameworks.' },
            { title: 'Freight, Logistics & Supply Chain', desc: 'Specialists in international freight, container and bulk shipping, logistics optimization, and multimodal supply chain design.' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border p-4 space-y-1">
              <div className="font-semibold text-sm">{item.title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Whether you&apos;re an independent consultant, a firm principal, or a seasoned executive — if your work helps companies trade globally, there&apos;s a place for you here.
        </p>
      </div>

      {/* Form card */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        <StepProgress step={step} />

        <div className="rounded-xl border bg-card p-6 sm:p-8 space-y-6">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">About You</h2>
                <p className="text-xs text-muted-foreground mt-1">Fields marked <span className="text-destructive">*</span> are required</p>
              </div>

              {/* ── Contact Information ── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact Information</h3>
                <Field label="Full Name" required error={errors.full_name}>
                  <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Jane Smith" />
                </Field>
                <Field label="Work / Professional Email" required error={errors.email}>
                  <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" />
                </Field>
                <Field label="Phone Number" error={errors.phone}>
                  <PhoneInput
                    code={form.phone_code}
                    phone={form.phone}
                    onCodeChange={(v) => set('phone_code', v)}
                    onPhoneChange={(v) => set('phone', v)}
                  />
                </Field>
              </div>

              {/* ── Professional Presence ── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Professional Presence</h3>
                <Field label="LinkedIn Profile URL" required error={errors.linkedin_url}>
                  <Input type="url" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/yourname" />
                </Field>
                <Field label="Personal or Company Website" error={errors.website_url}>
                  <Input type="url" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://yourcompany.com (optional)" />
                </Field>
              </div>

              {/* ── Location ── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Location</h3>
              <Field label="Country" required error={errors.location_country}>
                <select value={form.location_country} onChange={(e) => { set('location_country', e.target.value); const code = COUNTRY_CODES[e.target.value]; if (code) set('phone_code', code); }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="Canada">Canada</option>
                  <option value="United States">United States</option>
                  <option disabled>──────────</option>
                  {['Algeria','Argentina','Australia','Austria','Bangladesh','Belgium','Brazil','Chile','China','Colombia','Czech Republic','Denmark','Egypt','Ethiopia','France','Germany','Ghana','Hong Kong','India','Indonesia','Ireland','Israel','Italy','Japan','Jordan','Kenya','Malaysia','Mexico','Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Qatar','Saudi Arabia','Singapore','South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand','Turkey','United Arab Emirates','United Kingdom','Vietnam'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              {form.location_country === 'Canada' ? (
                <Field label="Province" required error={errors.location_province}>
                  <select value={form.location_province} onChange={(e) => set('location_province', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="">Select province</option>
                    {CA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              ) : form.location_country === 'United States' ? (
                <Field label="State" required error={errors.location_province}>
                  <Input value={form.location_province} onChange={(e) => set('location_province', e.target.value)} placeholder="e.g., California" />
                </Field>
              ) : (
                <Field label="Region / State / Province" error={errors.location_province}>
                  <Input value={form.location_province} onChange={(e) => set('location_province', e.target.value)} />
                </Field>
              )}
              <Field label="City" required error={errors.location_city}>
                <Input value={form.location_city} onChange={(e) => set('location_city', e.target.value)} placeholder="e.g., Halifax" />
              </Field>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">Your Expertise</h2>
              <Field label="Primary Role" required error={errors.expert_type}>
                <PillSingle options={EXPERT_TYPES} value={form.expert_type} onChange={(v) => set('expert_type', v)} />
              </Field>
              <Field label="Professional Credentials / Designations" error={errors.credentials}>
                <PillMulti options={CREDENTIALS} value={form.credentials} onChange={(v) => set('credentials', v)} />
              </Field>

              <Field label="Additional Certifications or Designations" error={errors.additional_certifications}>
                <Textarea
                  value={form.additional_certifications}
                  onChange={(e) => set('additional_certifications', e.target.value)}
                  placeholder="e.g. PMP, MBA, ISO 9001 Lead Auditor, CFA, Six Sigma Black Belt, CSCMP, Certified Freight Broker — list any additional professional certifications not covered above"
                  className="min-h-[60px]"
                  maxLength={300}
                />
                <p className="text-[11px] text-muted-foreground mt-1">List certifications separated by commas. These will appear on your expert profile.</p>
              </Field>

              <Field label="Awards, Recognition & Notable Achievements" error={errors.notable_achievements}>
                <div className="relative">
                  <Textarea
                    value={form.notable_achievements}
                    onChange={(e) => set('notable_achievements', e.target.value)}
                    placeholder={"e.g. 'Export Achievement Award — Trade Commissioner Service 2023', 'Featured in Globe and Mail — Canada\u2019s Top Trade Advisors', 'Speaker at World Trade Centre Toronto Summit 2024', 'Negotiated $12M CPTPP market entry deal for agri-food client'"}
                    className="min-h-[80px]"
                    maxLength={500}
                  />
                  <span className={cn('absolute bottom-2 right-3 text-[10px]',
                    form.notable_achievements.length > 475 ? 'text-destructive' : form.notable_achievements.length > 400 ? 'text-amber-500' : 'text-muted-foreground')}>
                    {form.notable_achievements.length} / 500
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Include awards, media features, speaking engagements, or deals you&apos;re proud of. This builds credibility on your public profile.</p>
              </Field>

              <Field label="Video Introduction" required error={errors.video_intro_url}>
                <Input
                  type="url"
                  value={form.video_intro_url}
                  onChange={(e) => set('video_intro_url', e.target.value)}
                  placeholder="https://www.loom.com/share/... or https://youtube.com/..."
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Record a 2–3 minute video introducing yourself and explaining how you help businesses with their market entry plans in your area of expertise.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Upload to <a href="https://www.loom.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Loom</a> (free), YouTube (unlisted), or Google Drive (link sharing on) and paste the URL here.
                </p>
              </Field>

              <Field label="Areas of Specialization (up to 5)" error={errors.specializations}>
                <PillMulti options={SPECIALIZATIONS} value={form.specializations} onChange={(v) => set('specializations', v)} max={5} />
              </Field>
              <Field label="Years of Experience" required error={errors.years_experience}>
                <RadioGroup options={EXPERIENCE_OPTIONS} value={form.years_experience} onChange={(v) => set('years_experience', v)} />
              </Field>
              <Field label="Regions You Serve" required error={errors.regions_served}>
                <PillMulti options={REGIONS} value={form.regions_served} onChange={(v) => set('regions_served', v)} />
              </Field>
              <Field label="Languages" error={errors.languages}>
                <PillMulti options={LANGUAGES} value={form.languages} onChange={(v) => set('languages', v)} />
              </Field>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">Collaboration Details</h2>
              <Field label="Professional Bio" required error={errors.bio}>
                <div className="relative">
                  <Textarea value={form.bio} onChange={(e) => set('bio', e.target.value)}
                    placeholder="Describe your background, the types of clients you work with, and what makes your approach distinct..."
                    className="min-h-[140px]" maxLength={600} />
                  <span className={cn('absolute bottom-2 right-3 text-[10px]',
                    form.bio.length > 570 ? 'text-destructive' : form.bio.length > 480 ? 'text-amber-500' : 'text-muted-foreground')}>
                    {form.bio.length} / 600
                  </span>
                </div>
              </Field>
              <Field label="Engagement Types" required error={errors.engagement_types}>
                <PillMulti options={ENGAGEMENT_TYPES} value={form.engagement_types} onChange={(v) => set('engagement_types', v)} />
              </Field>
              <Field label="Session Ideas (optional)" error={errors.session_ideas}>
                <Textarea value={form.session_ideas} onChange={(e) => set('session_ideas', e.target.value)}
                  placeholder="e.g. 'Incoterms advisory for food exporters, 45 min' or 'CETA tariff classification review for EU market entry'"
                  className="min-h-[80px]" maxLength={400} />
              </Field>
              <Field label="How Would You Like to Collaborate?" required error={errors.collaboration_types}>
                <PillMulti options={COLLABORATION_TYPES} value={form.collaboration_types} onChange={(v) => set('collaboration_types', v)} />
              </Field>
              <Field label="Current Availability" required error={errors.availability}>
                <RadioGroup options={AVAILABILITY_OPTIONS} value={form.availability} onChange={(v) => set('availability', v)} />
              </Field>
              <Field label="How did you hear about Mercorama?" error={errors.referral_source}>
                <select value={form.referral_source} onChange={(e) => set('referral_source', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {REFERRAL_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Anything else?" error={errors.additional_notes}>
                <Textarea value={form.additional_notes} onChange={(e) => set('additional_notes', e.target.value)}
                  className="min-h-[60px]" maxLength={400} />
              </Field>

              {/* Consent */}
              <div className={cn('flex items-start gap-3 rounded-lg border p-3', errors.consent_terms && 'border-destructive')}>
                <input id="consent" type="checkbox" checked={form.consent_terms} onChange={(e) => set('consent_terms', e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[#01696f]" />
                <label htmlFor="consent" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                  I confirm that all information provided is accurate and I agree to Mercorama&apos;s{' '}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
                </label>
              </div>
              {errors.consent_terms && <p className="text-xs text-destructive">{errors.consent_terms}</p>}

              {/* Revenue share note */}
              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
                Mercorama operates on a revenue share model. Specific collaboration terms will be confirmed during your onboarding call after your application is reviewed.
              </p>
            </div>
          )}

          {/* Navigation */}
          {apiError && <p className="text-sm text-destructive">{apiError}</p>}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={back} type="button" className="gap-1">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={next} type="button" className="ml-auto gap-1">
                Continue<ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="ml-auto gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
