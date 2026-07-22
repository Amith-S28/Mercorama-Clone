// app/fund-my-export/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign, ChevronRight, Loader2, AlertTriangle,
  ExternalLink, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getCacheKey, getCachedResults, setCachedResults } from '@/lib/fundMyExportCache';
import { getRunStatus } from '@/lib/fundMyExportRuns';
import type { FundingMatch, FundingMatchResult, FundingQuery } from '@/lib/fundMyExport';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec',
  'Saskatchewan', 'Yukon',
];

const SECTORS = [
  'Food & Beverage',
  'Agri-food & Seafood',
  'Clean Technology',
  'Advanced Manufacturing',
  'Creative & Media',
  'Technology & Software',
  'Life Sciences',
  'Other',
];

const REVENUE_OPTIONS = [
  { label: 'Under $500K', value: 250000 },
  { label: '$500K – $2M', value: 1000000 },
  { label: '$2M – $10M', value: 5000000 },
  { label: 'Over $10M', value: 15000000 },
];

interface FormValues {
  productDescription: string;
  targetCountry: string;
  province: string;
  sector: string;
  revenue: number | null;
  employees: number | null;
  firstExport: boolean;
  buyerType: 'Private Company' | 'Government / Public Sector' | 'Both';
  isTendering: boolean;
}

