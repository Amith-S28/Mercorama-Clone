// lib/intelligence/types.ts
// Core types for the unified Intelligence Orchestrator.

export type IntelligenceStage = 'early' | 'exploring' | 'execution';

export type IntelligenceLayer =
  | 'hs'
  | 'incoterm'
  | 'market'
  | 'buyer'
  | 'compliance';

export interface IntelligenceContext {
  product?: string;
  category?: string;
  hsCode?: string;
  country?: string;
  province?: string;
  price?: number;
  shipmentType?: string;
  incoterm?: string;
  quantity?: number;
  targetMarket?: string;
}

export interface IntelligenceResult<T = unknown> {
  layer: IntelligenceLayer;
  stage: IntelligenceStage;
  data: T;
  metadata: {
    modelUsed: string;
    latencyMs: number;
    retrievalSources: string[];
  };
}
