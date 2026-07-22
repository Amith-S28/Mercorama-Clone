// app/activate/page.tsx
// Accessed via /activate?code=XXX from acceptance email.
// Validates code → shows plan confirmation → redirects to Stripe Checkout.
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, LogIn } from 'lucide-react';

// ─── International geo-block screen ──────────────────────────────────────────

function GeoBlockScreen({ countryCode }: { countryCode: string }) {
  const [email, setEmail]     = useState('');
  const [country, setCountry] = useState(countryCode);
  const [status, setStatus]   = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    try {
      await fetch('/api/international-waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:        email.trim(),
          country_code: country,
          source:       'activate_geo_block',
        }),
      });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="max-w-md mx-auto text-center space-y-5 py-20 px-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <span className="text-2xl">🌍</span>
      </div>
      <h1 className="text-xl font-bold">Mercorama is currently available to Canadian businesses only.</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        We&apos;re expanding to new markets soon.
        Leave your email — we&apos;ll notify you when we launch in your region.
      </p>

      {status === 'done' ? (
        <p className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300 font-medium">
          You&apos;re on the list. We&apos;ll be in touch when we launch in your region.
        </p>
      ) : (
        <form onSubmit={handleNotify} className="space-y-3 text-left max-w-sm mx-auto">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country code (e.g. US)"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Work email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" disabled={status === 'submitting'} className="w-full gap-1.5">
            {status === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Notify Me →'}
          </Button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

const CONTACT_EMAIL = 'mailto:team@mercorama.com';

type ValidateResult =
  | { state: 'loading' }
  | { state: 'invalid_code' }
  | { state: 'expired_code' }
  | { state: 'used_code' }
  | { state: 'deactivated_code' }
  | {
      state: 'valid';
      email: string;
      cohort_number: number;
      selected_plan: string;
      founding_price: number;
      public_price: number;
      price_lock_months: number;
    };

function planLabel(plan: string) {
  return plan === 'growth' ? 'Growth' : 'Starter';
}

function ErrorCard({ title, body, cta }: { title: string; body: string; cta: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto text-center space-y-4 py-20 px-4">
      <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      {cta}
    </div>
  );
}

function ActivateInner() {
  const params  = useSearchParams();
  const code    = params.get('code') ?? '';
  const cancelled = params.get('cancelled') === '1';

  const [result, setResult]     = useState<ValidateResult>({ state: 'loading' });
  const [checking, setChecking] = useState(false);
  const [geoState, setGeoState] = useState<'checking' | 'CA' | 'non_CA'>('checking');
  const [countryCode, setCountryCode] = useState('');

  // Geo-check first
  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then((d: { country_code?: string }) => {
        const cc = d.country_code ?? 'CA';
        setCountryCode(cc);
        setGeoState(cc === 'CA' ? 'CA' : 'non_CA');
      })
      .catch(() => setGeoState('CA'));
  }, []);

  useEffect(() => {
    if (geoState !== 'CA') return;
    if (!code) { setResult({ state: 'invalid_code' }); return; }
    fetch(`/api/activate/validate?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error === 'invalid_code')      setResult({ state: 'invalid_code' });
        else if (data.error === 'expired_code') setResult({ state: 'expired_code' });
        else if (data.error === 'used_code')    setResult({ state: 'used_code' });
        else if (data.error === 'deactivated_code') setResult({ state: 'deactivated_code' });
        else setResult({ state: 'valid', ...data });
      })
      .catch(() => setResult({ state: 'invalid_code' }));
  }, [code, geoState]);

  async function handleConfirm() {
    setChecking(true);
    try {
      const res  = await fetch('/api/activate/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setChecking(false);
    }
  }

  if (geoState === 'checking' || (geoState === 'CA' && result.state === 'loading')) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (geoState === 'non_CA') {
    return <GeoBlockScreen countryCode={countryCode} />;
  }

  if (result.state === 'invalid_code') {
    return (
      <ErrorCard
        title="Invalid access code"
        body="This access code is invalid. Please check your email or contact us."
        cta={<a href={CONTACT_EMAIL} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF6100] hover:underline">Contact us →</a>}
      />
    );
  }

  if (result.state === 'expired_code') {
    return (
      <ErrorCard
        title="Access link expired"
        body="This access link has expired. Access codes are valid for 7 days. Reply to your acceptance email to request a new one."
        cta={<a href={CONTACT_EMAIL} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF6100] hover:underline">Contact us →</a>}
      />
    );
  }

  if (result.state === 'used_code') {
    return (
      <ErrorCard
        title="Access code already used"
        body="This access code has already been used. If you've already activated your account, log in here."
        cta={
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF6100] hover:underline">
            <LogIn className="h-4 w-4" /> Log in →
          </Link>
        }
      />
    );
  }

  if (result.state === 'deactivated_code') {
    return (
      <ErrorCard
        title="Access code deactivated"
        body="This access code has been deactivated. Please contact us."
        cta={<a href={CONTACT_EMAIL} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF6100] hover:underline">Contact us →</a>}
      />
    );
  }

  // ── Valid — plan confirmation screen ──────────────────────────────────────
  const { cohort_number, selected_plan, founding_price, public_price, price_lock_months } = result;
  const savings = public_price - founding_price;
  const annualSavings = savings * 12;

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
          Cohort {cohort_number} Activation
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to Mercorama Cohort {cohort_number}
        </h1>
        <p className="text-muted-foreground text-sm">You're activating:</p>
      </div>

      {/* Plan card */}
      <div className="rounded-xl border-2 border-[#FF6100]/40 bg-[#FF6100]/5 p-6 space-y-4">
        <div>
          <p className="text-lg font-bold">{planLabel(selected_plan)} Plan</p>
          <p className="text-3xl font-bold mt-1">
            ${founding_price}<span className="text-base font-normal text-muted-foreground">/mo CAD</span>
          </p>
        </div>

        <div className="text-sm space-y-1 text-muted-foreground">
          <p>Public price after launch: ${public_price} CAD/mo</p>
          <p className="text-green-700 dark:text-green-400 font-medium">
            Save ${savings}/mo · ${annualSavings}/yr
          </p>
          <p>Price locked for {price_lock_months} months minimum.</p>
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p>No contracts. Cancel anytime.</p>
          <p>Your founding rate never changes for at least {price_lock_months} months — regardless of platform growth.</p>
        </div>
      </div>

      {cancelled && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Payment was cancelled. No charge was made. You can try again below.
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={checking}
        className="w-full gap-2 bg-[#FF6100] hover:bg-[#e55800] text-white"
        size="lg"
      >
        {checking ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to payment…</>
        ) : (
          'Confirm and Pay →'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Questions? <a href={CONTACT_EMAIL} className="underline hover:text-foreground">Contact us</a>
      </p>

    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center">
        <Link href="/" className="text-sm font-semibold text-foreground">Mercorama</Link>
      </header>
      <Suspense fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <ActivateInner />
      </Suspense>
    </div>
  );
}
