// app/waitlist/page.tsx
// Public waitlist for Cohort 2+. Accessible from /beta when cohort is full.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const PROVINCES = [
  'Alberta (AB)', 'British Columbia (BC)', 'Manitoba (MB)',
  'New Brunswick (NB)', 'Newfoundland and Labrador (NL)',
  'Northwest Territories (NT)', 'Nova Scotia (NS)', 'Nunavut (NU)',
  'Ontario (ON)', 'Prince Edward Island (PE)', 'Quebec (QC)',
  'Saskatchewan (SK)', 'Yukon (YT)',
];

type FormState = {
  full_name:    string;
  email:        string;
  company_name: string;
  province:     string;
  how_heard:    string;
};

const EMPTY: FormState = {
  full_name: '', email: '', company_name: '', province: '', how_heard: '',
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const INTL_COUNTRIES = [
  'United States', 'United Kingdom', 'Australia', 'New Zealand', 'Ireland',
  'Germany', 'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Switzerland', 'Austria', 'Belgium', 'Spain', 'Portugal', 'Italy',
  'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'India', 'Brazil',
  'Mexico', 'Chile', 'Colombia', 'Argentina', 'South Africa', 'Nigeria',
  'Kenya', 'UAE', 'Saudi Arabia', 'Israel', 'Other',
];

export default function WaitlistPage() {
  const router = useRouter();
  const [form, setForm]         = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // International waitlist state
  const [intlEmail, setIntlEmail]     = useState('');
  const [intlCountry, setIntlCountry] = useState('');
  const [intlStatus, setIntlStatus]   = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const canSubmit =
    form.full_name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    isValidEmail(form.email) &&
    !submitting;

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name:    form.full_name.trim(),
          email:        form.email.trim(),
          company_name: form.company_name.trim() || undefined,
          province:     form.province || undefined,
          how_heard:    form.how_heard.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'validation_error') {
          setFieldErrors(data.fields ?? {});
        } else {
          setError(data.message ?? 'Something went wrong. Please try again.');
        }
        return;
      }

      router.push('/waitlist/confirmed');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIntlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!intlEmail.trim() || !intlCountry) return;
    setIntlStatus('submitting');
    try {
      await fetch('/api/international-waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:        intlEmail.trim(),
          country:      intlCountry,
          country_code: intlCountry,
          source:       'waitlist_form',
        }),
      });
      setIntlStatus('done');
    } catch {
      setIntlStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-16 md:py-24">

        {/* Headline */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Join the waitlist.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            We onboard Canadian SME exporters in cohorts.
            When the next cohort opens, you&apos;ll be the first to know —
            along with the founding pricing available to that cohort.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Mercorama is currently available to Canadian businesses only.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Full name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Jane Smith"
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Work email */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Work email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="jane@company.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          {/* Company name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Company name
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Acme Exports Inc."
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Country</label>
            <select
              disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            >
              <option>Canada</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently available to Canadian businesses only.
            </p>
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Province / Territory
            </label>
            <select
              value={form.province}
              onChange={(e) => set('province', e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select province or territory…</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* How heard */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              How did you hear about Mercorama?
            </label>
            <input
              type="text"
              value={form.how_heard}
              onChange={(e) => set('how_heard', e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Event, LinkedIn, referral, etc."
            />
          </div>

          {/* Server error */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full gap-2"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</>
            ) : (
              'Join the Waitlist →'
            )}
          </Button>

        </form>

        <p className="mt-6 text-xs text-center text-muted-foreground">
          Already applied?{' '}
          <Link href="/beta" className="underline hover:text-foreground">
            Go back to the application page
          </Link>
        </p>

        {/* ── International waitlist ───────────────────────────────────── */}
        <div className="mt-16 pt-10 border-t">
          <h2 className="text-lg font-semibold mb-1">Outside Canada?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;re expanding to new markets. Leave your email — we&apos;ll notify you
            when Mercorama launches in your region.
          </p>

          {intlStatus === 'done' ? (
            <p className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300 font-medium">
              You&apos;re on the list. We&apos;ll be in touch when we launch in your region.
            </p>
          ) : (
            <form onSubmit={handleIntlSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Country</label>
                <select
                  required
                  value={intlCountry}
                  onChange={(e) => setIntlCountry(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select your country…</option>
                  {INTL_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Work email</label>
                <input
                  type="email"
                  required
                  value={intlEmail}
                  onChange={(e) => setIntlEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {intlStatus === 'error' && (
                <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
              )}
              <Button
                type="submit"
                variant="outline"
                disabled={intlStatus === 'submitting' || !intlEmail.trim() || !intlCountry}
                className="w-full gap-2"
              >
                {intlStatus === 'submitting'
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : 'Notify Me →'}
              </Button>
            </form>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
