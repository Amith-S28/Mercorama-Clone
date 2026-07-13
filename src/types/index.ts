export type IndustrySector =
  | 'Food, Beverage & CPG'
  | 'Seafood & Ocean Economy'
  | 'Advanced Manufacturing & Industrial'
  | 'Defence, Dual-Use & Critical Supply Chains'
  | 'Other / Unsure';

export type PillarKey =
  | 'management'
  | 'product'
  | 'operations'
  | 'financial'
  | 'legal'
  | 'market'
  | 'cultural'
  | 'digital'
  | 'programs';

export type ReadinessGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type OptionKey = 'A' | 'B' | 'C' | 'D';

export type ApiServiceId =
  | 'comtrade'
  | 'exchange_rate'
  | 'usda_agtransport'
  | 'csl'
  | 'wto'
  | 'usitc'
  | 'taric';

export type ApiHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'down'
  | 'unconfigured'
  | 'unknown';

export type RoadmapBucket = '30-day' | '60-day' | '90-day';

export interface SmeRecord {
  id: string;
  advisorId: string;
  name: string;
  province: string;
  industry: IndustrySector;
  productDescription: string;
  hsCode: string;
  exportQuantity: number;
  productionCost: number;
  unitPrice: number;
  targetProfitMargin: number;
  contactEmail: string | null;
  primaryContact: string | null;
  website: string | null;
  hasLocalAgent: boolean;
  employeeRange: string | null;
  revenueRange: string | null;
  targetCountry: string;
  targetCountryName: string;
  createdAt: string;
}

export interface AssessmentRecord {
  id: string;
  smeId: string;
  overallScore: number;
  grade: ReadinessGrade;
  pillarScores: Record<PillarKey, number>;
  answers: Record<string, OptionKey>;
  selectedQuestions: string[];
  aiReport: AiReport | null;
  createdAt: string;
}

export interface AiReport {
  summary: string;
  gaps: string[];
  actions: { task: string; tool: string; regulation?: string | null }[];
}

export interface MarketDataSnapshot {
  hsCode: string;
  country: string;
  source: string;
  payload: Record<string, unknown>;
  lastSyncedAt: string;
  ttlSeconds: number;
  dataOrigin: 'live' | 'cache' | 'mock-fallback';
}

export interface FxRateRecord {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  volatility30d: number | null;
  volatility90d: number | null;
  fetchedAt: string;
}

export interface SanctionsScreeningResult {
  inputQuery: string;
  normalizedQuery: string;
  match: boolean;
  matchedEntries: { name: string; source: string }[];
  source: string;
  sourceVersion: string;
  screenedAt: string;
  dataOrigin: 'live' | 'mock-fallback';
}

export interface AdvisorNote {
  id: string;
  assessmentId: string;
  advisorId: string;
  pillar: PillarKey | string;
  content: string;
  updatedAt: string;
}

export interface RoadmapItem {
  id: string;
  assessmentId: string;
  advisorId: string;
  task: string;
  bucket: RoadmapBucket;
  sortOrder: number;
  completed: boolean;
  createdAt: string;
}

export interface LandedCostInput {
  productionCost: number;
  unitPrice: number;
  exportQuantity: number;
  targetProfitMargin: number;
  containerRateCad: number;
  tariffRate: number;
  volatility30d?: number | null;
  volatility90d?: number | null;
}

export interface LandedCostResult {
  unitFreightCost: number;
  tariffPerUnit: number;
  brokerFee: number;
  insuranceFee: number;
  landedCost: number;
  actualMargin: number;
  currencyAdjustedMargin: number;
  fxBufferUsed: number;
  insolvent: boolean;
  meetsTarget: boolean;
  warning?: string;
}

export interface ApiServiceHealth {
  serviceId: ApiServiceId;
  status: ApiHealthStatus;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  latencyMs: number | null;
  error: string | null;
  isKeyConfigured: boolean;
}

export interface QuestionOption {
  key: OptionKey;
  text: string;
  score: number;
}

export interface DiagnosticQuestion {
  id: string;
  pillar: PillarKey;
  text: string;
  options: QuestionOption[];
  trapExplanation?: string;
  officialSources: string[];
  sectorRelevance?: IndustrySector[];
}

/** @deprecated Prefer DiagnosticQuestion — kept for megaplan-compatible imports */
export type Question = DiagnosticQuestion & {
  trap?: string;
  source: string;
};

export interface ScoringResult {
  overallScore: number;
  grade: ReadinessGrade;
  pillarScores: Record<PillarKey, number>;
  gaps: PillarKey[];
}

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
