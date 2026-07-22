export interface CountryRiskEntry {
  iso3: string;
  name: string;
  tier: 'open' | 'watch' | 'restricted' | 'blocked' | 'no-data';
  fta: string | null;
  ftaNotes?: string;
  region: string;
  source: string;
}

export interface CountryProfileFallback {
  iso3: string;
  name: string;
  currency: string;
  tariffRateDefault: number;
  freightRateCadPerFeu: number;
  comtradeImportVolumeUsd: number;
  comtradeYoYChange: number;
  fxRateFromCad: number;
  volatility30d: number;
  volatility90d: number;
  sanctionsClear: boolean;
  competitors: { country: string; sharePct: number }[];
  seasonality: { month: string; volumeIndex: number }[];
}
