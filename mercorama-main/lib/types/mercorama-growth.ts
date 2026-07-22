// lib/types/mercorama-growth.ts
// Growth strategy types — April 2026 pivot

export interface CanadaMarketResult {
  province: string;
  demandLevel: "high" | "medium" | "low";
  demandDrivers: string[];
  targetChannels: string[];
  recommendedEntryStrategy: string;
  keyBuyersOrRetailers: string[];
  pricingPositioning: "premium" | "mid-range" | "value";
  logisticsComplexity: "low" | "medium" | "high";
  competitionLevel: "high" | "medium" | "low";
  rationale: string;
}

export type BGIStatus =
  | "getting_started"
  | "building_momentum"
  | "expansion_ready";

export interface BGIScore {
  status: BGIStatus;
  profileCompleted: boolean;
  productDefined: boolean;
  marketsExplored: number;
  marketSelected: boolean;
}

export type DashboardStage =
  | "no_snapshot"
  | "exploring_domestic"
  | "exploring_global"
  | "market_selected"
  | "executing_plan";

export interface DashboardState {
  stage: DashboardStage;
  bgiStatus: BGIStatus;
  productName?: string;
  activeProvince?: string;
  activeCountry?: string;
  hasSnapshot: boolean;
  hasExportPlan?: boolean;
  recommendedNextAction?: string;
}

export interface ActiveMarketFocus {
  userId: string;
  country: string;
  status: "exploring" | "validating" | "executing";
  lastUpdated: string;
  notes?: string;
  nextActions: string[];
}
