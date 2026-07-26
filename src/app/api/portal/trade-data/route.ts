import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// Zod query schema validation
const querySchema = z.object({
  reporter: z.string().default("USA"),
  flow: z.enum(["all", "exports", "imports"]).default("all"),
});

// Cache in-memory for lightning fast sub-50ms responses
let cachedWorldBankData: Record<string, any> | null = null;
let cachedWtoTariffs: Record<string, any> | null = null;
let cachedTradeIndex: Record<string, any> | null = null;

async function loadMacroData() {
  if (!cachedWorldBankData) {
    try {
      const dataPath = path.join(process.cwd(), "Data", "worldbank_macro.json");
      const content = await fs.readFile(dataPath, "utf-8");
      cachedWorldBankData = JSON.parse(content);
    } catch {
      cachedWorldBankData = {};
    }
  }
  return cachedWorldBankData;
}

async function loadTariffData() {
  if (!cachedWtoTariffs) {
    try {
      const dataPath = path.join(process.cwd(), "Data", "wto_tariff_rates.json");
      const content = await fs.readFile(dataPath, "utf-8");
      cachedWtoTariffs = JSON.parse(content);
    } catch {
      cachedWtoTariffs = {};
    }
  }
  return cachedWtoTariffs;
}

async function loadTradeIndex() {
  if (!cachedTradeIndex) {
    try {
      const indexPath = path.join(process.cwd(), "Data", "trade_index.json");
      const content = await fs.readFile(indexPath, "utf-8");
      cachedTradeIndex = JSON.parse(content);
    } catch {
      cachedTradeIndex = null;
    }
  }
  return cachedTradeIndex;
}

// Fallback metrics when index is generating
function getFallbackMetrics(reporterIso3: string) {
  const isUsa = reporterIso3 === "USA";
  const isCan = reporterIso3 === "CAN";
  const isChn = reporterIso3 === "CHN";
  const isJpn = reporterIso3 === "JPN";
  const isDeu = reporterIso3 === "DEU";
  const isGbr = reporterIso3 === "GBR";

  const multiplier = isUsa ? 1.0 : isChn ? 0.95 : isDeu ? 0.7 : isJpn ? 0.5 : isGbr ? 0.45 : isCan ? 0.4 : 0.3;

  const tradeHistory = [
    { year: 2019, exportsUsd: Math.round(1450000000000 * multiplier), importsUsd: Math.round(2500000000000 * multiplier), totalVolumeKg: Math.round(890000000 * multiplier) },
    { year: 2020, exportsUsd: Math.round(1380000000000 * multiplier), importsUsd: Math.round(2340000000000 * multiplier), totalVolumeKg: Math.round(820000000 * multiplier) },
    { year: 2021, exportsUsd: Math.round(1750000000000 * multiplier), importsUsd: Math.round(2830000000000 * multiplier), totalVolumeKg: Math.round(940000000 * multiplier) },
    { year: 2022, exportsUsd: Math.round(2060000000000 * multiplier), importsUsd: Math.round(3240000000000 * multiplier), totalVolumeKg: Math.round(1020000000 * multiplier) },
    { year: 2023, exportsUsd: Math.round(2010000000000 * multiplier), importsUsd: Math.round(3170000000000 * multiplier), totalVolumeKg: Math.round(990000000 * multiplier) },
    { year: 2024, exportsUsd: Math.round(2120000000000 * multiplier), importsUsd: Math.round(3280000000000 * multiplier), totalVolumeKg: Math.round(1050000000 * multiplier) },
    { year: 2025, exportsUsd: Math.round(2250000000000 * multiplier), importsUsd: Math.round(3410000000000 * multiplier), totalVolumeKg: Math.round(1120000000 * multiplier) },
  ];

  const tradeDissection = [
    { category: "Electronics & Machinery", hsPrefix: "84-85", valueUsd: Math.round(890000000000 * multiplier), sharePct: 34.5, color: "#6366f1" },
    { category: "Automotive & Transport", hsPrefix: "87", valueUsd: Math.round(410000000000 * multiplier), sharePct: 18.2, color: "#ff5500" },
    { category: "Chemicals & Plastics", hsPrefix: "28-39", valueUsd: Math.round(340000000000 * multiplier), sharePct: 15.1, color: "#10b981" },
    { category: "Metals & Minerals", hsPrefix: "72-83", valueUsd: Math.round(280000000000 * multiplier), sharePct: 12.4, color: "#f59e0b" },
    { category: "Agri-Food & Bio", hsPrefix: "01-24", valueUsd: Math.round(210000000000 * multiplier), sharePct: 10.2, color: "#ec4899" },
    { category: "Textiles & Misc Goods", hsPrefix: "50-67", valueUsd: Math.round(120000000000 * multiplier), sharePct: 9.6, color: "#8b5cf6" },
  ];

  const topPartners = [
    { iso3: "USA", name: "United States", tradeValueUsd: Math.round(650000000000 * multiplier), weightKg: Math.round(200000000 * multiplier) },
    { iso3: "CHN", name: "China", tradeValueUsd: Math.round(420000000000 * multiplier), weightKg: Math.round(150000000 * multiplier) },
    { iso3: "DEU", name: "Germany", tradeValueUsd: Math.round(210000000000 * multiplier), weightKg: Math.round(80000000 * multiplier) },
    { iso3: "JPN", name: "Japan", tradeValueUsd: Math.round(180000000000 * multiplier), weightKg: Math.round(70000000 * multiplier) },
    { iso3: "GBR", name: "United Kingdom", tradeValueUsd: Math.round(110000000000 * multiplier), weightKg: Math.round(40000000 * multiplier) },
  ];

  return { tradeHistory, tradeDissection, topPartners, isFallback: true };
}

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(searchParams);

  const reporter = parsed.success ? parsed.data.reporter.toUpperCase() : "USA";
  const flow = parsed.success ? parsed.data.flow : "all";

  const [macroData, tariffData, tradeIndex] = await Promise.all([
    loadMacroData(),
    loadTariffData(),
    loadTradeIndex(),
  ]);

  const countryMacro = (macroData && macroData[reporter]) ?? (macroData && macroData["USA"]) ?? null;
  const countryTariffs = (tariffData && tariffData[reporter]) ?? (tariffData && tariffData["USA"]) ?? [];

  let history = [];
  let dissection = [];
  let partners = [];
  let goodsExportsUsd = 0;
  let goodsImportsUsd = 0;
  let servicesExportsUsd = 0;
  let servicesImportsUsd = 0;
  let isFallback = false;

  if (tradeIndex && tradeIndex[reporter]) {
    const rData = tradeIndex[reporter];
    history = rData.history || [];
    dissection = rData.dissection || [];
    partners = rData.partners || [];
    goodsExportsUsd = rData.goodsExportsUsd || 0;
    goodsImportsUsd = rData.goodsImportsUsd || 0;
    servicesExportsUsd = rData.servicesExportsUsd || 0;
    servicesImportsUsd = rData.servicesImportsUsd || 0;
  } else {
    const fallback = getFallbackMetrics(reporter);
    history = fallback.tradeHistory;
    dissection = fallback.tradeDissection;
    partners = fallback.topPartners;
    isFallback = true;
  }

  return NextResponse.json({
    reporter,
    flowFilter: flow,
    timestamp: new Date().toISOString(),
    dataSource: isFallback ? "mock-fallback" : "official-benchmark-dataset",
    goodsExportsUsd,
    goodsImportsUsd,
    servicesExportsUsd,
    servicesImportsUsd,
    macro: countryMacro,
    tariffs: countryTariffs,
    history,
    dissection,
    partners,
  });
}
