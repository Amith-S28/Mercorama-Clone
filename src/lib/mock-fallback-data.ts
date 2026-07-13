import type { CountryProfileFallback } from '@/types';
import witsSummaries from '@/data/wits_country_summaries.json';
import witsTrends from '@/data/wits_country_trends.json';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function seasonality(peakMonth: number): { month: string; volumeIndex: number }[] {
  return MONTHS.map((month, i) => {
    const distance = Math.min(Math.abs(i - peakMonth), 12 - Math.abs(i - peakMonth));
    return { month, volumeIndex: Math.round(100 - distance * 12 + (i % 3) * 4) };
  });
}

export const COUNTRY_FALLBACKS: Record<string, CountryProfileFallback> = {
  JPN: {
    iso3: 'JPN',
    name: 'Japan',
    currency: 'JPY',
    tariffRateDefault: 0.12,
    freightRateCadPerFeu: 5800,
    comtradeImportVolumeUsd: 7_810_000_000,
    comtradeYoYChange: 0.064,
    fxRateFromCad: 109.45,
    volatility30d: 0.0125,
    volatility90d: 0.0182,
    sanctionsClear: true,
    competitors: [
      { country: 'China', sharePct: 75 },
      { country: 'Vietnam', sharePct: 12 },
      { country: 'Thailand', sharePct: 8 },
      { country: 'United States', sharePct: 3 },
      { country: 'Canada', sharePct: 2 },
    ],
    seasonality: seasonality(9),
  },
  DEU: {
    iso3: 'DEU',
    name: 'Germany',
    currency: 'EUR',
    tariffRateDefault: 0.045,
    freightRateCadPerFeu: 4200,
    comtradeImportVolumeUsd: 890_000_000,
    comtradeYoYChange: 0.031,
    fxRateFromCad: 0.672,
    volatility30d: 0.0098,
    volatility90d: 0.0141,
    sanctionsClear: true,
    competitors: [
      { country: 'China', sharePct: 24 },
      { country: 'United States', sharePct: 16 },
      { country: 'Italy', sharePct: 12 },
      { country: 'Poland', sharePct: 10 },
      { country: 'Canada', sharePct: 7 },
    ],
    seasonality: seasonality(3),
  },
  USA: {
    iso3: 'USA',
    name: 'United States',
    currency: 'USD',
    tariffRateDefault: 0.0,
    freightRateCadPerFeu: 2800,
    comtradeImportVolumeUsd: 4_500_000_000,
    comtradeYoYChange: 0.022,
    fxRateFromCad: 0.734,
    volatility30d: 0.0062,
    volatility90d: 0.0095,
    sanctionsClear: true,
    competitors: [
      { country: 'Mexico', sharePct: 22 },
      { country: 'Canada', sharePct: 19 },
      { country: 'China', sharePct: 15 },
      { country: 'Germany', sharePct: 8 },
      { country: 'Japan', sharePct: 6 },
    ],
    seasonality: seasonality(10),
  },
  GBR: {
    iso3: 'GBR',
    name: 'United Kingdom',
    currency: 'GBP',
    tariffRateDefault: 0.08,
    freightRateCadPerFeu: 3900,
    comtradeImportVolumeUsd: 610_000_000,
    comtradeYoYChange: -0.012,
    fxRateFromCad: 0.578,
    volatility30d: 0.011,
    volatility90d: 0.016,
    sanctionsClear: true,
    competitors: [
      { country: 'Netherlands', sharePct: 18 },
      { country: 'Germany', sharePct: 15 },
      { country: 'Ireland', sharePct: 12 },
      { country: 'Canada', sharePct: 9 },
      { country: 'France', sharePct: 8 },
    ],
    seasonality: seasonality(11),
  },
  ARE: {
    iso3: 'ARE',
    name: 'United Arab Emirates',
    currency: 'AED',
    tariffRateDefault: 0.05,
    freightRateCadPerFeu: 5100,
    comtradeImportVolumeUsd: 340_000_000,
    comtradeYoYChange: 0.088,
    fxRateFromCad: 2.695,
    volatility30d: 0.004,
    volatility90d: 0.006,
    sanctionsClear: true,
    competitors: [
      { country: 'India', sharePct: 21 },
      { country: 'China', sharePct: 18 },
      { country: 'United States', sharePct: 12 },
      { country: 'Turkey', sharePct: 9 },
      { country: 'Canada', sharePct: 5 },
    ],
    seasonality: seasonality(2),
  },
};

interface WitsCountrySummary {
  countryIso3: string;
  countryName: string;
  year: number;
  totalImportsUsd: number;
  tariffWeightedAll: number;
  exchangeRateLcuPerUsd: number;
}

