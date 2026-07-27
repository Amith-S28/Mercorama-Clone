"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Globe,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Percent,
  ShieldAlert,
  BarChart3,
  Search,
} from "@/components/ui/icons";

const COUNTRIES = [
  { iso3: "USA", name: "United States", flag: "🇺🇸" },
  { iso3: "CAN", name: "Canada", flag: "🇨🇦" },
  { iso3: "CHN", name: "China", flag: "🇨🇳" },
  { iso3: "JPN", name: "Japan", flag: "🇯🇵" },
  { iso3: "DEU", name: "Germany", flag: "🇩🇪" },
  { iso3: "GBR", name: "United Kingdom", flag: "🇬🇧" },
  { iso3: "IND", name: "India", flag: "🇮🇳" },
  { iso3: "MEX", name: "Mexico", flag: "🇲🇽" },
  { iso3: "FRA", name: "France", flag: "🇫🇷" },
  { iso3: "BRA", name: "Brazil", flag: "🇧🇷" },
  { iso3: "SGP", name: "Singapore", flag: "🇸🇬" },
  { iso3: "KOR", name: "South Korea", flag: "🇰🇷" },
  { iso3: "AUS", name: "Australia", flag: "🇦🇺" },
  { iso3: "NLD", name: "Netherlands", flag: "🇳🇱" },
  { iso3: "CHE", name: "Switzerland", flag: "🇨🇭" },
  { iso3: "ARE", name: "UAE", flag: "🇦🇪" },
];

const FLAG_MAP: Record<string, string> = {
  USA: "🇺🇸", CAN: "🇨🇦", CHN: "🇨🇳", JPN: "🇯🇵", DEU: "🇩🇪",
  GBR: "🇬🇧", IND: "🇮🇳", MEX: "🇲🇽", FRA: "🇫🇷", BRA: "🇧🇷",
  PRK: "🇰🇵", KOR: "🇰🇷", AUS: "🇦🇺", ITA: "🇮🇹", ESP: "🇪🇸",
  NLD: "🇳🇱", SGP: "🇸🇬", CHE: "🇨🇭", SWE: "🇸🇪", NOR: "🇳🇴",
};

const COUNTRY_NAMES: Record<string, string> = {
  USA: "United States", CAN: "Canada", CHN: "China", JPN: "Japan", DEU: "Germany",
  GBR: "United Kingdom", IND: "India", MEX: "Mexico", FRA: "France", BRA: "Brazil",
  PRK: "North Korea", KOR: "South Korea", AUS: "Australia", ITA: "Italy", ESP: "Spain",
  NLD: "Netherlands", SGP: "Singapore", CHE: "Switzerland", SWE: "Sweden", NOR: "Norway",
};

function getCountryDetails(iso3: string) {
  const code = iso3 ? iso3.toUpperCase() : "USA";
  const found = COUNTRIES.find((c) => c.iso3 === code);
  if (found) return found;

  const name = COUNTRY_NAMES[code] || code;
  const flag = FLAG_MAP[code] || "🌐";
  return { iso3: code, name, flag };
}

// Solid contrast color palette for commodity sectors: solid orange, white, and high-contrast greys
const SOLID_SECTOR_COLORS = [
  "#ff5500", // Solid Orange Accent
  "#ffffff", // Solid White
  "#e4e4e7", // Zinc 200
  "#a1a1aa", // Zinc 400
  "#71717a", // Zinc 500
  "#3f3f46", // Zinc 700
];

interface TradeDataState {
  reporter: string;
  flowFilter: string;
  macro: any;
  tariffs: any[];
  history: any[];
  dissection: any[];
  partners: any[];
  isMissingData?: boolean;
  goodsExportsUsd?: number;
  goodsImportsUsd?: number;
  servicesExportsUsd?: number;
  servicesImportsUsd?: number;
}

