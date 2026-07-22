'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  getCountryTradeHistory,
  getCountryHsBreakdown,
  getAllTrackedTradeCountries,
} from '@/lib/country-trade-history';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { ResizableCard } from '@/components/ui/ResizableCard';
import { ArrowUpRight, ArrowDownRight, Globe, Layers, Filter } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { snappy } from '@/lib/animation/presets';

export interface CountryTradeHistoryDashboardProps {
  countryIso3?: string;
}

function formatUsdShort(valueUsd: number): string {
  if (valueUsd >= 1e12) return `$${(valueUsd / 1e12).toFixed(2)}T`;
  if (valueUsd >= 1e9) return `$${(valueUsd / 1e9).toFixed(1)}B`;
  if (valueUsd >= 1e6) return `$${(valueUsd / 1e6).toFixed(0)}M`;
  return `$${valueUsd.toLocaleString()}`;
}

const SECTORS = [
  'All',
  'Industrial & Machinery',
  'Tech & Electronics',
  'Food & CPG',
  'Minerals & Energy',
  'Chemical & Medical',
  'Textiles & Goods',
];

export function CountryTradeHistoryDashboard({
  countryIso3 = 'JPN',
}: CountryTradeHistoryDashboardProps) {
  const [selectedIso3, setSelectedIso3] = useState<string>(countryIso3.toUpperCase());
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [flowView, setFlowView] = useState<'exports' | 'imports'>('exports');

  const trackedCountries = useMemo(() => getAllTrackedTradeCountries(), []);

  const history = useMemo(() => getCountryTradeHistory(selectedIso3), [selectedIso3]);
  const hsBreakdown = useMemo(() => getCountryHsBreakdown(selectedIso3), [selectedIso3]);

  const latest = useMemo(() => {
    if (!history || history.timeSeries.length === 0) return null;
    return history.timeSeries[history.timeSeries.length - 1];
  }, [history]);

  const filteredCategories = useMemo(() => {
    if (!hsBreakdown) return [];
    const list = flowView === 'exports' ? hsBreakdown.topExports : hsBreakdown.topImports;
    if (selectedSector === 'All') return list;
    return list.filter((item) => item.sector === selectedSector);
  }, [hsBreakdown, flowView, selectedSector]);

  const chartData = useMemo(() => {
    if (!history) return [];
    return history.timeSeries.map((item) => ({
      year: item.year,
      Imports: item.importsUsd / 1e9, // in Billions
      Exports: item.exportsUsd / 1e9, // in Billions
      Balance: item.netBalanceUsd / 1e9,
    }));
  }, [history]);

  if (!history || !latest || !hsBreakdown) return null;

  return (
    <motion.div {...snappy} className="flex flex-col gap-6">
      {/* Header & Market Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="mono-label text-xs uppercase tracking-widest text-obsidian/50">
              Country Trade History & HS Breakdown
            </span>
            <LiveIndicator origin="live" sourceName="UN Comtrade / World Bank" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-obsidian flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            {history.name} ({history.iso3}) Trade Analytics
          </h2>
        </div>

        {/* Country Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="country-selector" className="text-xs font-mono uppercase text-obsidian/50">
            Market:
          </label>
          <select
            id="country-selector"
            value={selectedIso3}
            onChange={(e) => setSelectedIso3(e.target.value)}
            className="h-9 rounded-2xl border border-border-light bg-paper-white px-3 text-xs font-medium text-obsidian shadow-sm outline-none focus:border-accent"
          >
            {trackedCountries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name} ({c.iso3})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-border-light bg-paper-white p-4 shadow-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase tracking-widest text-obsidian/45">
            2024 Exports
          </span>
          <span className="text-lg font-bold text-obsidian">
            {formatUsdShort(latest.exportsUsd)}
          </span>
          <span
            className={cn(
              'text-xs font-medium inline-flex items-center gap-0.5',
              latest.yoyExportGrowthPct >= 0 ? 'text-status-healthy' : 'text-status-down'
            )}
          >
            {latest.yoyExportGrowthPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {latest.yoyExportGrowthPct}% YoY
          </span>
        </div>

        <div className="rounded-3xl border border-border-light bg-paper-white p-4 shadow-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase tracking-widest text-obsidian/45">
            2024 Imports
          </span>
          <span className="text-lg font-bold text-obsidian">
            {formatUsdShort(latest.importsUsd)}
          </span>
          <span
            className={cn(
              'text-xs font-medium inline-flex items-center gap-0.5',
              latest.yoyImportGrowthPct >= 0 ? 'text-status-healthy' : 'text-status-down'
            )}
          >
            {latest.yoyImportGrowthPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {latest.yoyImportGrowthPct}% YoY
          </span>
        </div>

        <div className="rounded-3xl border border-border-light bg-paper-white p-4 shadow-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase tracking-widest text-obsidian/45">
            Net Trade Balance
          </span>
          <span
            className={cn(
              'text-lg font-bold',
              latest.netBalanceUsd >= 0 ? 'text-status-healthy' : 'text-status-down'
            )}
          >
            {latest.netBalanceUsd >= 0 ? '+' : ''}
            {formatUsdShort(latest.netBalanceUsd)}
          </span>
          <span className="text-xs text-obsidian/50 font-mono">
            {latest.netBalanceUsd >= 0 ? 'Trade Surplus' : 'Trade Deficit'}
          </span>
        </div>

        <div className="rounded-3xl border border-border-light bg-paper-white p-4 shadow-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase tracking-widest text-obsidian/45">
            Trade Openness
          </span>
          <span className="text-lg font-bold text-obsidian">
            {latest.tradePctGdp}%
          </span>
          <span className="text-xs text-obsidian/50 font-mono">
            % of GDP
          </span>
        </div>
      </div>

      {/* 10-Year Historical Chart */}
      <ResizableCard defaultHeight={360} minHeight={280} maxHeight={600}>
        <div className="flex flex-col gap-3 h-full">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-obsidian flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              10-Year Trade Volume Trends (2015–2024, in USD Billions)
            </span>
            <span className="text-xs font-mono text-obsidian/45">UN COMTRADE / WDI</span>
          </div>

          <div className="flex-1 w-full min-h-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" unit="B" />
                <Tooltip
                  formatter={(val) => [`$${Number(val ?? 0).toFixed(1)}B`, '']}
                  contentStyle={{
                    backgroundColor: 'var(--paper-white)',
                    borderColor: 'var(--border-light)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="Exports"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExports)"
                />
                <Area
                  type="monotone"
                  dataKey="Imports"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorImports)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ResizableCard>

      {/* Commodity Breakdown by HS Code */}
      <div className="rounded-3xl border border-border-light bg-paper-white p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light pb-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-semibold text-obsidian flex items-center gap-2">
              <Filter className="h-4 w-4 text-accent" />
              HS Product Category Breakdown
            </h3>
            <p className="text-xs text-obsidian/60">
              Top traded commodity chapters for {history.name} by Harmonized System (HS) code
            </p>
          </div>

          {/* Toggle Flow: Exports vs Imports */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlowView('exports')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                flowView === 'exports'
                  ? 'bg-accent text-paper-white shadow-sm'
                  : 'bg-paper-white text-obsidian/70 border border-border-light hover:bg-accent-muted'
              )}
            >
              Top Exports
            </button>
            <button
              type="button"
              onClick={() => setFlowView('imports')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                flowView === 'imports'
                  ? 'bg-accent text-paper-white shadow-sm'
                  : 'bg-paper-white text-obsidian/70 border border-border-light hover:bg-accent-muted'
              )}
            >
              Top Imports
            </button>
          </div>
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono uppercase text-obsidian/45 shrink-0">
            Sector:
          </span>
          {SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => setSelectedSector(sector)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-xl whitespace-nowrap transition-colors border',
                selectedSector === sector
                  ? 'bg-obsidian text-paper-white border-obsidian'
                  : 'bg-paper-white text-obsidian/60 border-border-light hover:bg-accent-muted'
              )}
            >
              {sector}
            </button>
          ))}
        </div>

        {/* HS Category List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredCategories.map((item) => (
            <div
              key={item.hsCode}
              className="flex flex-col gap-2 rounded-2xl border border-border-light p-4 bg-paper-white/50 hover:bg-accent-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-accent-muted text-accent border border-accent/20">
                    HS {item.hsCode}
                  </span>
                  <span className="text-xs font-mono uppercase text-obsidian/45">
                    {item.sector}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-xs font-medium inline-flex items-center',
                    item.yoyChangePct >= 0 ? 'text-status-healthy' : 'text-status-down'
                  )}
                >
                  {item.yoyChangePct >= 0 ? '+' : ''}
                  {item.yoyChangePct}%
                </span>
              </div>

              <span className="text-sm font-semibold text-obsidian line-clamp-1">
                {item.hsName}
              </span>

              {/* Progress Bar & Value */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex-1 h-2 rounded-full bg-obsidian/5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      flowView === 'exports' ? 'bg-blue-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min(100, item.sharePct * 3.5)}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                  <span className="font-bold text-obsidian">
                    {formatUsdShort(item.valueUsd)}
                  </span>
                  <span className="text-obsidian/45">({item.sharePct}%)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
