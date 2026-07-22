import historyData from '@/data/country_trade_history.json';
import hsBreakdownData from '@/data/country_hs_breakdown.json';

export interface YearlyTradeRecord {
  year: number;
  importsUsd: number;
  exportsUsd: number;
  netBalanceUsd: number;
  yoyImportGrowthPct: number;
  yoyExportGrowthPct: number;
  tradePctGdp: number;
}

export interface CountryTradeHistory {
  iso3: string;
  name: string;
  region: string;
  timeSeries: YearlyTradeRecord[];
}

export interface HsCategoryRecord {
  hsCode: string;
  hsName: string;
  sector: string;
  valueUsd: number;
  sharePct: number;
  yoyChangePct: number;
}

export interface CountryHsBreakdown {
  iso3: string;
  name: string;
  topImports: HsCategoryRecord[];
  topExports: HsCategoryRecord[];
}

const historyMap = historyData as Record<string, CountryTradeHistory>;
const hsMap = hsBreakdownData as Record<string, CountryHsBreakdown>;

export function getCountryTradeHistory(iso3: string): CountryTradeHistory | null {
  const normalized = iso3.toUpperCase();
  return historyMap[normalized] ?? historyMap['JPN'] ?? null;
}

export function getCountryHsBreakdown(iso3: string): CountryHsBreakdown | null {
  const normalized = iso3.toUpperCase();
  return hsMap[normalized] ?? hsMap['JPN'] ?? null;
}

export function getAllTrackedTradeCountries(): { iso3: string; name: string; region: string }[] {
  return Object.values(historyMap).map((item) => ({
    iso3: item.iso3,
    name: item.name,
    region: item.region,
  }));
}
