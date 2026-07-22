'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trophy, TrendingUp, Shield, Briefcase, ArrowRight, Info, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketIntelligenceCard, MarketScores } from '@/lib/export-compass';

// ── Decision Labels ───────────────────────────────────────────────────────────

export function getDecisionLabel(scores: MarketScores): { label: string; className: string } {
  const { demand, growth, risk, marketAccess, logistics } = scores;
  if (demand >= 70 && risk >= 60) return { label: 'High Potential', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  if (growth >= 70 && marketAccess >= 50) return { label: 'High Growth Opportunity', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
  if (logistics >= 70 && risk >= 60) return { label: 'Fast Entry Market', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' };
  if (risk < 40) return { label: 'Complex but Strategic', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
  return { label: 'Moderate Opportunity', className: 'bg-muted text-muted-foreground' };
}

// ── Explainability Panel (inside MarketCard) ──────────────────────────────────

export function ScoreExplainability({ market }: { market: MarketIntelligenceCard }) {
  const s = market.scores;
  const highlights: string[] = [];
  if (s.demand >= 70) highlights.push(`Strong import demand (${market.importValueUSD})`);
  else if (s.demand >= 50) highlights.push(`Moderate import demand (${market.importValueUSD})`);
  if (s.growth >= 70) highlights.push(`Rapid growth trajectory (${market.importGrowth5y} 5Y)`);
  if (s.canadaAdvantage >= 60) highlights.push(`Canada holds ${market.canadaExportShare} market share`);
  if (market.ftaAvailable) highlights.push(`FTA advantage via ${market.ftaName} (tariff: ${market.tariffRate})`);
  if (s.logistics >= 70) highlights.push('Strong logistics infrastructure');
  if (s.risk < 40) highlights.push('Elevated regulatory or political risk');
  else if (s.risk >= 70) highlights.push('Low risk environment');

  if (highlights.length === 0) return null;

  return (
    <div className="space-y-1 pt-2 border-t">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Why this market ranks here</p>
      <ul className="space-y-0.5">
        {highlights.slice(0, 4).map((h, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />{h}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Top Recommendation Panel ──────────────────────────────────────────────────

export function TopRecommendation({ markets }: { markets: MarketIntelligenceCard[] }) {
  if (markets.length === 0) return null;
  const top = markets[0];
  const label = getDecisionLabel(top.scores);

  return (
    <Card className="border-[#01696f]/30 bg-[#01696f]/5 mb-6">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Trophy className="h-5 w-5 text-[#01696f] shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">{top.country}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', label.className)}>{label.label}</span>
              {top.ftaName && <span className="rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-[10px] font-semibold">{top.ftaName}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{top.insight?.slice(0, 200)}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Import: {top.importValueUSD}</span>
              <span>Growth: {top.importGrowth5y}</span>
              <span>CA Share: {top.canadaExportShare}</span>
              <span>Tariff: {top.tariffRate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Weight Control Panel ──────────────────────────────────────────────────────

export type WeightConfig = Record<keyof MarketScores, number>;

const DEFAULT_WEIGHTS: WeightConfig = {
  demand: 30, growth: 20, canadaAdvantage: 20,
  marketAccess: 15, logistics: 10, risk: 5,
};

const WEIGHT_LABELS: Record<keyof MarketScores, string> = {
  demand: 'Demand', growth: 'Growth', canadaAdvantage: 'Canada Advantage',
  marketAccess: 'Market Access', logistics: 'Logistics', risk: 'Risk',
};

export function computeWeightedScore(scores: MarketScores, weights: WeightConfig): number {
  const total = Object.values(weights).reduce((s, w) => s + w, 0) || 100;
  return Math.round(
    (weights.demand / total) * scores.demand +
    (weights.growth / total) * scores.growth +
    (weights.canadaAdvantage / total) * scores.canadaAdvantage +
    (weights.marketAccess / total) * scores.marketAccess +
    (weights.logistics / total) * scores.logistics +
    (weights.risk / total) * scores.risk
  );
}

export function WeightControls({ weights, onChange }: { weights: WeightConfig; onChange: (w: WeightConfig) => void }) {
  const [open, setOpen] = useState(false);
  const total = Object.values(weights).reduce((s, w) => s + w, 0);

  function setWeight(key: keyof MarketScores, val: number) {
    onChange({ ...weights, [key]: val });
  }

  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <BarChart3 className="h-3.5 w-3.5" />
        {open ? 'Hide' : 'Adjust'} scoring weights
        {total !== 100 && <span className="text-amber-600 font-medium">(total: {total}%)</span>}
      </button>
      {open && (
        <Card className="mt-2">
          <CardContent className="py-3 space-y-3">
            <p className="text-[10px] text-muted-foreground">Adjust how much each factor matters. Rankings update instantly.</p>
            {(Object.keys(DEFAULT_WEIGHTS) as (keyof MarketScores)[]).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 text-xs text-muted-foreground shrink-0">{WEIGHT_LABELS[key]}</span>
                <Slider
                  value={[weights[key]]}
                  onValueChange={([v]) => setWeight(key, v)}
                  max={50} min={0} step={5}
                  className="flex-1"
                />
                <span className="w-8 text-xs font-mono text-right">{weights[key]}%</span>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onChange({ ...DEFAULT_WEIGHTS })}>
              Reset to defaults
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { DEFAULT_WEIGHTS };

// ── Enhanced Comparison Table ─────────────────────────────────────────────────

export function EnhancedComparisonTable({ markets }: { markets: MarketIntelligenceCard[] }) {
  if (markets.length < 2) return null;

  const factors: { label: string; key: keyof MarketScores }[] = [
    { label: 'Demand', key: 'demand' },
    { label: 'Growth', key: 'growth' },
    { label: 'Canada Advantage', key: 'canadaAdvantage' },
    { label: 'Market Access', key: 'marketAccess' },
    { label: 'Logistics', key: 'logistics' },
    { label: 'Risk', key: 'risk' },
  ];

  return (
    <div className="rounded-xl border overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-semibold">Factor</th>
            {markets.map((m) => <th key={m.country} className="text-left px-3 py-2 font-semibold">{m.country}</th>)}
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => {
            const vals = markets.map((m) => m.scores[f.key]);
            const maxVal = Math.max(...vals);
            return (
              <tr key={f.key} className="border-b">
                <td className="px-3 py-2 font-medium text-muted-foreground">{f.label}</td>
                {markets.map((m, i) => (
                  <td key={m.country} className={cn('px-3 py-2', vals[i] === maxVal && 'font-bold text-[#01696f]')}>
                    {m.scores[f.key]}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr className="border-b">
            <td className="px-3 py-2 font-medium text-muted-foreground">Tariff</td>
            {markets.map((m) => <td key={m.country} className="px-3 py-2">{m.tariffRate}</td>)}
          </tr>
          <tr className="border-b">
            <td className="px-3 py-2 font-medium text-muted-foreground">FTA</td>
            {markets.map((m) => <td key={m.country} className="px-3 py-2">{m.ftaName ?? '—'}</td>)}
          </tr>
          <tr>
            <td className="px-3 py-2 font-medium text-muted-foreground">Competitors</td>
            {markets.map((m) => <td key={m.country} className="px-3 py-2">{m.topCompetitors?.join(', ') ?? '—'}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Deal Wizard Handoff ───────────────────────────────────────────────────────

export function DealHandoffButton({ country, hsCode }: { country: string; hsCode?: string | null }) {
  const params = new URLSearchParams();
  if (hsCode) params.set('hsCode', hsCode);
  params.set('buyerCountry', country);
  const href = `/dashboard?tool=deal-wizard&${params.toString()}`;

  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className="gap-1 text-xs w-full">
        <Briefcase className="h-3 w-3" />Build Export Deal
      </Button>
    </Link>
  );
}
