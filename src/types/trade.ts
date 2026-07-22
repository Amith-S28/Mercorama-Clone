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