function nextMonthReset(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fitLabel(score: number): { label: string; className: string } {
  if (score >= 70) return { label: 'Strong Fit', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  if (score >= 50) return { label: 'Likely Eligible', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
  return { label: 'Check Eligibility', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ match }: { match: FundingMatch }) {
  const fit = fitLabel(match.match_score);

  function handleApply() {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.(
        'event', 'fund_my_export_applied', { program_name: match.program.name }
      );
    }
    window.open(match.program.website_url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{match.program.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {match.program.provider}
          </p>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', fit.className)}>
          {fit.label}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {match.ai_snippet}
      </p>

      {match.match_reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.match_reasons.map((r) => (
            <span key={r} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t gap-3">
        <span className="text-xs text-muted-foreground capitalize">
          {match.program.program_type}
        </span>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handleApply}>
          Apply Now
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border p-4 space-y-3 animate-pulse">
          <div className="flex justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Matching you to available programs...
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FundMyExportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [runsUsed, setRunsUsed] = useState(0);
  const [formValues, setFormValues] = useState<FormValues>({
    productDescription: '',
    targetCountry: '',
    province: '',
    sector: '',
    revenue: null,
    employees: null,
    firstExport: false,
    buyerType: 'Private Company',
    isTendering: false,
  });

  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'results' | 'limit' | 'empty'>('idle');
  const [results, setResults] = useState<FundingMatchResult | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // ─── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/pricing?msg=fund-my-export-growth-only');
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('users')
        .select('plan_tier')
        .eq('id', user.id)
        .maybeSingle();

      const tier = profile?.plan_tier ?? 'starter';
      setPlanTier(tier);

      if (tier !== 'growth') {
        router.push('/pricing?msg=fund-my-export-growth-only');
        return;
      }

      setAuthLoading(false);
      trackEvent('fund_my_export_viewed', { plan: 'growth', surface: 'standalone' });

      // Load run status
      try {
        const status = await getRunStatus(user.id);
        setRunsUsed(status.runs_used);
      } catch {
        // non-fatal
      }
    }
    void checkAuth();
  }, [router]);

  // ─── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    const query: FundingQuery = {
      sector: formValues.sector,
      destination_country: formValues.targetCountry,
      revenue_cad: formValues.revenue,
      employees: formValues.employees,
      export_value_usd: null,
      product_description: formValues.productDescription,
      has_fta: false,
    };

    // 1. Check cache
    const cacheKey = getCacheKey(query);
    const cached = await getCachedResults(cacheKey);
    if (cached) {
      setResults(cached);
      setFromCache(true);
      setSubmitState('results');
      trackEvent('fund_my_export_cache_hit', {
        sector: formValues.sector,
        province: formValues.province,
        targetMarket: formValues.targetCountry,
      });
      return;
    }

    // 2. Active submission — will count a run
    setFromCache(false);
    setSubmitState('loading');
    trackEvent('fund_my_export_searched', {
      sector: formValues.sector,
      province: formValues.province,
      targetMarket: formValues.targetCountry,
      runsRemaining: Math.max(0, 20 - runsUsed - 1),
    });

    try {
      const res = await fetch('/api/fund-my-export/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, passive: false }),
      });

      if (res.status === 429) {
        setSubmitState('limit');
        trackEvent('fund_my_export_limit_reached', { runsUsed: 20 });
        toast.warning(`Monthly limit reached — resets ${resetsOn}`, { duration: 8000 });
        return;
      }

      if (!res.ok) {
        setSubmitState('idle');
        toast.error('Something went wrong — please try again');
        return;
      }

      const data = await res.json() as FundingMatchResult;
      await setCachedResults(cacheKey, data);
      setResults(data);
      setRunsUsed((n) => n + 1);
      setSubmitState(data.matches.length > 0 ? 'results' : 'empty');

      if (data.matches.length > 0) {
        toast.success(
          `Found ${data.matches.length} programs — funding may be available for this market entry`,
          { duration: 5000 }
        );
      }
    } catch {
      setSubmitState('idle');
      toast.error('Request failed — please try again');
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const resetsOn = nextMonthReset();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Tools</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Fund My Export</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5">
          <DollarSign className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Canadian Export Funding</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Fund My Export</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Tell us about your export plan — we'll match you to every Canadian government grant, guarantee,
          and support program you qualify for right now.
        </p>
        {/* Run counter */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            <span className="font-semibold">{runsUsed} / 20</span> searches used this month
          </span>
          <span className="text-muted-foreground">· Resets {resetsOn}</span>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* ── Left: form ── */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Product description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">What are you exporting?</label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. Organic cold-pressed apple cider vinegar, 500ml bottles for health food retailers"
                    value={formValues.productDescription}
                    onChange={(e) => setFormValues((v) => ({ ...v, productDescription: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific — product type and format help us match sector-specific programs
                  </p>
                </div>

                {/* Target market */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Target market / country</label>
                  <Input
                    placeholder="e.g. Germany, Japan, United Kingdom"
                    value={formValues.targetCountry}
                    onChange={(e) => setFormValues((v) => ({ ...v, targetCountry: e.target.value }))}
                    required
                  />
                </div>

                {/* Province */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Your province</label>
                  <Select
                    value={formValues.province}
                    onValueChange={(val) => setFormValues((v) => ({ ...v, province: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province or territory" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sector */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Sector / Industry</label>
                  <Select
                    value={formValues.sector}
                    onValueChange={(val) => setFormValues((v) => ({ ...v, sector: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Revenue */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Approximate annual revenue</label>
                  <Select
                    onValueChange={(val) => setFormValues((v) => ({ ...v, revenue: Number(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select revenue range" />
                    </SelectTrigger>
                    <SelectContent>
                      {REVENUE_OPTIONS.map((o) => (
                        <SelectItem key={o.label} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employees */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Number of employees</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 25"
                    value={formValues.employees ?? ''}
                    onChange={(e) => setFormValues((v) => ({
                      ...v,
                      employees: e.target.value ? Number(e.target.value) : null,
                    }))}
                  />
                </div>

                {/* First export */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Is this your first export market?</p>
                  </div>
                  <div className="flex gap-2">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormValues((v) => ({ ...v, firstExport: opt === 'Yes' }))}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          (opt === 'Yes') === formValues.firstExport
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buyer type */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Target buyer type</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['Private Company', 'Government / Public Sector', 'Both'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormValues((v) => ({ ...v, buyerType: opt }))}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          formValues.buyerType === opt
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tendering */}
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={formValues.isTendering}
                    onChange={(e) => setFormValues((v) => ({ ...v, isTendering: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 accent-emerald-600"
                  />
                  <span className="text-sm">Are you tendering on a foreign contract?</span>
                </label>

                <Button
                  type="submit"
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                  disabled={submitState === 'loading' || !formValues.productDescription || !formValues.targetCountry}
                >
                  {submitState === 'loading' ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finding programs...</>
                  ) : (
                    'Find My Funding →'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: results ── */}
        <div className="lg:col-span-3">
          {/* Idle state */}
          {submitState === 'idle' && (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ready to find your funding</h3>
                <p className="text-sm text-muted-foreground">
                  Fill in your details to see matched funding programs →
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {submitState === 'loading' && <ResultSkeleton />}

          {/* Limit reached */}
          {submitState === 'limit' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-6 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    You've used all 20 Fund My Export searches this month.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Resets on {resetsOn}
                  </p>
                </div>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                In the meantime, the Trade Commissioner Service offers free advisory to all Canadian exporters:
              </p>
              <a
                href="https://www.tradecommissioner.gc.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 hover:underline"
              >
                Contact TCS
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Empty results */}
          {submitState === 'empty' && (
            <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
              <p className="text-muted-foreground">
                No exact program matches for your profile right now.
              </p>
              <p className="text-sm text-muted-foreground">
                But TCS Advisory is always free. Contact your nearest Trade Commissioner.
              </p>
              <a
                href="https://www.tradecommissioner.gc.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Contact TCS →
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Results */}
          {submitState === 'results' && results && (
            <div className="space-y-4">
              {/* Summary banner */}
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                    {results.matches.length} funding programs matched to your profile
                  </p>
                  {fromCache && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Results from cache
                    </p>
                  )}
                </div>
                <DollarSign className="h-6 w-6 text-emerald-600 shrink-0" />
              </div>

              {results.matches.map((match) => (
                <ResultCard key={match.program.id} match={match} />
              ))}

              <div className="rounded-xl bg-muted/40 border p-5 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Not sure where to start? The Trade Commissioner Service offers free advisory to all Canadian exporters.
                </p>
                <a
                  href="https://www.tradecommissioner.gc.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Contact TCS →
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
