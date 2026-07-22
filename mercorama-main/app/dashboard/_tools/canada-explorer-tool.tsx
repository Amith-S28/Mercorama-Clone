'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MapPin, CheckCircle2, ArrowRight, Truck, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WorkflowBanner } from '@/components/workflow-banner';
import type { CanadaMarketResult } from '@/lib/types/mercorama-growth';

const SNAPSHOT_KEY = 'mercorama_snapshot';
const FOCUS_KEY = 'mercorama_canada_focus';
const CACHE_KEY = 'mercorama_canada_cache';

const DEMAND_STYLE: Record<string, { label: string; className: string }> = {
  high:   { label: 'High Demand',   className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  medium: { label: 'Medium Demand', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  low:    { label: 'Low Demand',    className: 'bg-muted text-muted-foreground' },
};

const LEVEL_STYLE: Record<string, string> = {
  low: 'text-green-600', medium: 'text-amber-600', high: 'text-red-600',
};

function sortByDemand(a: CanadaMarketResult, b: CanadaMarketResult): number {
  const order = { high: 0, medium: 1, low: 2 };
  return (order[a.demandLevel] ?? 1) - (order[b.demandLevel] ?? 1);
}

export function CanadaExplorerTool() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Record<string, string> | null>(null);
  const [results, setResults] = useState<CanadaMarketResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.productDescription) { setSnapshot(data); return; }
      }
    } catch {}
    setChecked(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    setChecked(true);

    // Check cache — skip API if product hasn't changed
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { key, results: cachedResults, ts } = JSON.parse(cached);
        const fresh = Date.now() - ts < 24 * 60 * 60 * 1000; // 24h TTL
        if (fresh && key === snapshot.productDescription) {
          setResults((Array.isArray(cachedResults) ? cachedResults : []).sort(sortByDemand));
          setLoading(false);
          return;
        }
      }
    } catch {}

    fetch('/api/canada-explorer/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const arr = (Array.isArray(data) ? data : []).sort(sortByDemand);
        setResults(arr);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ key: snapshot.productDescription, results: arr, ts: Date.now() })); } catch {}
      })
      .catch(() => setError('Analysis failed. Please try again.'))
      .finally(() => setLoading(false));
  }, [snapshot]);

  function handleSelect(province: string) {
    setSelected(province);
    setConfirmed(false);
    const market = results.find((r) => r.province === province);
    if (market) localStorage.setItem(FOCUS_KEY, JSON.stringify(market));
  }

  function handleConfirm() {
    setConfirmed(true);
  }

  function handleContinue() {
    router.push('/dashboard');
  }

  if (checked && !snapshot) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <h1 className="text-xl font-bold">Complete your business profile first</h1>
          <p className="text-sm text-muted-foreground">We need to know about your product to find the best Canadian markets.</p>
          <Link href="/dashboard?view=profile">
            <Button size="lg" className="gap-2">Set up your profile <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <WorkflowBanner
        step={2}
        totalSteps={4}
        label="Canada Market Explorer"
        contextChip={selected ? `${selected} selected` : snapshot?.productDescription?.slice(0, 40) ?? undefined}
        ctaLabel={undefined}
        ctaHref={undefined}
      />
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Canada Market Explorer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Based on your profile, here are your strongest domestic expansion opportunities.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border p-5 h-56 animate-pulse bg-muted/30" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
        </div>
      )}

      {/* Confirmation panel */}
      {confirmed && selected && (
        <Card className="mb-6 border-[#01696f] bg-[#01696f]/5">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#01696f]/10">
                <Globe className="h-5 w-5 text-[#01696f]" />
              </div>
              <h3 className="text-lg font-bold">{selected} selected as your Canada focus</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Mercorama will now help you find the best global markets for your product.
              </p>
              <Button size="lg" className="gap-2 mt-1" onClick={handleContinue}>
                Find Global Opportunities <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((market) => {
            const isSelected = selected === market.province;
            const demand = DEMAND_STYLE[market.demandLevel] ?? DEMAND_STYLE.medium;
            return (
              <Card
                key={market.province}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected ? 'border-[#01696f] ring-2 ring-[#01696f]/20' : 'hover:border-[#01696f]/40',
                )}
                onClick={() => handleSelect(market.province)}
              >
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{market.province}</h3>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', demand.className)}>{demand.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{market.rationale}</p>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors',
                      isSelected ? 'bg-[#01696f] border-[#01696f]' : 'border-border',
                    )}>
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                  <div className="rounded-md bg-[#01696f]/5 border border-[#01696f]/20 px-3 py-2">
                    <p className="text-xs font-medium text-[#01696f] dark:text-[#4f98a3]">{market.recommendedEntryStrategy}</p>
                  </div>
                  {market.targetChannels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {market.targetChannels.map((ch, j) => (
                        <span key={j} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{ch}</span>
                      ))}
                    </div>
                  )}
                  {market.keyBuyersOrRetailers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Key Buyers</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{market.keyBuyersOrRetailers.join(' · ')}</p>
                    </div>
                  )}
                  <div className="flex gap-4 pt-1 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />Logistics: <span className={cn('font-medium', LEVEL_STYLE[market.logisticsComplexity])}>{market.logisticsComplexity}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />Competition: <span className={cn('font-medium', LEVEL_STYLE[market.competitionLevel])}>{market.competitionLevel}</span>
                    </span>
                  </div>
                  {isSelected && !confirmed && (
                    <Button size="sm" className="w-full gap-1.5 mt-1" onClick={(e) => { e.stopPropagation(); handleConfirm(); }}>
                      Select {market.province} as my focus <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
