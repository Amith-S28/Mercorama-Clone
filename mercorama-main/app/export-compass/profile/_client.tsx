'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Shield,
  Ship, Globe2, BookOpen, Lightbulb, Briefcase, ExternalLink,
  AlertTriangle, CheckCircle2, Loader2, BarChart3,
} from 'lucide-react';
import { Button }                          from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn }                              from '@/lib/utils';
import type { DeepMarketProfile }          from '@/lib/market-profile';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtUSD(val: number | null): string {
  if (val === null) return '—';
  if (val >= 1e9) return `USD ${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `USD ${(val / 1e6).toFixed(1)}M`;
  return `USD ${val.toLocaleString()}`;
}

function fmtCAD(val: number | null): string {
  if (val === null) return '—';
  if (val >= 1e9) return `CAD ${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `CAD ${(val / 1e6).toFixed(1)}M`;
  return `CAD ${val.toLocaleString()}`;
}

function growthIcon(g: number | null) {
  if (g === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (g > 0.02)  return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (g < -0.02) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function growthStr(g: number | null): string {
  if (g === null) return 'Unknown';
  return `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}% CAGR`;
}

function riskColor(band: string) {
  if (band === 'Low')    return 'text-green-700 dark:text-green-400';
  if (band === 'High')   return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

function riskBg(band: string) {
  if (band === 'Low')    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  if (band === 'High')   return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
}

function freightColor(band: string) {
  if (band === 'Low')    return 'text-green-700 dark:text-green-400';
  if (band === 'High')   return 'text-red-500 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

function complexityColor(band: string | null) {
  if (band === 'Low')    return 'text-green-700 dark:text-green-400';
  if (band === 'High')   return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

// ── Section tabs ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'demand',    label: 'Market Demand',    icon: BarChart3   },
  { id: 'tariff',    label: 'Tariff & Access',  icon: Globe2      },
  { id: 'risk',      label: 'Risk & Payment',   icon: Shield      },
  { id: 'logistics', label: 'Logistics',        icon: Ship        },
  { id: 'channels',  label: 'Channels',         icon: Briefcase   },
  { id: 'cultural',  label: 'Cultural',         icon: BookOpen    },
  { id: 'advisory',  label: 'Advisory',         icon: Lightbulb   },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Section components ─────────────────────────────────────────────────────────

function DemandSection({ profile }: { profile: DeepMarketProfile }) {
  const { demand } = profile;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Import Market Size</p>
            <p className="text-2xl font-bold tabular-nums">{fmtUSD(demand.importValueUSD)}</p>
            {demand.importValueYear && (
              <p className="text-xs text-muted-foreground mt-1">{demand.importValueYear} · Global imports</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">5-Year Growth Trend</p>
            <div className="flex items-center gap-2 mt-1">
              {growthIcon(demand.importGrowth5y)}
              <p className="text-2xl font-bold tabular-nums">{growthStr(demand.importGrowth5y)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Import CAGR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Canada&apos;s Current Exports</p>
            <p className="text-2xl font-bold tabular-nums">{fmtCAD(demand.caExportValueCAD)}</p>
            {demand.caExportYear && (
              <p className="text-xs text-muted-foreground mt-1">{demand.caExportYear} · CA to {profile.countryName}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-muted/20 px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span>
          Import demand data: {demand.dataSource}.
          {demand.caExportValueCAD === null && ' Canadian export data pending StatCan backfill.'}
          {demand.importValueUSD === null && ' UN Comtrade backfill pending for this market.'}
        </span>
      </div>
    </div>
  );
}

function TariffSection({ profile }: { profile: DeepMarketProfile }) {
  const { tariff } = profile;
  const hasFTA = tariff.ftaAgreement !== null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className={cn('border-2', hasFTA ? 'border-green-200 dark:border-green-800' : 'border-muted')}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-2">FTA Agreement</p>
            {hasFTA ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-xl font-bold text-green-700 dark:text-green-400">{tariff.ftaAgreement}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Minus className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-xl font-bold text-muted-foreground">None</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Canada–{profile.countryName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-2">Applicable Rate</p>
            <p className="text-xl font-bold">{tariff.ftaRate}</p>
            {tariff.mfnRate && (
              <p className="text-xs text-muted-foreground mt-1">MFN rate: {tariff.mfnRate}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-foreground">
        {tariff.notes}
      </div>
    </div>
  );
}

function RiskSectionView({ profile }: { profile: DeepMarketProfile }) {
  const { risk } = profile;
  return (
    <div className="space-y-5">
      <div className={cn('rounded-xl border px-5 py-4', riskBg(risk.band))}>
        <div className="flex items-center gap-3 mb-3">
          <Shield className={cn('h-6 w-6', riskColor(risk.band))} />
          <span className={cn('text-2xl font-bold', riskColor(risk.band))}>{risk.band} Risk</span>
        </div>
        <ul className="space-y-1">
          {risk.riskFactors.map((f) => (
            <li key={f} className="text-sm flex items-start gap-2">
              <span className="text-muted-foreground shrink-0 mt-0.5">·</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Recommended Payment Method</p>
            <p className="font-semibold">{risk.paymentNorm}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Typical Payment Days</p>
            <p className="font-semibold">{risk.typicalDays}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogisticsSectionView({ profile }: { profile: DeepMarketProfile }) {
  const { logistics, regulatory } = profile;

  if (!logistics) {
    return (
      <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Logistics data not yet available for {profile.countryName}.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Departure Port</p>
            <p className="font-semibold">{logistics.departurePort}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Transit Time</p>
            <p className="font-semibold">{logistics.transitDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Freight Cost Band</p>
            <p className={cn('font-semibold', freightColor(logistics.freightBand))}>
              {logistics.freightBand}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="font-medium">Route: </span>
        {logistics.route}
      </div>

      {regulatory && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Regulatory / NTB Complexity</p>
            <p className={cn('font-semibold', complexityColor(regulatory))}>
              {regulatory} complexity
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Non-tariff barriers, labelling, certification requirements in {profile.countryName}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NarrativeSectionView({ text }: { text: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">
      {text}
    </div>
  );
}

function ProgramsSection({ profile }: { profile: DeepMarketProfile }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Government programs available to Canadian SMEs exporting to {profile.countryName}:
      </p>
      {profile.programs.map((prog) => (
        <a
          key={prog.name}
          href={prog.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors group"
        >
          <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5 group-hover:text-primary/80" />
          <div>
            <p className="font-medium text-sm group-hover:text-primary transition-colors">{prog.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{prog.description}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DeepMarketProfileClient({
  hs,
  country,
  product,
  backHref,
}: {
  hs:       string;
  country:  string;
  product:  string;
  backHref: string;
}) {
  const [profile, setProfile]   = useState<DeepMarketProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('demand');

  useEffect(() => {
    const params = new URLSearchParams({ hs, country, product });
    fetch(`/api/export-compass/market-profile?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<DeepMarketProfile>;
      })
      .then((data) => { setProfile(data); setLoading(false); })
      .catch((err) => { setError(String(err)); setLoading(false); });
  }, [hs, country, product]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Building market profile for {country}…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <p className="text-lg font-semibold mb-2">Could not load profile</p>
        <p className="text-muted-foreground text-sm mb-6">{error ?? 'Unknown error'}</p>
        <Link href={backHref}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Button>
        </Link>
      </div>
    );
  }

  function renderSection() {
    if (!profile) return null;
    switch (activeTab) {
      case 'demand':    return <DemandSection profile={profile} />;
      case 'tariff':    return <TariffSection profile={profile} />;
      case 'risk':      return <RiskSectionView profile={profile} />;
      case 'logistics': return <LogisticsSectionView profile={profile} />;
      case 'channels':  return <NarrativeSectionView text={profile.narrative.channels} />;
      case 'cultural':  return <NarrativeSectionView text={profile.narrative.cultural} />;
      case 'advisory':  return (
        <div className="space-y-5">
          <NarrativeSectionView text={profile.narrative.advisory} />
          <ProgramsSection profile={profile} />
        </div>
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Export Compass results
      </Link>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/3 px-6 py-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Deep Market Profile
            </p>
            <h1 className="text-xl font-bold">
              {profile.countryName}
              <span className="text-muted-foreground font-normal mx-2">·</span>
              <span className="text-muted-foreground text-base font-normal">{profile.productLabel}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              HS {profile.hs6Code}
              {profile.ftaAgreement && (
                <span className="ml-2 inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {profile.ftaAgreement}
                </span>
              )}
            </p>
          </div>
          <Link href="/dashboard?tool=deal-wizard">
            <Button size="sm" className="gap-1.5 mt-3 sm:mt-0">
              <Briefcase className="h-3.5 w-3.5" />
              Start a Deal
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Active section */}
      <div className="min-h-[260px]">
        {renderSection()}
      </div>

      {/* Footer */}
      <div className="mt-10 rounded-xl border bg-muted/20 px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Market profiles are assembled from UN Comtrade, Statistics Canada, USITC, and static trade reference data.
          Narrative sections are AI-generated. Verify tariff rates, regulatory requirements, and trade data with a
          licensed customs broker and the Trade Commissioner Service before making commercial decisions.
        </p>
      </div>
    </div>
  );
}
