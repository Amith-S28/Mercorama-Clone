import type { CountryRiskEntry } from '@/types';

export const EDC_SOURCE =
  'Source: EDC Economics & Political Intelligence Centre (EPIC), Country Risk Quarterly';

export const COUNTRY_RISK_DATA: CountryRiskEntry[] = [
  { iso3: 'USA', name: 'United States', tier: 'open', fta: 'CUSMA', ftaNotes: 'Canada-United States-Mexico Agreement', region: 'north-america', source: EDC_SOURCE },
  { iso3: 'MEX', name: 'Mexico', tier: 'watch', fta: 'CUSMA', ftaNotes: 'Canada-United States-Mexico Agreement', region: 'north-america', source: EDC_SOURCE },
  { iso3: 'GBR', name: 'United Kingdom', tier: 'open', fta: 'CUKTCA', ftaNotes: 'Canada-UK Trade Continuity Agreement', region: 'europe', source: EDC_SOURCE },
  { iso3: 'DEU', name: 'Germany', tier: 'open', fta: 'CETA', ftaNotes: 'Comprehensive Economic and Trade Agreement (EU)', region: 'europe', source: EDC_SOURCE },
  { iso3: 'FRA', name: 'France', tier: 'open', fta: 'CETA', region: 'europe', source: EDC_SOURCE },
  { iso3: 'NLD', name: 'Netherlands', tier: 'open', fta: 'CETA', region: 'europe', source: EDC_SOURCE },
  { iso3: 'ITA', name: 'Italy', tier: 'open', fta: 'CETA', region: 'europe', source: EDC_SOURCE },
  { iso3: 'ESP', name: 'Spain', tier: 'open', fta: 'CETA', region: 'europe', source: EDC_SOURCE },
  { iso3: 'JPN', name: 'Japan', tier: 'open', fta: 'CPTPP', ftaNotes: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership', region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'KOR', name: 'South Korea', tier: 'open', fta: 'CKFTA', ftaNotes: 'Canada-Korea Free Trade Agreement', region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'AUS', name: 'Australia', tier: 'open', fta: 'CPTPP', region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'SGP', name: 'Singapore', tier: 'open', fta: 'CPTPP', region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'VNM', name: 'Vietnam', tier: 'watch', fta: 'CPTPP', region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'MYS', name: 'Malaysia', tier: 'watch', fta: 'CPTPP', region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'CHN', name: 'China', tier: 'watch', fta: null, ftaNotes: 'No comprehensive FTA with Canada', region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'IND', name: 'India', tier: 'watch', fta: null, region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'ARE', name: 'United Arab Emirates', tier: 'watch', fta: null, region: 'middle-east', source: EDC_SOURCE },
  { iso3: 'SAU', name: 'Saudi Arabia', tier: 'watch', fta: null, region: 'middle-east', source: EDC_SOURCE },
  { iso3: 'ZAF', name: 'South Africa', tier: 'watch', fta: null, region: 'africa', source: EDC_SOURCE },
  { iso3: 'BRA', name: 'Brazil', tier: 'watch', fta: null, region: 'south-america', source: EDC_SOURCE },
  { iso3: 'CHL', name: 'Chile', tier: 'open', fta: 'CCFTA', ftaNotes: 'Canada-Chile Free Trade Agreement', region: 'south-america', source: EDC_SOURCE },
  { iso3: 'COL', name: 'Colombia', tier: 'watch', fta: 'CCOFTA', region: 'south-america', source: EDC_SOURCE },
  { iso3: 'PER', name: 'Peru', tier: 'watch', fta: 'CPFTA', region: 'south-america', source: EDC_SOURCE },
  { iso3: 'RUS', name: 'Russia', tier: 'restricted', fta: null, ftaNotes: 'SEMA sanctions active', region: 'europe', source: EDC_SOURCE },
  { iso3: 'IRN', name: 'Iran', tier: 'restricted', fta: null, ftaNotes: 'SEMA/OFAC sanctions', region: 'middle-east', source: EDC_SOURCE },
  { iso3: 'PRK', name: 'North Korea', tier: 'restricted', fta: null, region: 'asia-pacific', source: EDC_SOURCE },
  { iso3: 'SYR', name: 'Syria', tier: 'restricted', fta: null, region: 'middle-east', source: EDC_SOURCE },
  { iso3: 'MMR', name: 'Myanmar', tier: 'restricted', fta: null, region: 'asia-pacific', source: EDC_SOURCE },
];

export const TIER_COLORS = {
  open: '#22C55E',
  watch: '#F59E0B',
  restricted: '#EF4444',
  'no-data': '#6B7280',
} as const;

export const CANADA_NUM_ID = '124';

export const ISO3_TO_NUM: Record<string, string> = {
  USA: '840', MEX: '484', GBR: '826', DEU: '276', FRA: '250', NLD: '528',
  ITA: '380', ESP: '724', JPN: '392', KOR: '410', AUS: '036', SGP: '702',
  VNM: '704', MYS: '458', CHN: '156', IND: '356', ARE: '784', SAU: '682',
  ZAF: '710', BRA: '076', CHL: '152', COL: '170', PER: '604',
  RUS: '643', IRN: '364', PRK: '408', SYR: '760', MMR: '104',
};

export function getCountryByIso3(iso3: string): CountryRiskEntry | undefined {
  return COUNTRY_RISK_DATA.find((c) => c.iso3 === iso3);
}

export function getRiskTierForNumericId(numId: string): CountryRiskEntry['tier'] {
  if (numId === CANADA_NUM_ID) return 'open';
  const entry = COUNTRY_RISK_DATA.find((c) => ISO3_TO_NUM[c.iso3] === numId);
  return entry?.tier ?? 'no-data';
}

export function getCountryForNumericId(numId: string): CountryRiskEntry | undefined {
  return COUNTRY_RISK_DATA.find((c) => ISO3_TO_NUM[c.iso3] === numId);
}
