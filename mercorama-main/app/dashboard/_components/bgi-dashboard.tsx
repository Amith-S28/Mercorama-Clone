'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, MapPin, Globe, Lightbulb, RefreshCw, Compass,
  TrendingUp, BarChart3, Clock, Zap, ChevronRight, Loader2, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { DashboardStage, BGIStatus } from '@/lib/types/mercorama-growth';

// ── State derivation ──────────────────────────────────────────────────────────

type GrowthIntent = 'canada' | 'global' | '';

interface DashState {
  stage: DashboardStage;
  status: BGIStatus;
  product?: string;
  province?: string;
  country?: string;
  hasExportPlan: boolean;
  growthIntent: GrowthIntent;
  lastView?: string;
  lastViewLabel?: string;
}

const VIEW_LABEL: Record<string, string> = {
  'export-plan': 'Export Plan',
  'global-markets': 'Global Markets',
  'trade-advantage': 'Trade Advantage',
  'canada-markets': 'Canada Markets',
  'profile': 'Business Profile',
  'freight-connect': 'Freight Connect',
  'fund-my-export': 'Fund My Export',
};

function deriveState(): DashState {
  let snapshot: Record<string, string> | null = null;
  let canadaFocus: Record<string, unknown> | null = null;
  let compassResult: Record<string, unknown> | null = null;
  let deals: Record<string, unknown> | null = null;

  try { const r = localStorage.getItem('mercorama_snapshot'); if (r) snapshot = JSON.parse(r); } catch {}
  try { const r = localStorage.getItem('mercorama_canada_focus'); if (r) canadaFocus = JSON.parse(r); } catch {}
  try { const r = localStorage.getItem('mercorama_export_compass'); if (r) compassResult = JSON.parse(r); } catch {}
  try { const r = localStorage.getItem('mercorama_deals'); if (r) deals = JSON.parse(r); } catch {}

  const hasSnapshot = !!snapshot?.productDescription;
  const province = (canadaFocus?.province as string) ?? undefined;
  const country = (compassResult?.country as string) ?? undefined;
  const hasExportPlan = deals ? Object.keys(deals).length > 0 : false;

  let stage: DashboardStage = 'no_snapshot';
  if (hasExportPlan && country) stage = 'executing_plan';
  else if (country) stage = 'market_selected';
  else if (province) stage = 'exploring_global';
  else if (hasSnapshot) stage = 'exploring_domestic';

  let status: BGIStatus = 'getting_started';
  if (country && hasExportPlan) status = 'expansion_ready';
  else if (province || country) status = 'building_momentum';

  // Growth intent
  let growthIntent: GrowthIntent = '';
  try {
    const gi = localStorage.getItem('mercorama_growth_intent');
    if (gi === 'canada' || gi === 'global') growthIntent = gi;
  } catch {}

  // Last view tracking
  let lastView: string | undefined;
  let lastViewLabel: string | undefined;
  try {
    const lv = localStorage.getItem('mercorama_last_view');
    if (lv) { lastView = lv; lastViewLabel = VIEW_LABEL[lv] ?? lv; }
  } catch {}

  return {
    stage, status,
    product: snapshot?.productDescription,
    province, country,
    hasExportPlan,
    growthIntent,
    lastView, lastViewLabel,
  };
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<BGIStatus, { label: string; className: string }> = {
  getting_started:   { label: 'Getting Started',   className: 'bg-muted text-muted-foreground' },
  building_momentum: { label: 'Building Momentum', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  expansion_ready:   { label: 'Expansion Ready',   className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
};

// ── Journey steps ─────────────────────────────────────────────────────────────

interface JourneyStep { label: string; complete: boolean; current: boolean; href: string }

function getJourney(s: DashState): JourneyStep[] {
  const stages: DashboardStage[] = ['no_snapshot', 'exploring_domestic', 'exploring_global', 'market_selected', 'executing_plan'];
  const idx = stages.indexOf(s.stage);

  if (s.growthIntent === 'canada') {
    return [
      { label: 'Business Profile', complete: idx > 0, current: idx === 0, href: '/dashboard?view=profile' },
      { label: 'Canada Markets',   complete: idx > 1, current: idx === 1, href: '/dashboard?view=canada-markets' },
      { label: 'Distribution Plan', complete: idx > 2, current: idx === 2 || idx === 3, href: '/dashboard?view=canada-plan' },
      { label: 'Scale Nationally',  complete: idx > 3, current: idx === 4, href: '/dashboard?view=canada-plan' },
    ];
  }

  // Global path (default)
  return [
    { label: 'Business Profile', complete: idx > 0, current: idx === 0, href: '/dashboard?view=profile' },
    { label: 'Global Markets',   complete: idx > 1 || idx > 2, current: idx === 1 || idx === 2, href: '/dashboard?view=global-markets' },
    { label: 'Export Plan',      complete: idx > 3, current: idx === 3, href: '/dashboard?view=export-plan' },
    { label: 'Market Entry',    complete: idx === 4, current: idx === 4, href: '/dashboard?view=export-plan' },
  ];
}

// ── Next step ─────────────────────────────────────────────────────────────────

function getNextStep(s: DashState): { heading: string; body: string; cta: string; href: string } {
  // STATE A
  if (s.stage === 'no_snapshot') return {
    heading: 'Complete your business snapshot',
    body: 'Tell us about your product so Mercorama can guide your next growth step.',
    cta: 'Complete Business Snapshot',
    href: '/snapshot',
  };
  // STATE B — intent-aware
  if (s.stage === 'exploring_domestic') {
    if (s.growthIntent === 'global') {
      return {
        heading: 'Find your best global markets',
        body: 'Compare the best international markets for your product.',
        cta: 'Find Global Opportunities',
        href: '/dashboard?view=global-markets',
      };
    }
    return {
      heading: 'Find your strongest Canadian market',
      body: 'Find the strongest province for your product before scaling nationally.',
      cta: 'Explore Canada Markets',
      href: '/canada-explorer',
    };
  }
  // STATE C
  if (s.stage === 'exploring_global') {
    if (s.growthIntent === 'canada') {
      return {
        heading: 'Build your Canada go-to-market plan',
        body: `Turn your ${s.province ?? 'province'} focus into an actionable distribution plan.`,
        cta: 'Build Canada Plan',
        href: '/dashboard?view=canada-plan',
      };
    }
    return {
      heading: 'Explore global markets',
      body: `You've identified ${s.province ?? 'a province'} as your Canada focus. Now find the best international markets for your product.`,
      cta: 'Explore Global Markets',
      href: '/dashboard?view=global-markets',
    };
  }
  // STATE D
  if (s.stage === 'market_selected') return {
    heading: 'Build your export plan',
    body: 'Turn your chosen market into an actionable export plan.',
    cta: 'Build Your Export Plan',
    href: '/deal',
  };
  // STATE E
  return {
    heading: 'Your export plan is ready',
    body: 'Review, refine, or build a plan for another market.',
    cta: 'View Your Export Plan',
    href: '/deal',
  };
}

// ── Market signals ────────────────────────────────────────────────────────────

interface Signal { icon: typeof TrendingUp; text: string; emphasis?: boolean }

function getMarketSignals(s: DashState): Signal[] {
  const signals: Signal[] = [];

  if (s.country) {
    signals.push({ icon: TrendingUp, text: `${s.country} is in your active pipeline — building an export plan is your next milestone.`, emphasis: true });
    signals.push({ icon: BarChart3, text: `Most Canadian exporters to ${s.country} ship under FOB or CIF terms. Validate your Incoterm before quoting.` });
    if (s.province) {
      signals.push({ icon: Zap, text: `Your ${s.province} domestic presence can support logistics for ${s.country} shipments.` });
    } else {
      signals.push({ icon: Zap, text: `Check if ${s.country} has an active FTA with Canada — preferential rates can cut landed cost by 5–15%.` });
    }
  } else if (s.province) {
    signals.push({ icon: TrendingUp, text: `${s.province} selected as your domestic focus — explore global markets next.`, emphasis: true });
    signals.push({ icon: BarChart3, text: `Top exporters from ${s.province} typically start with the US, then expand to CPTPP and EU markets.` });
    signals.push({ icon: Zap, text: `Reviewing distribution channels in ${s.province} strengthens your export readiness.` });
  } else if (s.product) {
    signals.push({ icon: TrendingUp, text: `Your product profile is set — Mercorama can now personalize market recommendations.`, emphasis: true });
    signals.push({ icon: BarChart3, text: `Canada's FTAs cover 51 countries. Most SMEs never claim the preferential rates they qualify for.` });
    signals.push({ icon: Zap, text: `12–15% of global shipments have HS code errors. Getting classification right avoids penalties up to 4× duty owed.` });
  } else {
    signals.push({ icon: TrendingUp, text: `Complete your business profile to unlock personalized market intelligence.`, emphasis: true });
    signals.push({ icon: BarChart3, text: `Canadian SME exporters who use FTAs save an average of 8% on landed costs.` });
  }

  return signals.slice(0, 3);
}

// ── Suggested actions (clickable) ─────────────────────────────────────────────

interface ActionItem { text: string; href: string }

function getActions(s: DashState): ActionItem[] {
  const actions: ActionItem[] = [];

  if (s.province && !s.country) {
    actions.push({ text: `Review buyers and channels in ${s.province}`, href: '/dashboard?view=canada-markets' });
    actions.push({ text: 'Rank global markets for your product', href: '/dashboard?view=global-markets' });
  }
  if (s.country && !s.hasExportPlan) {
    actions.push({ text: `Build your export plan for ${s.country}`, href: '/dashboard?view=export-plan' });
    actions.push({ text: `Compare ${s.country} with other global markets`, href: '/dashboard?view=global-markets' });
  }
  if (s.country && s.hasExportPlan) {
    actions.push({ text: `Review and refine your ${s.country} export plan`, href: '/dashboard?view=export-plan' });
    actions.push({ text: 'Compare with alternative markets', href: '/dashboard?view=global-markets' });
  }
  if (s.province && s.country) {
    actions.push({ text: `Compare ${s.country} with other CPTPP markets`, href: '/dashboard?view=global-markets' });
  }
  if (s.product && !s.province && !s.country) {
    actions.push({ text: 'Explore Canadian provinces for your product', href: '/dashboard?view=canada-markets' });
    actions.push({ text: 'Find global markets ranked by demand', href: '/dashboard?view=global-markets' });
  }
  if (s.product) {
    actions.push({ text: 'Find financing for your export deal', href: '/dashboard?view=fund-my-export' });
  }

  return actions.slice(0, 3);
}

// ── Main component ────────────────────────────────────────────────────────────

// ── Snapshot form options ──────────────────────────────────────────────────────

const PRICE_OPTIONS = ['Under $25', '$25–$100', '$100–$500', '$500+'];
const MARKET_OPTIONS = ['Local only', 'Ontario', 'Quebec', 'British Columbia', 'Multiple provinces', 'Already exporting'];
const EXPERIENCE_OPTIONS = ['None', 'Exploring', 'Have exported before'];

// ── Main component ────────────────────────────────────────────────────────────

export function BGIDashboard() {
  const [state, setState] = useState<DashState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [canadaOpen, setCanadaOpen] = useState(false);
  const [intentChangeOpen, setIntentChangeOpen] = useState(false);

  useEffect(() => { setState(deriveState()); }, [refreshKey]);

  const handleSnapshotComplete = useCallback(() => {
    setSnapshotOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCanadaComplete = useCallback(() => {
    setCanadaOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  if (!state) return null;

  const badge = STATUS_STYLE[state.status];
  const next = getNextStep(state);
  const journey = getJourney(state);
  const signals = getMarketSignals(state);
  const actions = getActions(state);

  const focusLabel = state.country ?? state.province ?? null;
  const focusContext = state.country
    ? 'You are actively evaluating this market. Continue toward export planning.'
    : state.province
      ? 'You have identified a strong domestic opportunity. Global expansion can be explored next.'
      : 'Start by identifying where your business can grow next.';

  return (
    <div className="space-y-6 mb-8">

      {/* ── GROWTH FOCUS + JOURNEY (full width) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Growth Focus</h2>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', badge.className)}>{badge.label}</span>
        </div>

        <Card className="border-[#01696f]/20 bg-gradient-to-r from-[#01696f]/5 to-background">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {focusLabel ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      {state.country ? <Globe className="h-5 w-5 text-[#01696f]" /> : <MapPin className="h-5 w-5 text-[#01696f]" />}
                      <h3 className="text-xl font-bold">{focusLabel}</h3>
                    </div>
                    {state.province && state.country && (
                      <p className="text-xs text-muted-foreground mb-1">Building on: {state.province}</p>
                    )}
                  </>
                ) : (
                  <h3 className="text-lg font-bold mb-1">No focus selected yet</h3>
                )}
                <p className="text-sm text-muted-foreground max-w-md">{focusContext}</p>
                {focusLabel && (
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Link href="/dashboard?view=global-markets" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#01696f] transition-colors">
                      <Compass className="h-3 w-3" />
                      Explore other markets
                    </Link>
                    {state.country && (
                      <Link href="/dashboard?view=trade-advantage" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#01696f] transition-colors">
                        <TrendingUp className="h-3 w-3" />
                        Check trade advantages
                      </Link>
                    )}
                    <Link href="/dashboard?view=profile" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#01696f] transition-colors">
                      <RefreshCw className="h-3 w-3" />
                      Change focus
                    </Link>
                  </div>
                )}
              </div>
              {state.stage === 'no_snapshot' ? (
                <Button size="lg" className="gap-2 w-full sm:w-auto shrink-0" onClick={() => setSnapshotOpen(true)}>
                  {next.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              ) : state.stage === 'exploring_domestic' && state.growthIntent !== 'global' ? (
                <Button size="lg" className="gap-2 w-full sm:w-auto shrink-0" onClick={() => setCanadaOpen(true)}>
                  {next.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Link href={next.href} className="shrink-0">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    {next.cta} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── JOURNEY PROGRESS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Growth Journey</h2>
          {state.growthIntent && (
            <button
              onClick={() => setIntentChangeOpen(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#01696f] transition-colors"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Change growth goal
            </button>
          )}
        </div>
        <div className="flex items-center gap-0">
          {journey.map((step, i) => (
            <div key={step.label} className="flex items-center">
              {i > 0 && <div className={cn('w-6 sm:w-12 h-px', step.complete || step.current ? 'bg-[#01696f]' : 'bg-border')} />}
              <Link href={step.href} className="flex items-center gap-1.5 group">
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                  step.complete
                    ? 'bg-[#01696f] text-white group-hover:ring-2 group-hover:ring-[#01696f]/30'
                    : step.current
                      ? 'bg-[#01696f] text-white ring-2 ring-[#01696f]/30'
                      : 'bg-muted text-muted-foreground group-hover:bg-muted/80',
                )}>
                  {step.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn(
                  'text-xs hidden sm:inline transition-colors',
                  step.current ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}>{step.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2-COLUMN INTELLIGENCE GRID ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* LEFT: Market Signals */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Market Signals</h2>
          <Card>
            <CardContent className="py-4 space-y-3">
              {signals.map((signal, i) => {
                const Icon = signal.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5',
                      signal.emphasis ? 'bg-[#01696f]/10' : 'bg-muted',
                    )}>
                      <Icon className={cn('h-3.5 w-3.5', signal.emphasis ? 'text-[#01696f]' : 'text-muted-foreground')} />
                    </div>
                    <p className={cn('text-sm leading-relaxed', signal.emphasis ? 'font-medium' : 'text-muted-foreground')}>
                      {signal.text}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Suggested Actions + Continue */}
        <div className="space-y-5">
          {/* Suggested Actions */}
          {actions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Suggested Actions</h2>
              <div className="space-y-2">
                {actions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:border-[#01696f]/40 hover:bg-[#01696f]/5 transition-all group cursor-pointer">
                      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-sm flex-1">{action.text}</p>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#01696f] transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Continue Analysis */}
          {state.lastView && state.lastViewLabel && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Continue Where You Left Off</h2>
              <Link href={`/dashboard?view=${state.lastView}`}>
                <Card className="hover:border-[#01696f]/40 hover:bg-[#01696f]/5 transition-all cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{state.lastViewLabel}</p>
                        <p className="text-xs text-muted-foreground">Pick up where you left off</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1 shrink-0">
                        Continue <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {/* Export Plan Status (future-ready) */}
          {state.hasExportPlan && state.country && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Export Plan</h2>
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{state.country} Export Plan</p>
                      <p className="text-xs text-muted-foreground">Plan created — review or refine</p>
                    </div>
                    <Link href="/dashboard?view=export-plan">
                      <Button size="sm" variant="outline" className="gap-1 shrink-0 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                        Review <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Active Market Tracking placeholder (future-ready) */}
          {state.country && !state.hasExportPlan && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Market Tracking</h2>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Watching: {state.country}</p>
                      <p className="text-xs text-muted-foreground">Build an export plan to move forward</p>
                    </div>
                    <Link href="/dashboard?view=export-plan">
                      <Button size="sm" variant="outline" className="gap-1 shrink-0">
                        Start <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ── SNAPSHOT SHEET ── */}
      <Sheet open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Business Snapshot</SheetTitle>
            <SheetDescription>Takes 30 seconds. Personalizes your entire experience.</SheetDescription>
          </SheetHeader>
          <SnapshotSheetForm onComplete={handleSnapshotComplete} />
        </SheetContent>
      </Sheet>

      {/* ── CANADA EXPLORER SHEET ── */}
      <Sheet open={canadaOpen} onOpenChange={setCanadaOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Canada Market Explorer</SheetTitle>
            <SheetDescription>Select your strongest domestic market focus.</SheetDescription>
          </SheetHeader>
          <CanadaExplorerSheetContent onComplete={handleCanadaComplete} />
        </SheetContent>
      </Sheet>

      {/* ── INTENT CHANGE SHEET ── */}
      <Sheet open={intentChangeOpen} onOpenChange={setIntentChangeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Change growth goal</SheetTitle>
            <SheetDescription>This will update your dashboard to match your new direction.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-3 mt-2">
            {[
              { value: 'canada', icon: '\u{1F1E8}\u{1F1E6}', title: 'Grow within Canada', desc: 'Expand to new provinces or retailers' },
              { value: 'global', icon: '\u{1F30D}', title: 'Expand internationally', desc: 'Find export markets outside Canada' },
            ].map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  'w-full rounded-xl border-2 p-4 text-left transition-all',
                  state.growthIntent === opt.value
                    ? 'bg-[#01696f]/10 border-[#01696f] ring-1 ring-[#01696f]/30'
                    : 'border-border hover:border-[#01696f]/40',
                )}
                onClick={() => {
                  localStorage.setItem('mercorama_growth_intent', opt.value);
                  setIntentChangeOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
              >
                <span className="text-2xl block mb-2">{opt.icon}</span>
                <span className="text-sm font-semibold block">{opt.title}</span>
                <span className="text-xs text-muted-foreground block mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Inline snapshot form (Sheet content) ──────────────────────────────────────

function SnapshotSheetForm({ onComplete }: { onComplete: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    productDescription: '',
    priceRange: '',
    currentMarket: '',
    exportExperience: '',
    growthIntent: '',
  });

  // Load existing snapshot if updating
  useEffect(() => {
    fetch('/api/snapshot')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.productDescription) setForm(data);
      })
      .catch(() => {});
  }, []);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productDescription.trim() || !form.priceRange || !form.currentMarket || !form.exportExperience || !form.growthIntent) {
      setError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      localStorage.setItem('mercorama_snapshot', JSON.stringify(form));
      localStorage.setItem('mercorama_growth_intent', form.growthIntent);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 pb-6">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Describe your product or service</label>
        <Input
          value={form.productDescription}
          onChange={(e) => set('productDescription', e.target.value.slice(0, 100))}
          placeholder="e.g., Organic maple syrup for retail"
          maxLength={100}
        />
        <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">{form.productDescription.length}/100</span>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Price range per unit</label>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('priceRange', opt)}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]',
                form.priceRange === opt
                  ? 'bg-[#01696f] text-white border-[#01696f]'
                  : 'bg-card text-foreground border-border hover:border-[#01696f]/40',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Where do you currently sell?</label>
        <div className="grid grid-cols-2 gap-2">
          {MARKET_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('currentMarket', opt)}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]',
                form.currentMarket === opt
                  ? 'bg-[#01696f] text-white border-[#01696f]'
                  : 'bg-card text-foreground border-border hover:border-[#01696f]/40',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Export experience</label>
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('exportExperience', opt)}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]',
                form.exportExperience === opt
                  ? 'bg-[#01696f] text-white border-[#01696f]'
                  : 'bg-card text-foreground border-border hover:border-[#01696f]/40',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Growth intent */}
      <div>
        <label className="text-sm font-medium mb-2 block">What&apos;s your primary growth goal?</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'canada', icon: '\u{1F1E8}\u{1F1E6}', title: 'Grow in Canada', desc: 'New provinces or retailers' },
            { value: 'global', icon: '\u{1F30D}', title: 'Go international', desc: 'Export markets outside Canada' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('growthIntent', opt.value)}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-all',
                form.growthIntent === opt.value
                  ? 'bg-[#01696f]/10 border-[#01696f] ring-1 ring-[#01696f]/30'
                  : 'border-border hover:border-[#01696f]/40',
              )}
            >
              <span className="text-xl block mb-1">{opt.icon}</span>
              <span className="text-xs font-semibold block">{opt.title}</span>
              <span className="text-[10px] text-muted-foreground block">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>Show me my growth opportunities <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    </form>
  );
}

// ── Canada Explorer Sheet content (Supabase-backed) ──────────────────────────

interface ProvinceCard {
  code: string;
  name: string;
  population: number;
  gdp_billions: number;
  consumer_profile: Record<string, string> | null;
  retail_chains: { name: string; tier: string; category: string; store_count: number }[];
  distributors: { name: string; model: string; category_specialties: string[] }[];
}

interface ProvinceDeepDive extends ProvinceCard {
  intelligence: {
    category: string;
    market_size: string;
    consumer_profile: string;
    top_retail_chains: { name: string; tier: string; fit: string }[];
    top_distributors: { name: string; model: string; fit: string }[];
    recommended_entry_channel: string;
    competition_intensity: string;
    regulatory_notes: string;
    key_insights: string;
    last_updated: string;
  }[];
}

function CanadaExplorerSheetContent({ onComplete }: { onComplete: () => void }) {
  const [provinces, setProvinces] = useState<ProvinceCard[]>([]);
  const [deepDive, setDeepDive] = useState<ProvinceDeepDive | null>(null);
  const [loading, setLoading] = useState(true);
  const [deepLoading, setDeepLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch province overview
  useEffect(() => {
    fetch('/api/canada/provinces')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load province data.'))
      .finally(() => setLoading(false));
  }, []);

  function openDeepDive(code: string) {
    setDeepLoading(true);
    setDeepDive(null);
    fetch(`/api/canada/provinces/${code}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setDeepDive(data))
      .catch(() => setError('Failed to load province details.'))
      .finally(() => setDeepLoading(false));
  }

  function handleSaveAsFocus(p: ProvinceCard) {
    localStorage.setItem('mercorama_canada_focus', JSON.stringify({
      province: p.name,
      demandLevel: 'high',
      rationale: (p.consumer_profile as Record<string, string>)?.trends ?? '',
      recommendedEntryStrategy: '',
      targetChannels: p.retail_chains.slice(0, 3).map((c) => c.name),
      keyBuyersOrRetailers: p.distributors.slice(0, 2).map((d) => d.name),
      logisticsComplexity: 'medium',
      competitionLevel: 'medium',
    }));
    onComplete();
  }

  // ── Deep dive view ──
  if (deepDive) {
    const intel = deepDive.intelligence?.[0];
    const profile = deepDive.consumer_profile as Record<string, string> | null;
    return (
      <div className="px-4 pb-6 space-y-4">
        <button
          onClick={() => setDeepDive(null)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-3 w-3 rotate-180" />
          Back to all provinces
        </button>

        {/* Header */}
        <div className="rounded-lg border border-[#01696f]/30 bg-[#01696f]/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-[#01696f]" />
            <h3 className="text-lg font-bold">{deepDive.name}</h3>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Pop: {(deepDive.population / 1e6).toFixed(1)}M</span>
            <span>GDP: ${deepDive.gdp_billions}B</span>
          </div>
          {intel?.last_updated && (() => {
            const updated = new Date(intel.last_updated);
            const daysOld = Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <p className={cn('text-[10px] mt-1', daysOld > 30 ? 'text-amber-600' : 'text-muted-foreground')}>
                Data last updated: {updated.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                {daysOld > 30 && ' — may be outdated'}
              </p>
            );
          })()}
        </div>

        {/* Consumer Profile */}
        {profile && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Consumer Profile</h4>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {profile.key_demographics && <p><strong>Demographics:</strong> {profile.key_demographics}</p>}
              {profile.spending_habits && <p><strong>Spending:</strong> {profile.spending_habits}</p>}
              {profile.trends && <p><strong>Trends:</strong> {profile.trends}</p>}
            </div>
          </div>
        )}

        {/* Retail Chains */}
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Retail Channels</h4>
          <div className="space-y-1.5">
            {deepDive.retail_chains.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                <div>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground ml-2">{c.category}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                    c.tier === 'national' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-muted text-muted-foreground',
                  )}>{c.tier}</span>
                  {c.store_count && <span>{c.store_count} stores</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distributors */}
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Distributors</h4>
          <div className="space-y-1.5">
            {deepDive.distributors.map((d) => (
              <div key={d.name} className="rounded-md border px-3 py-2 text-xs">
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground ml-2">{d.model?.replace(/_/g, ' ')}</span>
                {d.category_specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {d.category_specialties.map((s) => (
                      <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Province Intelligence */}
        {intel ? (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Market Intelligence</h4>
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3 text-xs">
              {intel.market_size && <p><strong>Market size:</strong> {intel.market_size}</p>}
              {intel.recommended_entry_channel && (
                <div className="rounded-md bg-[#01696f]/5 border border-[#01696f]/20 px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-0.5">Entry Strategy</span>
                  <p className="text-sm font-medium text-[#01696f] dark:text-[#4f98a3]">{intel.recommended_entry_channel}</p>
                </div>
              )}
              {intel.competition_intensity && <p><strong>Competition:</strong> {intel.competition_intensity}</p>}
              {intel.regulatory_notes && <p><strong>Regulatory:</strong> {intel.regulatory_notes}</p>}
              {intel.key_insights && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">{intel.key_insights}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">Intelligence being built for {deepDive.name}. Check back soon.</p>
          </div>
        )}

        <Button size="lg" className="w-full gap-2" onClick={() => handleSaveAsFocus(deepDive)}>
          <MapPin className="h-4 w-4" />
          Save this as my Canada focus
        </Button>
      </div>
    );
  }

  // ── Loading deep dive ──
  if (deepLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="px-4 pb-6 space-y-3">
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-4 h-28 animate-pulse bg-muted/30" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-sm text-destructive mb-3">{error}</p>
        </div>
      )}

      {!loading && !error && provinces.map((p) => (
        <div
          key={p.code}
          className="rounded-lg border p-4 cursor-pointer transition-all hover:shadow-sm hover:border-[#01696f]/40 group"
          onClick={() => openDeepDive(p.code)}
        >
          <div className="flex items-start justify-between mb-1.5">
            <div>
              <h4 className="text-sm font-semibold">{p.name}</h4>
              <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                <span>Pop: {(p.population / 1e6).toFixed(1)}M</span>
                <span>GDP: ${p.gdp_billions}B</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#01696f] transition-colors shrink-0 mt-1" />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {p.retail_chains.slice(0, 2).map((c) => (
              <span key={c.name} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c.name}</span>
            ))}
            {p.distributors.slice(0, 2).map((d) => (
              <span key={d.name} className="rounded bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 text-[10px] text-blue-700 dark:text-blue-300">{d.name}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