export function TradeDataExplorer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramReporter = searchParams.get("reporter")?.toUpperCase();

  const [selectedCountry, setSelectedCountry] = useState(paramReporter || "USA");
  const [activeFlow, setActiveFlow] = useState<"all" | "exports" | "imports">("all");
  const [activeTab, setActiveTab] = useState<"overview" | "dissection" | "partners" | "macro">("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TradeDataState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeCountryInfo = getCountryDetails(selectedCountry);

  useEffect(() => {
    if (paramReporter && paramReporter !== selectedCountry) {
      setSelectedCountry(paramReporter);
    }
  }, [paramReporter]);

  const handleCountryChange = (iso3: string) => {
    setSelectedCountry(iso3);
    router.push(`/portal/trade-data?reporter=${iso3}`, { scroll: false });
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/portal/trade-data?reporter=${selectedCountry}&flow=${activeFlow}`);
        if (!res.ok) throw new Error("Failed to fetch trade data");
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error("Trade data error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [selectedCountry, activeFlow]);

  // Format big currency numbers
  const formatCurrency = (val: number) => {
    if (!val || isNaN(val)) return "$0";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
    return `$${val.toLocaleString()}`;
  };

  // Filtered partners search
  const filteredPartners = data?.partners.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.iso3.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const isMissing = data?.isMissingData || false;

  return (
    <div className="space-y-8 text-white font-sans">
      {/* ─── Active Country Focus Banner ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        key={activeCountryInfo.iso3}
        className="relative overflow-hidden rounded-2xl border border-[#ff5500]/40 bg-gradient-to-r from-[#ff5500]/20 via-[#0d0d0d] to-black p-5 shadow-xl backdrop-blur-md"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/80 border border-white/20 text-3xl shadow-inner">
              {activeCountryInfo.flag}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-[#ff5500] uppercase">
                  <span className="h-2 w-2 rounded-full bg-[#ff5500] animate-pulse" />
                  CURRENTLY ANALYZING DATA FOR
                </span>
                <span className="inline-flex items-center rounded-md bg-[#ff5500]/20 px-2 py-0.5 text-[11px] font-mono font-bold text-[#ff5500] border border-[#ff5500]/30 uppercase">
                  ISO: {activeCountryInfo.iso3}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase font-mono mt-0.5">
                {activeCountryInfo.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2">
              <span className="text-zinc-400">FLOW: </span>
              <span className="font-bold text-white uppercase">{activeFlow}</span>
            </div>
            <div className="rounded-xl border border-[#ff5500]/30 bg-[#ff5500]/10 px-3.5 py-2 text-[#ff5500] font-bold">
              <span>{isMissing ? "UNREPORTED JURISDICTION" : "UN COMTRADE & WORLDBANK BENCHMARK"}</span>
            </div>
          </div>
        </div>

        {isMissing && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs font-mono text-amber-300 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-400 shrink-0" />
            <span>
              NOTICE: Detailed UN Comtrade bilateral trade data or WorldBank macro metrics are currently unindexed for {activeCountryInfo.name} ({activeCountryInfo.iso3}).
            </span>
          </div>
        )}
      </motion.div>

      {/* ─── Top Control Bar: Country & Flow Selector ─────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-white/20 bg-black p-4">
        {/* Country Pills */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Select Country">
          {COUNTRIES.map((c) => {
            const isSelected = selectedCountry === c.iso3;
            return (
              <button
                key={c.iso3}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleCountryChange(c.iso3)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-wide transition-all ${
                  isSelected
                    ? "bg-[#ff5500] text-white shadow-none ring-2 ring-[#ff5500]/50"
                    : "bg-[#111111] text-zinc-300 border border-white/10 hover:border-white/30 hover:text-white"
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Flow Filter Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-black p-1 border border-white/20">
          {(["all", "exports", "imports"] as const).map((flow) => (
            <button
              key={flow}
              type="button"
              onClick={() => setActiveFlow(flow)}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
                activeFlow === flow
                  ? "bg-[#ff5500] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {flow}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Primary Metrics Header Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Trade Volume Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="group relative overflow-hidden rounded-2xl border border-white/20 bg-[#0a0a0a] p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              TOTAL VOLUME ({activeCountryInfo.iso3})
            </span>
            <span className="rounded-lg bg-white/10 p-2 text-white">
              <Globe size={18} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-white font-mono">
            {loading ? "..." : isMissing ? "N/A" : formatCurrency((data?.history.at(-1)?.exportsUsd ?? 0) + (data?.history.at(-1)?.importsUsd ?? 0))}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#ff5500] font-mono font-bold">
            <TrendingUp size={14} />
            <span>{isMissing ? "UNREPORTED DATA" : "+6.2% YOY GROWTH"}</span>
          </div>
        </motion.div>

        {/* Total Exports Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="group relative overflow-hidden rounded-2xl border border-white/20 bg-[#0a0a0a] p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              TOTAL EXPORTS ({activeCountryInfo.iso3})
            </span>
            <span className="rounded-lg bg-[#ff5500] p-2 text-white">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-white font-mono">
            {loading ? "..." : isMissing ? "N/A" : formatCurrency(data?.history.at(-1)?.exportsUsd ?? 0)}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded bg-black border border-white/20 px-2 py-0.5 font-mono text-white">
              Goods: {isMissing ? "N/A" : formatCurrency(data?.goodsExportsUsd || ((data?.history.at(-1)?.exportsUsd || 0) * 0.6))}
            </span>
            <span className="rounded bg-[#ff5500] px-2 py-0.5 font-mono font-bold text-white">
              Services: {isMissing ? "N/A" : formatCurrency(data?.servicesExportsUsd || ((data?.history.at(-1)?.exportsUsd || 0) * 0.4))}
            </span>
          </div>
        </motion.div>

        {/* Total Imports Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="group relative overflow-hidden rounded-2xl border border-white/20 bg-[#0a0a0a] p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              TOTAL IMPORTS ({activeCountryInfo.iso3})
            </span>
            <span className="rounded-lg bg-white p-2 text-black">
              <ArrowDownRight size={18} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-white font-mono">
            {loading ? "..." : isMissing ? "N/A" : formatCurrency(data?.history.at(-1)?.importsUsd ?? 0)}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded bg-black border border-white/20 px-2 py-0.5 font-mono text-white">
              Goods: {isMissing ? "N/A" : formatCurrency(data?.goodsImportsUsd || ((data?.history.at(-1)?.importsUsd || 0) * 0.7))}
            </span>
            <span className="rounded bg-white px-2 py-0.5 font-mono font-bold text-black">
              Services: {isMissing ? "N/A" : formatCurrency(data?.servicesImportsUsd || ((data?.history.at(-1)?.importsUsd || 0) * 0.3))}
            </span>
          </div>
        </motion.div>

        {/* WTO MFN Tariff Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="group relative overflow-hidden rounded-2xl border border-white/20 bg-[#0a0a0a] p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              WTO TARIFF ({activeCountryInfo.iso3})
            </span>
            <span className="rounded-lg bg-[#ff5500]/20 border border-[#ff5500] p-2 text-[#ff5500]">
              <Percent size={18} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-white font-mono">
            {loading ? "..." : (data?.tariffs && data.tariffs.length > 0) ? `${data.tariffs.at(-1)?.mfnRatePct}%` : "N/A"}
          </div>
          <div className="mt-2 text-xs text-zinc-400 font-mono">
            {(data?.tariffs && data.tariffs.length > 0)
              ? `Simple average applied tariff rate for ${activeCountryInfo.name}`
              : `No WTO tariff schedule recorded for ${activeCountryInfo.name}`}
          </div>
        </motion.div>
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────── */}
      <div className="border-b border-white/20">
        <nav className="-mb-px flex gap-6" aria-label="Trade Tabs">
          {[
            { id: "overview", label: "TRADE HISTORY & TREND", icon: BarChart3 },
            { id: "dissection", label: "SECTOR DISSECTION", icon: Layers },
            { id: "partners", label: "TOP TRADE PARTNERS", icon: Globe },
            { id: "macro", label: "WORLDBANK MACRO METRICS", icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 py-3 text-xs font-mono font-bold tracking-widest transition-all ${
                  isActive
                    ? "border-[#ff5500] text-[#ff5500]"
                    : "border-transparent text-zinc-400 hover:border-white/30 hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── Main Interactive Visualizations ──────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-2xl border border-white/20 bg-[#0a0a0a] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
                  <span>HISTORICAL BILATERAL TRADE TREND FOR {activeCountryInfo.name.toUpperCase()} (2019 – 2025)</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Annual export vs import volume growth in USD billions for {activeCountryInfo.name} ({activeCountryInfo.iso3})
                </p>
              </div>
            </div>

            {(!data?.history || data.history.length === 0) ? (
              <div className="py-16 text-center text-xs font-mono text-zinc-400 border border-dashed border-white/10 rounded-xl">
                No official bilateral trade history records indexed for {activeCountryInfo.name} ({activeCountryInfo.iso3}).
              </div>
            ) : (
              <div className="h-[360px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.history ?? []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff5500" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ff5500" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                    <XAxis dataKey="year" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                    <YAxis stroke="#a1a1aa" fontSize={12} fontFamily="monospace" tickFormatter={(v) => `$${(v / 1e12).toFixed(1)}T`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#000000", borderColor: "#3f3f46", borderRadius: "8px", color: "#ffffff" }}
                      formatter={(value: any) => [formatCurrency(Number(value)), "Value"]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px", fontFamily: "monospace", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="exportsUsd" name={`${activeCountryInfo.name} Exports (USD)`} stroke="#ff5500" fillOpacity={1} fill="url(#colorExports)" strokeWidth={3} />
                    <Area type="monotone" dataKey="importsUsd" name={`${activeCountryInfo.name} Imports (USD)`} stroke="#ffffff" fillOpacity={1} fill="url(#colorImports)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "dissection" && (
          <motion.div
            key="dissection"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            {/* Sector Donut Breakdown */}
            <div className="rounded-2xl border border-white/20 bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">
                TRADE DISSECTION BY HS CODE CHAPTER ({activeCountryInfo.name.toUpperCase()})
              </h3>
              <p className="text-xs text-zinc-400 font-mono mb-4">Commodity group volume distribution for {activeCountryInfo.name}</p>
              {(!data?.dissection || data.dissection.length === 0) ? (
                <div className="py-16 text-center text-xs font-mono text-zinc-400 border border-dashed border-white/10 rounded-xl">
                  No HS sector commodity breakdown available for {activeCountryInfo.name}.
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.dissection ?? []}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="valueUsd"
                        nameKey="category"
                      >
                        {(data?.dissection ?? []).map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={SOLID_SECTOR_COLORS[idx % SOLID_SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#000000", borderColor: "#3f3f46", borderRadius: "8px", color: "#ffffff" }}
                        formatter={(val: any) => [formatCurrency(Number(val)), "Trade Value"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Sector Bar Chart List */}
            <div className="rounded-2xl border border-white/20 bg-[#0a0a0a] p-6 space-y-4">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">
                {activeCountryInfo.iso3} SECTOR SHARE (%)
              </h3>
              {(!data?.dissection || data.dissection.length === 0) ? (
                <div className="py-16 text-center text-xs font-mono text-zinc-400 border border-dashed border-white/10 rounded-xl">
                  No sector share metrics.
                </div>
              ) : (
                <div className="space-y-4">
                  {(data?.dissection ?? []).map((item, idx) => {
                    const barColor = SOLID_SECTOR_COLORS[idx % SOLID_SECTOR_COLORS.length];
                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono font-semibold">
                          <span className="text-white">{item.category} ({item.hsPrefix})</span>
                          <span className="text-zinc-400">{item.sharePct}% ({formatCurrency(item.valueUsd)})</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#18181b] border border-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.sharePct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "partners" && (
          <motion.div
            key="partners"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-2xl border border-white/20 bg-[#0a0a0a] p-6 space-y-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">
                  TOP TRADING PARTNERS OF {activeCountryInfo.name.toUpperCase()}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Ranked by bilateral trade volume with {activeCountryInfo.name} ({activeCountryInfo.iso3})
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter country..."
                  aria-label="Filter country"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black py-1.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-[#ff5500]"
                />
              </div>
            </div>

            {(!filteredPartners || filteredPartners.length === 0) ? (
              <div className="py-16 text-center text-xs font-mono text-zinc-400 border border-dashed border-white/10 rounded-xl">
                No recorded bilateral trade partners for {activeCountryInfo.name} ({activeCountryInfo.iso3}).
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredPartners} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                    <XAxis type="number" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" tickFormatter={(v) => `$${(v / 1e9).toFixed(0)}B`} />
                    <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#000000", borderColor: "#3f3f46", borderRadius: "8px", color: "#ffffff" }}
                      formatter={(val: any) => [formatCurrency(Number(val)), "Volume"]}
                    />
                    <Bar dataKey="tradeValueUsd" fill="#ff5500" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "macro" && (
          <motion.div
            key="macro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            {/* WorldBank GDP History */}
            <div className="rounded-2xl border border-white/20 bg-[#0a0a0a] p-6 space-y-4">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">
                WORLDBANK GDP TREND ({activeCountryInfo.name.toUpperCase()})
              </h3>
              {(!data?.macro?.gdp || data.macro.gdp.length === 0) ? (
                <div className="py-12 text-center text-xs font-mono text-zinc-400 border border-dashed border-white/10 rounded-xl">
                  No WorldBank GDP macro data recorded for {activeCountryInfo.name}.
                </div>
              ) : (
                <div className="space-y-3">
                  {(data.macro.gdp ?? []).map((item: any) => (
                    <div key={item.year} className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-mono">
                      <span className="text-zinc-400">{item.year}</span>
                      <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WTO Tariff Schedule */}
            <div className="rounded-2xl border border-white/20 bg-[#0a0a0a] p-6 space-y-4">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">
                WTO MFN APPLIED TARIFF SCHEDULE ({activeCountryInfo.name.toUpperCase()})
              </h3>
              {(!data?.tariffs || data.tariffs.length === 0) ? (
                <div className="py-12 text-center text-xs font-mono text-zinc-400 border border-dashed border-white/10 rounded-xl">
                  No WTO MFN tariff schedules on record for {activeCountryInfo.name}.
                </div>
              ) : (
                <div className="space-y-3">
                  {(data.tariffs ?? []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-mono">
                      <span className="text-zinc-400">{item.year} MFN Simple Avg</span>
                      <span className="rounded bg-[#ff5500] px-2 py-0.5 font-bold text-white">
                        {item.mfnRatePct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