export function getCountryFallback(iso3: string): CountryProfileFallback {
  const key = iso3.toUpperCase();
  const base = COUNTRY_FALLBACKS[key] ?? {
    iso3: key,
    name: key,
    currency: 'USD',
    tariffRateDefault: 0.05,
    freightRateCadPerFeu: 4500,
    comtradeImportVolumeUsd: 250_000_000,
    comtradeYoYChange: 0.02,
    fxRateFromCad: 0.75,
    volatility30d: 0.015,
    volatility90d: 0.022,
    sanctionsClear: true,
    competitors: [
      { country: 'United States', sharePct: 20 },
      { country: 'China', sharePct: 18 },
      { country: 'Germany', sharePct: 12 },
      { country: 'Canada', sharePct: 8 },
      { country: 'Japan', sharePct: 6 },
    ],
    seasonality: seasonality(6),
  };

  const witsRecord = (witsSummaries as Record<string, WitsCountrySummary>)[key];
  if (witsRecord) {
    return {
      ...base,
      name: witsRecord.countryName,
      tariffRateDefault: witsRecord.tariffWeightedAll > 0 ? witsRecord.tariffWeightedAll / 100 : base.tariffRateDefault,
      comtradeImportVolumeUsd: witsRecord.totalImportsUsd > 0 ? witsRecord.totalImportsUsd : base.comtradeImportVolumeUsd,
      fxRateFromCad: witsRecord.exchangeRateLcuPerUsd > 0 ? witsRecord.exchangeRateLcuPerUsd / 1.35 : base.fxRateFromCad,
    };
  }

  return base;
}

export function getWitsCountryTrend(iso3: string): { year: number; value: number }[] {
  const key = iso3.toUpperCase();
  return (witsTrends as Record<string, { year: number; value: number }[]>)[key] ?? [];
}

export function mockComtradePayload(hsCode: string, country: string) {
  const profile = getCountryFallback(country);
  
  const competitors = [...profile.competitors];
  const seen = new Set(competitors.map((c) => c.country));
  
  const additional = [
    { country: 'United States', sharePct: 15 },
    { country: 'China', sharePct: 12 },
    { country: 'Germany', sharePct: 9 },
    { country: 'Canada', sharePct: 7 },
    { country: 'Japan', sharePct: 6 },
    { country: 'Mexico', sharePct: 5 },
    { country: 'United Kingdom', sharePct: 4 },
    { country: 'France', sharePct: 3 },
    { country: 'South Korea', sharePct: 3 },
    { country: 'Brazil', sharePct: 2 },
    { country: 'India', sharePct: 2 },
    { country: 'Australia', sharePct: 2 },
    { country: 'Netherlands', sharePct: 1 },
  ];

  for (const item of additional) {
    if (competitors.length >= 10) break;
    if (!seen.has(item.country) && item.country !== profile.name) {
      competitors.push(item);
      seen.add(item.country);
    }
  }

  // Scale down macro-economic merchandise imports to a realistic product-specific volume deterministically
  let volume = profile.comtradeImportVolumeUsd;
  if (volume > 50_000_000_000) {
    let hash = 0;
    for (let i = 0; i < hsCode.length; i++) {
      hash = hsCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pct = Math.abs(hash % 45) + 5; // 5 to 50
    const factor = pct / 10000; // 0.05% to 0.5%
    volume = Math.round(volume * factor);
  }

  // Load actual trend from WITS to compute YoY change
  const witsTrend = getWitsCountryTrend(country);
  let yoy = profile.comtradeYoYChange;
  if (witsTrend.length >= 2) {
    const latest = witsTrend[witsTrend.length - 1];
    const prev = witsTrend[witsTrend.length - 2];
    if (latest.value > 0 && prev.value > 0) {
      yoy = (latest.value - prev.value) / prev.value;
    }
  }

  return {
    hsCode,
    country: profile.iso3,
    importVolumeUsd: volume,
    yoyChange: yoy,
    competitors: competitors.sort((a, b) => b.sharePct - a.sharePct),
    seasonality: profile.seasonality,
    dataOrigin: 'mock-fallback' as const,
  };
}

export function mockRatesPayload(base: string, target: string) {
  const profile = Object.values(COUNTRY_FALLBACKS).find((c) => c.currency === target.toUpperCase());
  return {
    base: base.toUpperCase(),
    target: target.toUpperCase(),
    rate: profile?.fxRateFromCad ?? 1,
    volatility30d: profile?.volatility30d ?? 0.015,
    volatility90d: profile?.volatility90d ?? 0.022,
    dataOrigin: 'mock-fallback' as const,
  };
}

export function mockFreightPayload(origin: string, destination: string) {
  const profile = getCountryFallback(destination);
  return {
    origin,
    destination: profile.iso3,
    containerRateCad: profile.freightRateCadPerFeu,
    transitDays: 28,
    mode: 'ocean-feu',
    dataOrigin: 'mock-fallback' as const,
  };
}

export function mockTariffPayload(hsCode: string, country: string) {
  const profile = getCountryFallback(country);
  return {
    hsCode,
    country: profile.iso3,
    rate: profile.tariffRateDefault,
    preferentialRate: Math.max(0, profile.tariffRateDefault - 0.03),
    dataOrigin: 'mock-fallback' as const,
  };
}

export function mockSanctionsPayload(query: string) {
  return {
    inputQuery: query,
    match: false,
    matchedEntries: [] as { name: string; source: string }[],
    source: 'CSL mock-fallback',
    sourceVersion: 'fallback-v1',
    dataOrigin: 'mock-fallback' as const,
  };
}
