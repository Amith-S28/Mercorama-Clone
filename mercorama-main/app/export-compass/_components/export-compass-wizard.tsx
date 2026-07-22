// app/export-compass/_components/export-compass-wizard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, Loader2, Search, ChevronDown, ArrowRight,
  Send, Mail, Briefcase, TrendingUp, Globe, AlertTriangle,
  CheckCircle2, Info, Bookmark, BookmarkCheck, X, BarChart3, Sparkles, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast }  from 'sonner';
import { cn }     from '@/lib/utils';
import {
  createCompassSession,
  getFlag,
  type ExportCompassSession,
  type MarketIntelligenceCard,
  type MarketScores,
} from '@/lib/export-compass';
import { FreshnessBadge, SourceTagPill } from '@/components/ui/FreshnessBadge';
import { DataFlag }                       from '@/components/ui/DataFlag';
import { checkCompassLimit, incrementCompassUsage, getCompassUsage } from '@/lib/export-compass-usage';
import { FundMyExportPanel }              from '@/components/FundMyExportPanel';
import { supabase as supabaseClient }     from '@/lib/supabase';
import type { ShortlistedMarketPayload }  from '@/app/api/export-compass/prioritise/route';
import {
  TopRecommendation, WeightControls, ScoreExplainability,
  EnhancedComparisonTable, DealHandoffButton, getDecisionLabel,
  computeWeightedScore, DEFAULT_WEIGHTS, type WeightConfig,
} from './compass-enhancements';

// ─── Stage machine ────────────────────────────────────────────────────────────

type Stage = 'browse' | 'compare' | 'answer';

// ─── Score colour helpers ─────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return 'text-green-700 dark:text-green-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 70) return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
  if (score >= 50) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
  return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
}

function scoreBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

// ─── Market archetype ─────────────────────────────────────────────────────────

