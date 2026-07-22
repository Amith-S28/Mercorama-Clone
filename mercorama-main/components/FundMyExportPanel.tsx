// components/FundMyExportPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Lock, ChevronDown, ExternalLink, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';
import { getCacheKey, getCachedResults, setCachedResults } from '@/lib/fundMyExportCache';
import { getRunStatus } from '@/lib/fundMyExportRuns';
import type { FundingContext, FundingMatch, FundingMatchResult } from '@/lib/fundMyExport';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  context: FundingContext;
  isGrowthPlan: boolean;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fitLabel(score: number): { label: string; className: string } {
  if (score >= 70) return { label: 'Strong Fit', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  if (score >= 50) return { label: 'Likely Eligible', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
  return { label: 'Check Eligibility', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    grant: 'Grant',
    loan: 'Loan',
    insurance: 'Insurance',
    guarantee: 'Guarantee',
    advisory: 'Advisory',
  };
  return map[type] ?? type;
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ match, surface = 'inline' }: { match: FundingMatch; surface?: 'inline' | 'standalone' }) {
  const fit = fitLabel(match.match_score);

  function handleApply() {
    trackEvent('fund_my_export_applied', {
      programName: match.program.name,
      fitScore: match.match_score,
      surface,
    });
    window.open(match.program.website_url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{match.program.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {match.program.provider} · {typeLabel(match.program.program_type)}
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

      <div className="flex items-center justify-between pt-1 border-t gap-3">
        <span className="text-xs text-muted-foreground">
          {match.program.eligible_countries.length > 0
            ? `Available for: ${match.program.eligible_countries.slice(0, 3).join(', ')}`
            : 'Available: any market'}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs shrink-0"
          onClick={handleApply}
        >
          Apply Now
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Locked state ─────────────────────────────────────────────────────────────

function LockedPanel({ className }: { className?: string }) {
  const mockPrograms = [
    { name: 'CanExport SMEs Grant', amount: 'Up to $75,000', type: 'Non-repayable grant' },
    { name: 'EDC Export Guarantee', amount: 'Up to $500,000', type: 'Bank guarantee' },
    { name: 'BDC Working Capital Loan', amount: 'Up to $100,000', type: 'Business loan' },
  ];

  return (
    <div className={cn(
      'rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 p-5',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
          <DollarSign className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">Fund My Export</span>
          <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Growth Plan
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        See every grant and program you qualify for — up to $165,000 may be available for this market entry
      </p>

      {/* Blurred mock cards */}
      <div className="relative space-y-2 mb-4">
        <div className="pointer-events-none select-none blur-sm space-y-2">
          {mockPrograms.map((p) => (
            <div key={p.name} className="rounded-lg border bg-white dark:bg-gray-900 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-gray-500">{p.type}</p>
              </div>
              <span className="text-sm font-bold text-emerald-700">{p.amount}</span>
            </div>
          ))}
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px]">
          <Lock className="h-5 w-5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Unlock with Growth Plan</span>
        </div>
      </div>

      <Link href="/beta" onClick={() => trackEvent('fund_my_export_upgrade_clicked', { source: 'inline_panel' })}>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          Upgrade to Growth to unlock Fund My Export →
        </Button>
      </Link>

      <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
        CanExport SMEs · AgriMarketing · EDC · BDC · 16 more programs
      </p>
    </div>
  );
}

// ─── Unlocked state ───────────────────────────────────────────────────────────

function UnlockedPanel({
  context,
  userId,
  className,
}: {
  context: FundingContext;
  userId: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<FundingMatchResult | null>(null);
  const [runsUsed, setRunsUsed] = useState(0);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      // Passive load — no run counted
      const query = {
        sector: context.sector ?? '',
        destination_country: context.targetMarket ?? '',
        revenue_cad: null,
        employees: null,
        export_value_usd: context.dealValue ?? null,
        product_description: context.productDescription ?? '',
        has_fta: false,
      };

      const cacheKey = getCacheKey(query);
      const cached = await getCachedResults(cacheKey);

      if (cached) {
        setResult(cached);
        return;
      }

      // Cache miss: fetch from API (passive — does not call checkAndIncrementRun)
      const res = await fetch('/api/fund-my-export/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, passive: true }),
      });

      if (res.ok) {
        const data = await res.json() as FundingMatchResult;
        await setCachedResults(cacheKey, data);
        setResult(data);
      }
    } catch {
      // Passive — fail silently
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    void loadMatches();
    getRunStatus(userId)
      .then((s) => setRunsUsed(s.runs_used))
      .catch(() => {});
  }, [loadMatches, userId]);

  const matchCount = result?.matches.length ?? 0;

  return (
    <div className={cn('rounded-2xl border bg-card p-5', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-sm">Fund My Export</span>
          <span className="text-xs text-muted-foreground">
            — {runsUsed} / 20 runs used this month
          </span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform', expanded && 'rotate-180')} />
      </button>

      {/* Collapsed summary */}
      {!expanded && !loading && result && (
        <p className="mt-1.5 text-xs text-muted-foreground pl-6">
          {matchCount} programs matched
        </p>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
              <p className="text-center text-xs text-muted-foreground">
                Matching you to available programs...
              </p>
            </div>
          )}

          {!loading && (!result || result.matches.length === 0) && (
            <div className="rounded-xl border border-dashed p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No exact program matches — but TCS Advisory is always free.
              </p>
              <a
                href="https://www.tradecommissioner.gc.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Contact your nearest Trade Commissioner →
              </a>
            </div>
          )}

          {!loading && result && result.matches.length > 0 && (
            <>
              {result.matches.map((match) => (
                <MatchCard key={match.program.id} match={match} />
              ))}

              <div className="rounded-xl bg-muted/40 border p-4 text-center space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Not sure where to start? The Trade Commissioner Service offers free advisory to all Canadian exporters.
                </p>
                <a
                  href="https://www.tradecommissioner.gc.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Contact TCS →
                </a>
              </div>

              <p className="text-center text-[11px] text-muted-foreground border-t pt-3">
                Programs auto-synced weekly · Powered by Mercorama Fund My Export
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function FundMyExportPanel({ context, isGrowthPlan, className }: Props) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('fund_my_export_viewed', {
      plan: isGrowthPlan ? 'growth' : 'starter',
      surface: 'inline',
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [isGrowthPlan]);

  if (!isGrowthPlan) {
    return <LockedPanel className={className} />;
  }

  if (!userId) return null;

  return <UnlockedPanel context={context} userId={userId} className={className} />;
}
