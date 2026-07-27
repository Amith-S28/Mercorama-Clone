"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getCountryTradeHistory,
  getCountryHsBreakdown,
  getAllTrackedTradeCountries,
} from "@/lib/country-trade-history";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ResizableCard } from "@/components/ui/ResizableCard";
import {
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Layers,
  Filter,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { snappy } from "@/lib/animation/presets";

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
  "All",
  "Industrial & Machinery",
  "Tech & Electronics",
  "Food & CPG",
  "Minerals & Energy",
  "Chemical & Medical",
  "Textiles & Goods",
];

export function CountryTradeHistoryDashboard({
  countryIso3 = "JPN",
}: CountryTradeHistoryDashboardProps) {
  const [selectedIso3, setSelectedIso3] = useState<string>(
    countryIso3.toUpperCase(),
  );
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [flowView, setFlowView] = useState<"exports" | "imports">("exports");

  const trackedCountries = useMemo(() => getAllTrackedTradeCountries(), []);

  const history = useMemo(
    () => getCountryTradeHistory(selectedIso3),
    [selectedIso3],
  );
  const hsBreakdown = useMemo(
    () => getCountryHsBreakdown(selectedIso3),
    [selectedIso3],
  );

  // Find the latest record with valid non-zero trade volume
  const latest = useMemo(() => {
    if (!history || history.timeSeries.length === 0) return null;
    const validRecords = history.timeSeries.filter(
      (item) => item.exportsUsd > 0 || item.importsUsd > 0,
    );
    if (validRecords.length > 0) {
      return validRecords[validRecords.length - 1];
    }
    return history.timeSeries[history.timeSeries.length - 1];
  }, [history]);

  const filteredCategories = useMemo(() => {
    if (!hsBreakdown) return [];
    const list =
      flowView === "exports" ? hsBreakdown.topExports : hsBreakdown.topImports;
    if (selectedSector === "All") return list;
    return list.filter((item) => item.sector === selectedSector);
  }, [hsBreakdown, flowView, selectedSector]);

  // Filter chart data to non-zero trade years so chart doesn't drop to 0 at the end
  const chartData = useMemo(() => {
    if (!history) return [];
    return history.timeSeries
      .filter((item) => item.exportsUsd > 0 || item.importsUsd > 0)
      .map((item) => ({
        year: item.year,
        Imports: Number((item.importsUsd / 1e9).toFixed(1)), // in Billions
        Exports: Number((item.exportsUsd / 1e9).toFixed(1)), // in Billions
        Balance: Number((item.netBalanceUsd / 1e9).toFixed(1)),
      }));
  }, [history]);

  if (!history || !latest || !hsBreakdown) return null;

  return (
    <motion.div {...snappy} className="flex flex-col gap-6 font-sans">
      {/* Header & Market Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="mono-label text-xs uppercase tracking-widest text-zinc-400 font-medium">
              Country Trade History & HS Breakdown
            </span>
            <LiveIndicator
              origin="live"
              sourceName="UN Comtrade / World Bank"
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#fa4c14]" />
            {history.name} ({history.iso3}) Trade Analytics
          </h2>
        </div>

        {/* Country Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="country-selector"
            className="text-xs font-mono uppercase text-zinc-400 font-medium"
          >
            Market:
          </label>
          <select
            id="country-selector"
            value={selectedIso3}
            onChange={(e) => setSelectedIso3(e.target.value)}
            className="h-9 rounded-xl border border-white/15 bg-zinc-900/90 px-3 text-xs font-semibold text-white shadow-md outline-none focus:border-[#fa4c14] focus:ring-1 focus:ring-[#fa4c14] transition-all cursor-pointer"
          >
            {trackedCountries.map((c) => (
              <option key={c.iso3} value={c.iso3} className="bg-zinc-900 text-white">
                {c.name} ({c.iso3})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md p-4 shadow-xl flex flex-col gap-1 hover:border-white/20 transition-all">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-medium">
            {latest.year} Exports
          </span>
          <span className="text-xl font-bold text-white tracking-tight">
            {formatUsdShort(latest.exportsUsd)}
          </span>
          <span
            className={cn(
              "text-xs font-semibold inline-flex items-center gap-0.5 mt-0.5",
              latest.yoyExportGrowthPct >= 0
                ? "text-[#00ff66]"
                : "text-[#ff3333]",
            )}
          >
            {latest.yoyExportGrowthPct >= 0 ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {latest.yoyExportGrowthPct}% YoY
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md p-4 shadow-xl flex flex-col gap-1 hover:border-white/20 transition-all">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-medium">
            {latest.year} Imports
          </span>
          <span className="text-xl font-bold text-white tracking-tight">
            {formatUsdShort(latest.importsUsd)}
          </span>
          <span
            className={cn(
              "text-xs font-semibold inline-flex items-center gap-0.5 mt-0.5",
              latest.yoyImportGrowthPct >= 0
                ? "text-[#00ff66]"
                : "text-[#ff3333]",
            )}
          >
            {latest.yoyImportGrowthPct >= 0 ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {latest.yoyImportGrowthPct}% YoY
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md p-4 shadow-xl flex flex-col gap-1 hover:border-white/20 transition-all">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-medium">
            Net Trade Balance
          </span>
          <span
            className={cn(
              "text-xl font-bold tracking-tight",
              latest.netBalanceUsd >= 0
                ? "text-[#00ff66]"
                : "text-[#ff3333]",
            )}
          >
            {latest.netBalanceUsd >= 0 ? "+" : ""}
            {formatUsdShort(latest.netBalanceUsd)}
          </span>
          <span className="text-xs text-zinc-400 font-mono mt-0.5">
            {latest.netBalanceUsd >= 0 ? "Trade Surplus" : "Trade Deficit"}
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md p-4 shadow-xl flex flex-col gap-1 hover:border-white/20 transition-all">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-medium">
            Trade Openness
          </span>
          <span className="text-xl font-bold text-white tracking-tight">
            {latest.tradePctGdp}%
          </span>
          <span className="text-xs text-zinc-400 font-mono mt-0.5">% of GDP</span>
        </div>
      </div>

      {/* 10-Year Historical Chart */}
      <ResizableCard defaultHeight={360} minHeight={280} maxHeight={600}>
        <div className="flex flex-col gap-3 h-full rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#fa4c14]" />
              10-Year Trade Volume Trends ({chartData[0]?.year ?? 2015}–{latest.year}, in USD Billions)
            </span>
            <span className="text-xs font-mono text-zinc-400">
              UN COMTRADE / WDI
            </span>
          </div>

          <div className="flex-1 w-full min-h-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorExports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: "#a1a1aa" }}
                  stroke="#3f3f46"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#a1a1aa" }}
                  stroke="#3f3f46"
                  unit="B"
                />
                <Tooltip
                  formatter={(val) => [`$${Number(val ?? 0).toFixed(1)}B`, ""]}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }} />
                <Area
                  type="monotone"
                  dataKey="Exports"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorExports)"
                />
                <Area
                  type="monotone"
                  dataKey="Imports"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorImports)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ResizableCard>

      {/* Commodity Breakdown by HS Code */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#fa4c14]" />
              HS Product Category Breakdown
            </h3>
            <p className="text-xs text-zinc-400">
              Top traded commodity chapters for {history.name} by Harmonized
              System (HS) code
            </p>
          </div>

          {/* Toggle Flow: Exports vs Imports */}
          <div className="flex items-center gap-2 p-1 bg-zinc-950/60 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => setFlowView("exports")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all",
                flowView === "exports"
                  ? "bg-[#fa4c14] text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              Top Exports
            </button>
            <button
              type="button"
              onClick={() => setFlowView("imports")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all",
                flowView === "imports"
                  ? "bg-[#fa4c14] text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              Top Imports
            </button>
          </div>
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-mono uppercase text-zinc-400 font-medium shrink-0">
            Sector:
          </span>
          {SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => setSelectedSector(sector)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-xl whitespace-nowrap transition-all border",
                selectedSector === sector
                  ? "bg-white text-black font-semibold border-white shadow-sm"
                  : "bg-zinc-800/60 text-zinc-300 border-white/10 hover:bg-zinc-700/60 hover:text-white",
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
              className="flex flex-col gap-2.5 rounded-xl border border-white/10 p-4 bg-zinc-950/40 hover:bg-zinc-800/40 hover:border-white/20 transition-all shadow-md group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#fa4c14]/15 text-[#fa4c14] border border-[#fa4c14]/30">
                    HS {item.hsCode}
                  </span>
                  <span className="text-xs font-mono uppercase text-zinc-400">
                    {item.sector}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold inline-flex items-center",
                    item.yoyChangePct >= 0
                      ? "text-[#00ff66]"
                      : "text-[#ff3333]",
                  )}
                >
                  {item.yoyChangePct >= 0 ? "+" : ""}
                  {item.yoyChangePct}%
                </span>
              </div>

              <span className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#fa4c14] transition-colors">
                {item.hsName}
              </span>

              {/* Progress Bar & Value */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      flowView === "exports"
                        ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
                    )}
                    style={{ width: `${Math.min(100, item.sharePct * 3.5)}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                  <span className="font-bold text-white">
                    {formatUsdShort(item.valueUsd)}
                  </span>
                  <span className="text-zinc-400">({item.sharePct}%)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