function getArchetype(score: number): { label: string; className: string } {
  if (score >= 75) return {
    label: 'Champion',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };
  if (score >= 60) return {
    label: 'Established',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  if (score >= 45) return {
    label: 'Emerging',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  };
  return {
    label: 'Watch & Wait',
    className: 'bg-muted text-muted-foreground',
  };
}

// ─── Sub-score breakdown ──────────────────────────────────────────────────────

const SCORE_META: { key: keyof MarketScores; label: string; weight: string }[] = [
  { key: 'demand',          label: 'Demand',          weight: '30%' },
  { key: 'growth',          label: 'Growth',          weight: '20%' },
  { key: 'canadaAdvantage', label: 'Canada Advantage', weight: '20%' },
  { key: 'marketAccess',    label: 'Market Access',   weight: '15%' },
  { key: 'logistics',       label: 'Logistics',       weight: '10%' },
  { key: 'risk',            label: 'Risk',            weight: '5%'  },
];

function ScoreBreakdown({ scores }: { scores: MarketScores }) {
  return (
    <div className="space-y-2 pt-2">
      {SCORE_META.map(({ key, label, weight }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-32 text-xs text-muted-foreground shrink-0">
            {label} <span className="text-muted-foreground/60">({weight})</span>
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', scoreBarColor(scores[key]))}
              style={{ width: `${scores[key]}%` }}
            />
          </div>
          <span className={cn('text-xs font-semibold w-8 text-right tabular-nums', scoreColor(scores[key]))}>
            {scores[key]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stage indicator ──────────────────────────────────────────────────────────

function StageIndicator({ stage }: { stage: Stage }) {
  const stages = [
    { id: 'browse',  label: 'Browse markets'  },
    { id: 'compare', label: 'Compare shortlist' },
    { id: 'answer',  label: 'Get recommendation' },
  ] as const;

  return (
    <div className="flex items-center gap-2 text-xs mb-6">
      {stages.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors',
            stage === s.id
              ? 'bg-primary text-primary-foreground'
              : stages.findIndex(x => x.id === stage) > i
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-muted text-muted-foreground'
          )}>
            <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold
              bg-white/20 dark:bg-black/20">
              {stages.findIndex(x => x.id === stage) > i ? '✓' : i + 1}
            </span>
            {s.label}
          </div>
          {i < stages.length - 1 && (
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Market Intelligence Card ─────────────────────────────────────────────────

function MarketCard({
  market,
  rank,
  featured = false,
  productDescription,
  hsCode,
  isShortlisted,
  onToggleShortlist,
  mode = 'browse',
}: {
  market:            MarketIntelligenceCard;
  rank:              number;
  featured?:         boolean;
  productDescription: string;
  hsCode?:           string | null;
  isShortlisted:     boolean;
  onToggleShortlist: (country: string) => void;
  mode?:             'browse' | 'compare';
}) {
  const [expanded, setExpanded]     = useState(mode === 'compare');
  const [showScores, setShowScores] = useState(false);
  const flag     = getFlag(market.country);
  const archetype = getArchetype(market.exportScore);

  const profileHref = hsCode
    ? `/export-compass/profile?hs=${encodeURIComponent(hsCode)}&country=${encodeURIComponent(market.country)}&product=${encodeURIComponent(productDescription)}&back=/export-compass`
    : null;

  return (
    <Card className={cn(
      'relative transition-all',
      isShortlisted && 'ring-2 ring-primary border-primary',
      featured && rank === 1 && !isShortlisted && 'border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800 shadow-sm',
      featured && rank !== 1 && !isShortlisted && 'border-primary/30 shadow-sm',
    )}>
      {rank === 1 && featured && mode === 'browse' && (
        <div className="absolute -top-3 left-4">
          <span className="rounded-full bg-green-600 px-3 py-0.5 text-xs font-bold text-white">
            🏆 Top Pick
          </span>
        </div>
      )}

      <CardContent className={cn('pt-5 space-y-4', featured ? 'p-5 sm:p-6' : 'p-4')}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-2xl', featured ? 'text-3xl' : '')}>{flag}</span>
            <div>
              <h3 className={cn('font-bold leading-tight', featured ? 'text-lg' : 'text-base')}>
                {market.country}
              </h3>
              <p className="text-xs text-muted-foreground">{market.regionCode}</p>
            </div>
            {/* Archetype badge */}
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', archetype.className)}>
              {archetype.label}
            </span>
            {market.ftaAvailable && market.ftaName && (
              <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2.5 py-0.5 text-xs font-semibold">
                {market.ftaName}
              </span>
            )}
          </div>
          {/* Export Score */}
          <div className={cn(
            'flex flex-col items-center justify-center rounded-xl border px-3 py-1.5 shrink-0',
            scoreBg(market.exportScore)
          )}>
            <span className={cn('text-xl font-bold tabular-nums leading-none', scoreColor(market.exportScore))}>
              {market.exportScore}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Export Score</span>
          </div>
        </div>

        {/* Key sub-scores strip (always visible) */}
        <div className="flex gap-3 flex-wrap">
          {(['demand', 'marketAccess', 'risk'] as const).map((key) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground capitalize">{key === 'marketAccess' ? 'Access' : key}</span>
              <span className={cn('text-xs font-bold tabular-nums', scoreColor(market.scores[key]))}>
                {market.scores[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Trade stats grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Market size', value: market.importValueUSD,    field: 'importValueUSD',    sourceTag: market.dataSources?.tradeStats ?? 'Estimated' },
            { label: '5Y growth',   value: market.importGrowth5y,    field: 'importGrowth5y',    sourceTag: market.dataSources?.tradeStats ?? 'Estimated' },
            { label: 'CA share',    value: market.canadaExportShare,  field: 'canadaExportShare', sourceTag: market.dataSources?.canadaShare ?? 'Estimated' },
            { label: 'Tariff',      value: market.tariffRate,         field: 'tariffRate',        sourceTag: market.dataSources?.tariffData ?? 'Estimated' },
          ].map(({ label, value, field, sourceTag }) => (
            <div key={label} className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm font-semibold">{value}</p>
                <DataFlag tableName="export_compass_results" recordId={market.country} fieldLabel={`${label}: ${value}`} />
              </div>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <SourceTagPill tag={sourceTag as import('@/lib/export-compass').SourceTag} />
              </div>
            </div>
          ))}
        </div>

        {/* Freshness indicator */}
        {market.dataSources && (
          <div className="flex items-center gap-2">
            <FreshnessBadge
              confidenceLevel={market.dataSources.confidenceLevel}
              sourceTag={market.dataSources.tradeStats}
              lastVerifiedAt={market.dataSources.lastVerifiedAt}
            />
            <span className="text-[10px] text-muted-foreground">Data freshness</span>
          </div>
        )}

        {/* Competitors */}
        {market.topCompetitors.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Competitors:</span>
            {market.topCompetitors.map((c) => (
              <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{c}</span>
            ))}
          </div>
        )}

        {/* AI Insight */}
        <div>
          <p className={cn('text-sm leading-relaxed text-muted-foreground', !expanded && 'line-clamp-3')}>
            {market.insight}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        </div>

        {/* Sub-scores (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowScores((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showScores && 'rotate-180')} />
            Score breakdown
          </button>
          {showScores && <ScoreBreakdown scores={market.scores} />}
        </div>

        {/* Explainability */}
        <ScoreExplainability market={market} />

        {/* Decision label */}
        {(() => {
          const dl = getDecisionLabel(market.scores);
          return (
            <div className="flex items-center gap-2 pt-1">
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', dl.className)}>{dl.label}</span>
            </div>
          );
        })()}

        {/* CTAs */}
        <div className="border-t pt-3 space-y-2">
          {mode === 'browse' ? (
            <>
              {/* Shortlist toggle — primary CTA in browse mode */}
              <button
                type="button"
                onClick={() => onToggleShortlist(market.country)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  isShortlisted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-input bg-background hover:bg-muted text-foreground'
                )}
              >
                {isShortlisted ? (
                  <><BookmarkCheck className="h-4 w-4" />Shortlisted</>
                ) : (
                  <><Bookmark className="h-4 w-4" />Add to shortlist</>
                )}
              </button>
              {profileHref && (
                <Link href={profileHref}>
                  <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    View Full Profile
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              {/* Compare mode: remove + view profile + deal */}
              <button
                type="button"
                onClick={() => onToggleShortlist(market.country)}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove from shortlist
              </button>
              {profileHref && (
                <Link href={profileHref}>
                  <Button variant="default" size="sm" className="gap-1.5 w-full text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    View Full Profile
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                </Link>
              )}
              <a
                href={`/dashboard?tool=deal-wizard&from=compass&country=${encodeURIComponent(market.country)}`}
                onClick={() => { import('@/lib/workflow').then(({ setWorkflow }) => setWorkflow({ selectedMarket: market.country, source: 'compass' })); }}
              >
                <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs">
                  <Briefcase className="h-3.5 w-3.5" />
                  Build Export Deal for {market.country}
                </Button>
              </a>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Score explanation strip ──────────────────────────────────────────────────

const SCORE_DESCRIPTIONS: Record<keyof MarketScores, string> = {
  demand:          'Size and receptiveness of the import market',
  growth:          'Five-year import growth trajectory',
  canadaAdvantage: "Canada's existing competitiveness in this market",
  marketAccess:    'Tariff environment and FTA availability',
  logistics:       'Distance, shipping complexity, infrastructure',
  risk:            'Regulatory, political, and currency risk',
};

function ScoreExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-3 mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          How the Export Score works
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-3 space-y-1.5">
          {SCORE_META.map(({ key, label, weight }) => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="w-8 text-right text-xs font-bold text-primary">{weight}</span>
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{SCORE_DESCRIPTIONS[key]}</span>
            </div>
          ))}
          <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
            Scores are AI-generated estimates based on publicly known trade patterns.
            Always verify with your trade advisor before making investment decisions.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Input form ───────────────────────────────────────────────────────────────

function InputForm({
  initialProduct,
  initialHsCode,
  onSubmit,
}: {
  initialProduct: string;
  initialHsCode:  string;
  onSubmit: (product: string, hsCode: string) => void;
}) {
  const [product, setProduct]       = useState(initialProduct);
  const [hsCode, setHsCode]         = useState(initialHsCode);
  const [usageInfo, setUsageInfo]   = useState<{ used: number; limit: number | null } | null>(null);

  useEffect(() => { setUsageInfo(getCompassUsage()); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim()) return;
    onSubmit(product.trim(), hsCode.trim());
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Find your top export markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Product description <span className="text-red-500">*</span>
              </label>
              <Input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. Rolled oats, maple syrup, industrial pumps, softwood lumber…"
                className="h-10"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Be specific — product type, format, and end-use improve market matching.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  HS Code <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  placeholder="e.g. 1904.10"
                  className="h-10"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Improves tariff accuracy.{' '}
                  <Link href="/dashboard?tool=hs-code-assistant" className="text-primary hover:underline">
                    Find it →
                  </Link>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Origin country</label>
                <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                  🇨🇦 Canada (pre-set)
                </div>
              </div>
            </div>

            {usageInfo && usageInfo.limit !== null && (
              <p className="text-xs text-muted-foreground">
                {usageInfo.used} / {usageInfo.limit} analyses used this month.
              </p>
            )}

            <Button type="submit" className="w-full gap-2">
              <Search className="h-4 w-4" />
              Analyze export markets
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Feature preview */}
      <div className="mt-6 rounded-xl border bg-muted/20 p-5">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          What you'll receive
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            'Top 10 global markets, ranked by Export Score',
            'AI-generated market snapshots with trade signals',
            '6-factor weighted scoring (demand, growth, FTA access…)',
            'Shortlist & compare your preferred markets',
            'AI recommendation: which market to enter first',
            'Deep Market Profile for each market',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Loading view ─────────────────────────────────────────────────────────────

function LoadingView({ product }: { product: string }) {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="flex justify-center mb-6">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Compass className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2">Analyzing global markets…</h2>
      <p className="text-muted-foreground">
        Finding the top export destinations for{' '}
        <span className="font-medium text-foreground">{product}</span>
      </p>
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        {['Scanning 50+ import markets', 'Applying FTA advantage filters', 'Computing Export Scores'].map((step, i) => (
          <div key={step} className="flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ animationDelay: `${i * 0.3}s` }} />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stage 1 — Browse & Shortlist ─────────────────────────────────────────────

function Stage1BrowseView({
  session,
  shortlist,
  onToggleShortlist,
  onContinue,
  onReset,
}: {
  session:           ExportCompassSession;
  shortlist:         string[];
  onToggleShortlist: (country: string) => void;
  onContinue:        () => void;
  onReset:           () => void;
}) {
  const markets  = session.recommendedMarkets;
  const featured = markets.slice(0, 3);
  const rest     = markets.slice(3);

  const [email, setEmail]           = useState('');
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [isGrowthPlan, setIsGrowthPlan] = useState(false);

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabaseClient
        .from('users').select('plan_tier').eq('id', data.user.id).maybeSingle()
        .then(({ data: profile }) => { if (profile?.plan_tier === 'growth') setIsGrowthPlan(true); });
    });
  }, []);

  async function handleEmailPdf(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/export-compass/email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), session }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send');
      setSent(true);
      toast.success(`Report sent to ${email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send report');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {/* Stage indicator */}
      <StageIndicator stage="browse" />

      {/* Header banner */}
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/3 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Export Compass — {session.productLabel}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Top {markets.length} global export markets, ranked by Mercorama Export Score
              {session.hsCode ? ` · HS ${session.hsCode}` : ''}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onReset}>
            New analysis
          </Button>
        </div>
      </div>

      {/* Shortlist CTA band */}
      <div className="mb-6 rounded-xl border bg-primary/5 border-primary/20 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              Shortlist 3–5 markets you&apos;d seriously consider entering
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {shortlist.length === 0
                ? 'Click "Add to shortlist" on the markets below to get started.'
                : `${shortlist.length} market${shortlist.length > 1 ? 's' : ''} shortlisted: ${shortlist.join(', ')}`
              }
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 shrink-0"
            disabled={shortlist.length < 2}
            onClick={onContinue}
            title={shortlist.length < 2 ? 'Add at least 2 markets to your shortlist to continue' : undefined}
          >
            {shortlist.length < 2
              ? <><Bookmark className="h-4 w-4" />Shortlist {2 - shortlist.length} more to continue</>
              : <><CheckCircle2 className="h-4 w-4" />Continue with {shortlist.length} shortlisted markets<ArrowRight className="h-4 w-4" /></>
            }
          </Button>
        </div>
      </div>

      {/* Email PDF Report card */}
      <div className="mb-6 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-indigo-700 dark:text-indigo-400 shrink-0" />
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Email PDF Report</p>
          <span className="rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-xs font-medium">
            Branded PDF
          </span>
        </div>
        {sent ? (
          <div className="flex items-center gap-2 text-sm text-indigo-800 dark:text-indigo-200">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            Report sent to <span className="font-semibold">{email}</span>. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleEmailPdf} className="flex gap-2">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 flex-1 bg-white dark:bg-background"
              required
            />
            <Button type="submit" size="sm" disabled={sending}
              className="gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white shrink-0">
              {sending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending…</>
                : <><Send className="h-3.5 w-3.5" />Send PDF Report</>
              }
            </Button>
          </form>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Includes all 10 markets with score breakdowns, trade stats, AI insights, and cross-tool links.
        </p>
      </div>

      {/* Top recommendation */}
      <TopRecommendation markets={markets} />

      {/* Score explainer */}
      <ScoreExplainer />

      {/* Top 3 featured cards */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Top 3 markets</p>
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((market, i) => (
            <MarketCard
              key={`${market.country}-${i}`}
              market={market}
              rank={i + 1}
              featured
              productDescription={session.productDescription}
              hsCode={session.hsCode}
              isShortlisted={shortlist.includes(market.country)}
              onToggleShortlist={onToggleShortlist}
            />
          ))}
        </div>
      </div>

      {/* Remaining markets */}
      {rest.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Additional markets
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((market, i) => (
              <MarketCard
                key={`${market.country}-${i}`}
                market={market}
                rank={i + 4}
                productDescription={session.productDescription}
                hsCode={session.hsCode}
                isShortlisted={shortlist.includes(market.country)}
                onToggleShortlist={onToggleShortlist}
              />
            ))}
          </div>
        </div>
      )}

      {/* Continue footer button */}
      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          className="gap-2"
          disabled={shortlist.length < 2}
          onClick={onContinue}
        >
          {shortlist.length < 2
            ? 'Shortlist at least 2 markets to continue'
            : <><CheckCircle2 className="h-5 w-5" />Continue with {shortlist.length} shortlisted markets <ArrowRight className="h-5 w-5" /></>
          }
        </Button>
      </div>

      {/* Fund My Export panel */}
      <FundMyExportPanel
        context={{
          hsChapter:          session.hsCode?.slice(0, 4) ?? '',
          targetMarket:       markets[0]?.country ?? '',
          productDescription: session.productDescription,
        }}
        isGrowthPlan={isGrowthPlan}
        className="mt-8"
      />

      {/* Footer disclaimer */}
      <div className="mt-8 rounded-xl border bg-muted/20 px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Export scores are AI-generated estimates based on publicly known trade patterns and FTA schedules.
          Verify tariff rates, market data, and regulatory requirements with a licensed customs broker and
          your local Trade Commissioner Service before acting.
        </p>
      </div>
    </div>
  );
}

// ─── Stage 2 — Compare shortlisted markets ────────────────────────────────────

function Stage2CompareView({
  session,
  shortlist,
  onToggleShortlist,
  onBack,
  onAskAI,
}: {
  session:           ExportCompassSession;
  shortlist:         string[];
  onToggleShortlist: (country: string) => void;
  onBack:            () => void;
  onAskAI:           () => void;
}) {
  const markets = session.recommendedMarkets.filter((m) => shortlist.includes(m.country));
  const hasData = markets.some(
    (m) => m.dataSources?.tradeStats !== 'Estimated' || m.dataSources?.tariffData !== 'Estimated'
  );

  return (
    <div>
      {/* Stage indicator */}
      <StageIndicator stage="compare" />

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/3 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Compare shortlisted markets
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {shortlist.length} markets · {session.productLabel}
              {session.hsCode ? ` · HS ${session.hsCode}` : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to all markets
          </Button>
        </div>
      </div>

      {/* Warning if no real trade data */}
      {!hasData && (
        <div className="mb-5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Trade data for these markets hasn&apos;t been loaded yet. Showing score-based ranking only.
            Run the Comtrade backfill to enrich these markets with live data.
          </p>
        </div>
      )}

      {/* Shortlist empty guard */}
      {shortlist.length < 2 && (
        <div className="rounded-lg border bg-muted/20 px-5 py-8 text-center text-muted-foreground">
          <Bookmark className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">Add at least one more market to get a comparison.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>
            ← Back to all markets
          </Button>
        </div>
      )}

      {/* Comparison stack */}
      {shortlist.length >= 2 && (
        <div className="space-y-5">
          {markets.map((market, i) => (
            <MarketCard
              key={`compare-${market.country}-${i}`}
              market={market}
              rank={session.recommendedMarkets.findIndex((m) => m.country === market.country) + 1}
              productDescription={session.productDescription}
              hsCode={session.hsCode}
              isShortlisted
              onToggleShortlist={onToggleShortlist}
              mode="compare"
            />
          ))}
        </div>
      )}

      {/* Enhanced comparison table */}
      {markets.length >= 2 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Factor-level comparison</p>
          <EnhancedComparisonTable markets={markets} />
        </div>
      )}

      {/* Ask AI CTA */}
      {shortlist.length >= 2 && (
        <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-primary/5 px-6 py-5 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">Ready for a recommendation?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our AI trade advisor will analyse your shortlisted markets and recommend the one to enter first,
            with specific reasoning and next steps.
          </p>
          <Button size="lg" className="gap-2" onClick={onAskAI}>
            <Sparkles className="h-5 w-5" />
            Ask: Which market should I prioritise?
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Stage 3 — AI Recommendation ──────────────────────────────────────────────

function Stage3AnswerView({
  session,
  shortlist,
  onBack,
}: {
  session:   ExportCompassSession;
  shortlist: string[];
  onBack:    () => void;
}) {
  const [loading, setLoading]                         = useState(true);
  const [recommendation, setRecommendation]           = useState<string | null>(null);
  const [recommendedMarket, setRecommendedMarket]     = useState<string | null>(null);
  const [error, setError]                             = useState<string | null>(null);

  useEffect(() => {
    const markets = session.recommendedMarkets
      .filter((m) => shortlist.includes(m.country))
      .map((m): ShortlistedMarketPayload => ({
        country:           m.country,
        exportScore:       m.exportScore,
        demandScore:       m.scores.demand,
        marketAccessScore: m.scores.marketAccess,
        riskScore:         m.scores.risk,
        importValueUSD:    m.importValueUSD,
        cagr5yr:           m.importGrowth5y,
        canadaExportValue: m.canadaExportShare,
        tariffRate:        m.tariffRate,
        ftaName:           m.ftaName ?? null,
        riskFlags:         [],
      }));

    fetch('/api/export-compass/prioritise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markets,
        product: session.productDescription,
        hsCode:  session.hsCode ?? null,
      }),
    })
      .then((r) => r.json())
      .then((data: { recommendation?: string; recommendedMarket?: string; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setRecommendation(data.recommendation ?? '');
        setRecommendedMarket(data.recommendedMarket ?? null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      });
  }, [session, shortlist]);

  // Simple markdown renderer for the ## / ### / - structure from Claude
  function renderRecommendation(text: string) {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-2xl font-bold mt-2 mb-4 text-primary">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-base font-semibold mt-5 mb-2 text-foreground">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 mb-1.5 text-sm text-muted-foreground">
            <span className="text-primary mt-1 shrink-0">·</span>
            <span>{line.replace('- ', '')}</span>
          </div>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm text-muted-foreground mb-2">{line}</p>;
    });
  }

  return (
    <div>
      {/* Stage indicator */}
      <StageIndicator stage="answer" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Market Recommendation
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {session.productLabel} · {shortlist.length} shortlisted markets
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to compare
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl border bg-muted/20 px-6 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="font-semibold text-lg mb-1">Analysing your shortlisted markets…</p>
          <p className="text-sm text-muted-foreground">
            Comparing {shortlist.join(', ')} across demand, tariff, and risk dimensions.
          </p>
        </div>
      )}

      {/* Error fallback */}
      {!loading && error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-5 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
          <p className="font-semibold mb-1">We couldn&apos;t generate a recommendation right now.</p>
          <p className="text-sm text-muted-foreground mb-4">
            You can still compare your shortlisted markets above.
          </p>
          <Button variant="outline" onClick={onBack}>← Back to compare markets</Button>
        </div>
      )}

      {/* Recommendation */}
      {!loading && recommendation && !error && (
        <>
          <div className="rounded-2xl border border-primary/30 bg-white dark:bg-card px-6 py-6">
            {renderRecommendation(recommendation)}
          </div>

          {/* Attribution */}
          <div className="mt-4 rounded-lg bg-muted/30 px-4 py-2.5 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              AI recommendation based on live trade data from Statistics Canada and UN Comtrade
              (via Mercorama Supabase data backbone). Validate with a trade advisor before acting.
            </p>
          </div>

          {/* Post-Stage-3 CTAs */}
          {recommendedMarket && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {session.hsCode && (
                <Link
                  href={`/export-compass/profile?hs=${encodeURIComponent(session.hsCode)}&country=${encodeURIComponent(recommendedMarket)}&product=${encodeURIComponent(session.productDescription)}&back=/export-compass`}
                  className="flex-1"
                >
                  <Button variant="default" className="w-full gap-2">
                    <TrendingUp className="h-4 w-4" />
                    View Full Profile for {recommendedMarket}
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              )}
              <Link href="/dashboard?tool=deal-wizard" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Briefcase className="h-4 w-4" />
                  Start a Deal for {recommendedMarket}
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function ExportCompassWizard({
  initialProduct = '',
  initialHsCode  = '',
}: {
  initialProduct?: string;
  initialHsCode?:  string;
}) {
  const [view, setView]           = useState<'input' | 'loading' | 'results'>('input');
  const [session, setSession]     = useState<ExportCompassSession | null>(null);
  const [currentProduct, setCurrentProduct] = useState(initialProduct);

  // Stage machine + shortlist — persist across stage transitions
  const [stage, setStage]         = useState<Stage>('browse');
  const [shortlist, setShortlist] = useState<string[]>([]);

  function toggleShortlist(country: string) {
    setShortlist((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  }

  async function handleAnalyze(product: string, hsCode: string) {
    const { allowed, usage } = checkCompassLimit();
    if (!allowed) {
      toast.error(`You've reached your Export Compass limit (${usage.used}/${usage.limit} analyses used this month).`);
      return;
    }

    setCurrentProduct(product);
    setView('loading');

    try {
      const res = await fetch('/api/export-compass/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: product,
          hsCode:             hsCode || null,
          originCountry:      'Canada',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      incrementCompassUsage();

      const saved = await createCompassSession(data.session);
      setSession(saved);
      setStage('browse');
      setShortlist([]);
      setView('results');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setView('input');
    }
  }

  if (view === 'loading') return <LoadingView product={currentProduct} />;

  if (view === 'results' && session) {
    if (stage === 'compare') {
      return (
        <Stage2CompareView
          session={session}
          shortlist={shortlist}
          onToggleShortlist={toggleShortlist}
          onBack={() => setStage('browse')}
          onAskAI={() => setStage('answer')}
        />
      );
    }

    if (stage === 'answer') {
      return (
        <Stage3AnswerView
          session={session}
          shortlist={shortlist}
          onBack={() => setStage('compare')}
        />
      );
    }

    // Default: stage='browse'
    return (
      <Stage1BrowseView
        session={session}
        shortlist={shortlist}
        onToggleShortlist={toggleShortlist}
        onContinue={() => setStage('compare')}
        onReset={() => { setSession(null); setStage('browse'); setShortlist([]); setView('input'); }}
      />
    );
  }

  return (
    <InputForm
      initialProduct={initialProduct}
      initialHsCode={initialHsCode}
      onSubmit={handleAnalyze}
    />
  );
}
