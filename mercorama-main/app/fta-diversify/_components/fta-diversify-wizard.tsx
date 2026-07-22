// app/fta-diversify/_components/fta-diversify-wizard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Globe, Loader2, ChevronRight, ArrowLeft, Download, Mail, Send,
  TrendingUp, CheckCircle2, AlertTriangle, Compass, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  createFtaSession, updateFtaSession, type FtaDiversifySession, type FtaMarketSummary,
} from '@/lib/fta-diversify';
import { checkFtaLimit, incrementFtaUsage, getFtaUsage } from '@/lib/fta-usage';
import { FundMyExportPanel } from '@/components/FundMyExportPanel';
import { supabase as supabaseClient } from '@/lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec',
  'Saskatchewan', 'Yukon',
];

const MARKET_OPTIONS = ['US', 'EU', 'UK', 'Asia-Pacific', 'Latin America', 'Middle East', 'Other'];

const STEPS = [
  { n: 1, label: 'Company & Product' },
  { n: 2, label: 'FTA Markets' },
  { n: 3, label: 'Market Report' },
] as const;

// ─── FTA region colour map ─────────────────────────────────────────────────────

const FTA_STYLE: Record<string, { bg: string; text: string }> = {
  CETA:   { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-800 dark:text-blue-300' },
  CPTPP:  { bg: 'bg-teal-100 dark:bg-teal-900/30',   text: 'text-teal-800 dark:text-teal-300' },
  EFTA:   { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-800 dark:text-violet-300' },
  CKFTA:  { bg: 'bg-rose-100 dark:bg-rose-900/30',    text: 'text-rose-800 dark:text-rose-300' },
  CUSMA:  { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-800 dark:text-amber-300' },
};

function ftaChipStyle(ftaName: string) {
  const key = Object.keys(FTA_STYLE).find((k) => ftaName.toUpperCase().includes(k)) ?? '';
  return FTA_STYLE[key] ?? { bg: 'bg-muted', text: 'text-muted-foreground' };
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, idx) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors',
              current === s.n
                ? 'bg-primary text-primary-foreground border-primary'
                : current > s.n
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-muted text-muted-foreground border-border'
            )}>
              {current > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span className={cn(
              'text-sm font-medium hidden sm:block',
              current === s.n ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn(
              'h-px flex-1 mx-2 transition-colors',
              current > s.n ? 'bg-primary/40' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 Schema ────────────────────────────────────────────────────────────

const step1Schema = z.object({
  companyName:        z.string().optional(),
  province:           z.string().optional(),
  sector:             z.string().optional(),
  productDescription: z.string().min(10, 'Please describe your product (at least 10 characters).'),
  hsCode:             z.string().optional(),
  objective:          z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  onSuccess,
}: {
  onSuccess: (session: FtaDiversifySession, markets: FtaMarketSummary[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  // Deferred to client only — avoids SSR/client localStorage hydration mismatch
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number | null } | null>(null);
  useEffect(() => { setUsageInfo(getFtaUsage()); }, []);

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: '', province: '', sector: '',
      productDescription: '', hsCode: '', objective: '',
    },
  });

  function toggleMarket(m: string) {
    setSelectedMarkets((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  async function onSubmit(values: Step1Values) {
    // Client-side usage check
    const { allowed, usage } = checkFtaLimit();
    if (!allowed) {
      toast.error(
        `You've reached your FTA Diversify limit for this month (${usage.used}/${usage.limit} analyses used).`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/fta-diversify/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            name: values.companyName || null,
            province: values.province || null,
            sector: values.sector || null,
            currentMarkets: selectedMarkets,
          },
          product: {
            description: values.productDescription,
            hsCode: values.hsCode || null,
          },
          objective: values.objective || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      incrementFtaUsage();

      const session = await createFtaSession({
        companyName: values.companyName || undefined,
        province: values.province || undefined,
        sector: values.sector || undefined,
        currentMarkets: selectedMarkets,
        productDescription: values.productDescription,
        hsCode: values.hsCode || undefined,
        objective: values.objective || undefined,
        suggestedMarkets: data.markets,
      });

      onSuccess(session, data.markets);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Tell us about your company and product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Exports Inc." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CANADIAN_PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector / Industry <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Food & Beverage, Advanced Manufacturing, Clean Tech" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Current export markets */}
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Current export markets</p>
                <p className="text-xs text-muted-foreground">We'll exclude these from suggestions.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {MARKET_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMarket(m)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        selectedMarkets.includes(m)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="productDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Organic cold-pressed apple cider vinegar, 500 ml bottles, sold to health food retailers and grocery chains."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Be specific — product type, format, and target buyer help produce better market matches.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="hsCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HS Code <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2209.00" {...field} />
                      </FormControl>
                      <FormDescription>Improves tariff accuracy. Use HS Code Assistant to find it.</FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objective <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Find 2–3 EU countries where our bottled beverage could grow under CETA."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {usageInfo && usageInfo.limit !== null && (
                <p className="text-xs text-muted-foreground">
                  {usageInfo.used} / {usageInfo.limit} analyses used this month.
                </p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing FTAs and markets…
                  </>
                ) : (
                  <>
                    Find FTA Markets
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Market card ──────────────────────────────────────────────────────────────

function MarketCard({
  market,
  selected,
  onToggle,
}: {
  market: FtaMarketSummary;
  selected: boolean;
  onToggle: () => void;
}) {
  const chip = ftaChipStyle(market.ftaName);

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer',
        selected ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/40'
      )}
      onClick={onToggle}
    >
      <CardContent className="pt-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold">{market.country}</h3>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', chip.bg, chip.text)}>
                {market.ftaName}
              </span>
              {market.regionCode && market.regionCode !== market.ftaName && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {market.regionCode}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{market.rationale}</p>
          </div>
          <div className={cn(
            'mt-1 h-5 w-5 shrink-0 rounded-full border-2 transition-colors flex items-center justify-center',
            selected ? 'bg-primary border-primary' : 'border-border'
          )}>
            {selected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
          </div>
        </div>

        {/* Tariff insight */}
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-green-800 dark:text-green-300">
              Tariff advantage: {market.tariffNote}
            </p>
            {(market as Record<string, unknown>).tariffInsight && (
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                ((market as Record<string, unknown>).tariffInsight as Record<string, string>)?.advantageLevel === 'high' ? 'bg-green-200 text-green-800' :
                ((market as Record<string, unknown>).tariffInsight as Record<string, string>)?.advantageLevel === 'low' ? 'bg-amber-200 text-amber-800' :
                'bg-blue-200 text-blue-800'
              )}>
                {((market as Record<string, unknown>).tariffInsight as Record<string, string>)?.advantageLevel ?? ''} advantage
              </span>
            )}
          </div>
          {(market as Record<string, unknown>).tariffInsight && (
            <p className="text-[11px] text-green-700/80 dark:text-green-400/80">
              {((market as Record<string, unknown>).tariffInsight as Record<string, string>)?.savingsInsight}
            </p>
          )}
        </div>

        {/* Eligibility */}
        {(market as Record<string, unknown>).eligibility && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Eligibility & Rules of Origin</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                ((market as Record<string, unknown>).eligibility as Record<string, string>)?.readinessLevel === 'easy' ? 'bg-green-200 text-green-800' :
                ((market as Record<string, unknown>).eligibility as Record<string, string>)?.readinessLevel === 'complex' ? 'bg-red-200 text-red-800' :
                'bg-amber-200 text-amber-800'
              )}>
                {((market as Record<string, unknown>).eligibility as Record<string, string>)?.readinessLevel}
              </span>
            </div>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80">
              {((market as Record<string, unknown>).eligibility as Record<string, string>)?.rulesOfOriginNote}
            </p>
          </div>
        )}

        {/* Market fit */}
        {(market as Record<string, unknown>).marketFit && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Best for: <span className="font-medium text-foreground">{((market as Record<string, unknown>).marketFit as Record<string, string>)?.bestFor}</span></span>
            <span>Entry: <span className="font-medium text-foreground">{((market as Record<string, unknown>).marketFit as Record<string, string>)?.entryDifficulty}</span></span>
            <span>Time: <span className="font-medium text-foreground">{((market as Record<string, unknown>).marketFit as Record<string, string>)?.timeToMarket}</span></span>
          </div>
        )}

        {/* Decision note */}
        {(market as Record<string, unknown>).decisionNote && (
          <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
            <p className="text-xs font-semibold text-primary">{(market as Record<string, unknown>).decisionNote as string}</p>
          </div>
        )}

        {/* Market snapshot */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market snapshot</p>
          <ul className="space-y-1.5">
            {market.marketSnapshot?.marketSizeNote && (
              <li className="flex items-start gap-2 text-xs text-foreground/80">
                <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                {market.marketSnapshot.marketSizeNote}
              </li>
            )}
            {market.marketSnapshot?.outlookNote && (
              <li className="flex items-start gap-2 text-xs text-foreground/80">
                <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                {market.marketSnapshot.outlookNote}
              </li>
            )}
          </ul>
          {(market.marketSnapshot?.keySegments?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {market.marketSnapshot.keySegments.map((seg, i) => (
                <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {seg}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Risk flags */}
        {(market.riskFlags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(market.riskFlags ?? []).map((flag, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs text-amber-800 dark:text-amber-300"
              >
                <AlertTriangle className="h-3 w-3" />
                {flag}
              </span>
            ))}
          </div>
        )}

        {/* Handoff CTAs */}
        <div className="flex gap-2 pt-2 border-t">
          <a
            href={`/dashboard?tool=export-compass&from=fta&country=${encodeURIComponent(market.country)}`}
            onClick={() => { import('@/lib/workflow').then(({ setWorkflow }) => setWorkflow({ selectedMarket: market.country, ftaMarkets: [market.country], source: 'fta' })); }}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
              <Compass className="h-3 w-3" />Analyze in Export Compass
            </Button>
          </a>
          <a
            href={`/dashboard?tool=deal-wizard&from=fta&country=${encodeURIComponent(market.country)}`}
            onClick={() => { import('@/lib/workflow').then(({ setWorkflow }) => setWorkflow({ selectedMarket: market.country, source: 'fta' })); }}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
              <Briefcase className="h-3 w-3" />Build Deal
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  session,
  markets,
  onContinue,
  onBack,
}: {
  session: FtaDiversifySession;
  markets: FtaMarketSummary[];
  onContinue: (selected: FtaMarketSummary[]) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(markets.map((_, i) => i))
  );

  function toggleIndex(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const selectedMarkets = markets.filter((_, i) => selected.has(i));

  return (
    <div>
      {/* Banner */}
      <div className="mb-8 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/3 px-6 py-5">
        <div className="flex items-start gap-3">
          <Globe className="h-6 w-6 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="text-lg font-bold">
              {markets.length} FTA-backed market{markets.length !== 1 ? 's' : ''} identified for your product
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These markets offer tariff advantages under Canada's trade agreements.
              Select the ones to include in your Market Report.
            </p>
          </div>
        </div>
      </div>

      {/* Market cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {markets.map((market, i) => (
          <MarketCard
            key={`${market.country}-${i}`}
            market={market}
            selected={selected.has(i)}
            onToggle={() => toggleIndex(i)}
          />
        ))}
      </div>

      {/* Comparison table — shows when 2+ markets selected */}
      {selected.size >= 2 && (
        <div className="mt-6 rounded-xl border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-semibold">Factor</th>
                {markets.filter((_, i) => selected.has(i)).map((m, i) => (
                  <th key={i} className="text-left px-3 py-2 font-semibold">{m.country}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium text-muted-foreground">FTA</td>
                {markets.filter((_, i) => selected.has(i)).map((m, i) => <td key={i} className="px-3 py-2">{m.ftaName}</td>)}
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium text-muted-foreground">Tariff Advantage</td>
                {markets.filter((_, i) => selected.has(i)).map((m, i) => (
                  <td key={i} className="px-3 py-2">
                    {(m as Record<string, unknown>).tariffInsight
                      ? ((m as Record<string, unknown>).tariffInsight as Record<string, string>)?.advantageLevel ?? '—'
                      : m.tariffNote?.slice(0, 40) ?? '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium text-muted-foreground">Entry Difficulty</td>
                {markets.filter((_, i) => selected.has(i)).map((m, i) => (
                  <td key={i} className="px-3 py-2">{((m as Record<string, unknown>).marketFit as Record<string, string>)?.entryDifficulty ?? '—'}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium text-muted-foreground">Time to Market</td>
                {markets.filter((_, i) => selected.has(i)).map((m, i) => (
                  <td key={i} className="px-3 py-2">{((m as Record<string, unknown>).marketFit as Record<string, string>)?.timeToMarket ?? '—'}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium text-muted-foreground">Readiness</td>
                {markets.filter((_, i) => selected.has(i)).map((m, i) => (
                  <td key={i} className="px-3 py-2">{((m as Record<string, unknown>).eligibility as Record<string, string>)?.readinessLevel ?? '—'}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-muted-foreground">Risks</td>
                {markets.filter((_, i) => selected.has(i)).map((m, i) => (
                  <td key={i} className="px-3 py-2">{m.riskFlags?.length ?? 0} flag{(m.riskFlags?.length ?? 0) !== 1 ? 's' : ''}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-3">
          <p className="text-xs text-muted-foreground self-center">
            {selected.size} market{selected.size !== 1 ? 's' : ''} selected
          </p>
          <Button
            disabled={selected.size === 0}
            onClick={() => onContinue(selectedMarkets)}
            className="gap-2"
          >
            Generate Market Report
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Report HTML builder ──────────────────────────────────────────────────────

function buildReportHtml(session: FtaDiversifySession, markets: FtaMarketSummary[]): string {
  const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'long' });
  const productTitle = session.sector
    ? `${session.productDescription.slice(0, 60)} — ${session.sector}`
    : session.productDescription.slice(0, 80);

  const marketSections = markets
    .map(
      (m) => `
    <section class="market">
      <div class="market-header">
        <h2>${m.country} <span class="fta-badge">${m.ftaName}</span></h2>
        <div class="region">${m.regionCode}</div>
      </div>
      <div class="tariff-box">
        <strong>Tariff advantage:</strong> ${m.tariffNote}
      </div>
      <h3>Why this market</h3>
      <p>${m.rationale}</p>
      <h3>Market snapshot</h3>
      <table>
        <tr><td><strong>Market size</strong></td><td>${m.marketSnapshot.marketSizeNote}</td></tr>
        <tr><td><strong>Key segments</strong></td><td>${m.marketSnapshot.keySegments.join(', ')}</td></tr>
        <tr><td><strong>Demographics</strong></td><td>${m.marketSnapshot.demographicsNote}</td></tr>
        <tr><td><strong>Spending trends</strong></td><td>${m.marketSnapshot.spendingNote}</td></tr>
        <tr><td><strong>Outlook</strong></td><td>${m.marketSnapshot.outlookNote}</td></tr>
      </table>
      ${
        m.riskFlags.length > 0
          ? `<h3>Risk flags</h3><ul>${m.riskFlags.map((f) => `<li>${f}</li>`).join('')}</ul>`
          : ''
      }
    </section>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FTA Diversification Report — Mercorama</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; max-width: 800px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.85rem; margin-bottom: 2rem; }
    .market { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
    .market-header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1rem; }
    .market-header h2 { margin: 0; font-size: 1.2rem; }
    .fta-badge { background: #dbeafe; color: #1e40af; font-size: 0.75rem; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
    .region { color: #888; font-size: 0.8rem; }
    .tariff-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 0.9rem; color: #166534; }
    h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin: 1.25rem 0 0.5rem; }
    p { font-size: 0.95rem; line-height: 1.6; margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    td:first-child { width: 140px; color: #555; }
    ul { margin: 0; padding-left: 1.25rem; }
    li { font-size: 0.9rem; line-height: 1.7; color: #b45309; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <h1>FTA Diversification Report</h1>
  <p class="meta">
    ${session.companyName ? `<strong>${session.companyName}</strong> · ` : ''}
    ${session.productDescription.slice(0, 100)}
    ${session.hsCode ? ` · HS ${session.hsCode}` : ''}
    <br>Generated by Mercorama · ${date}
  </p>
  ${marketSections}
  <footer>Generated by Mercorama — mercorama.com · This report is for informational purposes only. Verify tariff rates with a licensed customs broker before acting on this information.</footer>
</body>
</html>`;
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({
  session,
  markets,
  onBack,
}: {
  session: FtaDiversifySession;
  markets: FtaMarketSummary[];
  onBack: () => void;
}) {
  const [step3Usage, setStep3Usage] = useState<{ used: number; limit: number | null } | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [isGrowthPlan, setIsGrowthPlan] = useState(false);

  useEffect(() => {
    setStep3Usage(getFtaUsage());
    supabaseClient.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabaseClient
        .from('users')
        .select('plan_tier')
        .eq('id', data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => { if (profile?.plan_tier === 'growth') setIsGrowthPlan(true); });
    });
  }, []);

  const reportHtml = buildReportHtml(session, markets);

  async function handleEmailPdf() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/fta-diversify/email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), session, markets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send email');
      setSent(true);
      toast.success(`Report sent to ${email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send email. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleDownloadHtml() {
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mercorama-fta-report-${session.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Left: report preview */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              FTA Diversification Report Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              srcDoc={reportHtml}
              className="w-full rounded-md border bg-white"
              style={{ height: '600px', border: 'none' }}
              title="FTA Diversification Report"
              sandbox="allow-same-origin"
            />
          </CardContent>
        </Card>
      </div>

      {/* Right: actions */}
      <div className="lg:col-span-2 space-y-4">

        {/* Fund My Export panel */}
        <FundMyExportPanel
          context={{
            sector: session.sector ?? '',
            targetMarket: markets[0]?.country ?? '',
            productDescription: session.productDescription,
          }}
          isGrowthPlan={isGrowthPlan}
        />

        {/* Email PDF card */}
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
                <Mail className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              </div>
              <CardTitle className="text-sm">Email PDF Report</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receive a branded PDF with market snapshots, tariff notes, and risk flags — straight to your inbox.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sent ? (
              <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Report sent! Check your inbox.
                </p>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEmailPdf(); }}
                  placeholder="your@email.com"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                  className="w-full gap-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700"
                  onClick={handleEmailPdf}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating & sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send PDF Report
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Markets summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Markets in this report</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {markets.map((m, i) => {
                const chip = ftaChipStyle(m.ftaName);
                return (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{m.country}</span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', chip.bg, chip.text)}>
                      {m.ftaName}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Usage */}
        {step3Usage && step3Usage.limit !== null && (
          <p className="text-xs text-muted-foreground text-right">
            {step3Usage.used} / {step3Usage.limit} FTA analyses used this month.
          </p>
        )}

        {/* Secondary: download HTML */}
        <button
          type="button"
          onClick={handleDownloadHtml}
          className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <Download className="h-3.5 w-3.5" />
          Download as HTML instead
        </button>

        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to markets
        </Button>
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function FtaDiversifyWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [session, setSession] = useState<FtaDiversifySession | null>(null);
  const [allMarkets, setAllMarkets] = useState<FtaMarketSummary[]>([]);
  const [reportMarkets, setReportMarkets] = useState<FtaMarketSummary[]>([]);

  return (
    <div>
      <Stepper current={step} />

      {step === 1 && (
        <Step1
          onSuccess={(sess, markets) => {
            setSession(sess);
            setAllMarkets(markets);
            setStep(2);
          }}
        />
      )}

      {step === 2 && session && (
        <Step2
          session={session}
          markets={allMarkets}
          onContinue={(selected) => {
            setReportMarkets(selected);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && session && (
        <Step3
          session={session}
          markets={reportMarkets}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
