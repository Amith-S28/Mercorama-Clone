// app/freight-connect/analytics/page.tsx
// Growth plan only.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, TrendingUp, Globe, BarChart3, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAuthUser } from '@/lib/auth-store';
import type { LaneAnalyticsSummary } from '@/lib/freightConnectQuotes';

// ─── Types from API ────────────────────────────────────────────────────────────

interface AnalyticsData {
  lane_summary:    LaneAnalyticsSummary[];
  mode_breakdown:  Record<string, number>;
  benchmarks:      { market: string; mode: string; rates: string[] }[];
  total_quotes:    number;
}

// ─── Upgrade gate ──────────────────────────────────────────────────────────────

function UpgradeGate() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto">
        <Zap className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-bold">Freight Connect Analytics</h2>
      <p className="text-muted-foreground">
        Lane analytics, mode breakdown, and rate benchmarking are available on the Growth plan ($249/mo).
      </p>
      <Link href="/beta">
        <Button className="gap-2">Upgrade to Growth →</Button>
      </Link>
    </div>
  );
}

// ─── Mode breakdown bar ────────────────────────────────────────────────────────

function ModeBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize font-medium">{label}</span>
        <span className="text-muted-foreground">{count} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FreightAnalyticsPage() {
  const router = useRouter();
  const user   = getAuthUser();
  const isGrowth = user?.plan === 'team' || user?.plan === 'enterprise';

  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isGrowth) { setLoading(false); return; }
    try {
      const res = await fetch('/api/freight-connect/analytics');
      if (res.status === 403) { setLoading(false); return; }
      if (!res.ok) throw new Error('Failed');
      const json = await res.json() as AnalyticsData;
      setData(json);
    } catch {
      toast.error('Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, [isGrowth]);

  useEffect(() => { void load(); }, [load]);

  if (!isGrowth) return <UpgradeGate />;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.total_quotes === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
        <p className="text-lg font-semibold">No quote history yet</p>
        <p className="text-muted-foreground text-sm">Submit your first quote request to start tracking analytics.</p>
        <Link href="/freight-connect"><Button variant="outline">Find a Forwarder →</Button></Link>
      </div>
    );
  }

  const totalModeCount = Object.values(data.mode_breakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Freight Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.total_quotes} total quote request{data.total_quotes !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Globe,
            label: 'Markets Explored',
            value: new Set(data.lane_summary.map((l) => l.target_market)).size,
          },
          {
            icon: TrendingUp,
            label: 'Response Rate',
            value: data.lane_summary.length > 0
              ? `${Math.round((data.lane_summary.reduce((s, l) => s + l.response_rate, 0) / data.lane_summary.length) * 100)}%`
              : '—',
          },
          {
            icon: BarChart3,
            label: 'Total Quotes',
            value: data.total_quotes,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <Icon className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lane summary */}
        {data.lane_summary.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-4">Top Lanes</h2>
            <div className="space-y-3">
              {data.lane_summary.slice(0, 5).map((lane) => (
                <div key={`${lane.target_market}-${lane.shipping_mode}`} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{lane.target_market}</p>
                    <p className="text-xs text-muted-foreground capitalize">{lane.shipping_mode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{lane.quote_count} quotes</p>
                    <p className={cn(
                      'text-xs font-medium',
                      lane.response_rate >= 0.7 ? 'text-green-700 dark:text-green-400' :
                      lane.response_rate >= 0.4 ? 'text-amber-600 dark:text-amber-400' :
                      'text-muted-foreground'
                    )}>
                      {Math.round(lane.response_rate * 100)}% response rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode breakdown */}
        {totalModeCount > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-4">Shipping Mode Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(data.mode_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([mode, count]) => (
                  <ModeBar key={mode} label={mode} count={count} total={totalModeCount} />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Rate benchmarking */}
      {data.benchmarks.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-1">Rate Benchmarking</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Based on responded quotes where you chose to connect with a forwarder.
          </p>
          <div className="space-y-3">
            {data.benchmarks.map((b) => (
              <div key={`${b.market}-${b.mode}`} className="rounded-lg bg-muted/50 p-4 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">{b.market} · <span className="capitalize">{b.mode}</span></p>
                  <p className="text-xs text-muted-foreground">
                    Last {b.rates.length} quote{b.rates.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  {b.rates.map((rate, i) => (
                    <p key={i} className="text-sm font-medium text-primary">{rate}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
