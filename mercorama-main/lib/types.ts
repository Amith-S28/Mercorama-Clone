// TradeRyt TypeScript Type Definitions

export type IncotermCode = 
  | 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP'
  | 'FAS' | 'FOB' | 'CFR' | 'CIF';

export type AnalysisType = 'incoterm' | 'hscode' | 'contract' | 'doc_checker' | 'classification';

export interface IncotermData {
  code: IncotermCode;
  name: string;
  transportMode: string[];
  riskTransfer: string;
  costTransfer: string;
  sellerResponsibilities: string[];
  buyerResponsibilities: string[];
  bestFor: string;
}

export interface IncotermAnalysisRequest {
  incoterm: IncotermCode;
  originCountry: string;
  destinationCountry: string;
  cargoType: string;
  cargoValue: number;
}

export interface IncotermAnalysisResponse {
  explanation: string;
  responsibilities: {
    seller: string[];
    buyer: string[];
    shared?: string[];
  };
  riskTransferPoint: string;
  commonMistakes: string[];
  alternatives: Array<{
    incoterm: IncotermCode;
    reasoning: string;
  }>;
}

export interface HSCodeAnalysisRequest {
  productDescription: string;
  originCountry?: string;
  destinationCountry?: string;
}

export interface HSCodeAnalysisResponse {
  hsCode: string;
  confidence: 'high' | 'medium' | 'low';
  classification: {
    chapter: string;
    heading: string;
    subheading: string;
  };
  reasoning: string;
  misclassificationRisks: string[];
  dutyRates?: Array<{
    country: string;
    rate: string;
    notes?: string;
  }>;
  tradeAgreements?: string[];
  wcoDescription?: string;
}

export interface ContractGeneratorRequest {
  incoterm: IncotermCode;
  paymentTerms: string;
  buyerCountry: string;
  sellerCountry: string;
  productCategory: string;
  contractValue: number;
  specialConditions?: string;
}

export interface ContractGeneratorResponse {
  clauses: Array<{
    title: string;
    content: string;
    importance: 'critical' | 'recommended' | 'optional';
  }>;
  paymentMilestones: Array<{
    stage: string;
    percentage: number;
    trigger: string;
    daysFromTrigger?: number;
  }>;
  riskScorecard: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: Array<{
      category: string;
      level: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  negotiationChecklist: string[];
  redFlags: string[];
}

// Smart Doc Checker
export interface DocCheckerRequest {
  exporterCountry: string;
  importerCountry: string;
  mode: 'air' | 'sea' | 'road' | 'courier';
  incoterm: string;
  incotermPlace: string;
  portOfLoading: string;
  portOfDischarge: string;
  commodityDescription: string;
  hsCodes: string;
  currency: string;
  commercialInvoice: string;
  packingList: string;
  purchaseOrder?: string;
  letterOfCredit?: string;
}

export interface DocIssue {
  document: string;
  field: string;
  problem: string;
  consequence: string;
}

export interface DocCheckerResponse {
  overall_assessment: {
    customs: 'Ready' | 'At risk' | 'Not ready';
    lc_payment?: 'Ready' | 'At risk' | 'Not ready';
  };
  critical_issues: DocIssue[];
  important_issues: DocIssue[];
  minor_issues: DocIssue[];
  fix_list: Array<{ issue: string; correction: string }>;
  questions: string[];
}

// Classification Copilot
export interface ClassificationRequest {
  shortName: string;
  detailedDescription: string;
  primaryUse: string;
  materials: string;
  isSetOrKit: boolean;
  productionStage: 'raw' | 'semi-finished' | 'finished';
  technicalSpecs: string;
  originCountry: string;
  destinationCountry: string;
  knownHsCode?: string;
}

export interface HsCodeSuggestion {
  hs_code: string;
  description: string;
  reasoning: string;
  confidence: 'Low' | 'Medium' | 'High';
  mfn_rate?: string;
}

export interface ClassificationResponse {
  product_summary: string;
  primary_code: HsCodeSuggestion;
  alternatives: HsCodeSuggestion[];
  next_steps: string[];
  clarifying_questions?: string[];
}

export interface SavedAnalysis {
  id: string;
  type: AnalysisType;
  timestamp: number;
  inputs: IncotermAnalysisRequest | HSCodeAnalysisRequest | ContractGeneratorRequest | DocCheckerRequest | ClassificationRequest;
  results: IncotermAnalysisResponse | HSCodeAnalysisResponse | ContractGeneratorResponse | DocCheckerResponse | ClassificationResponse;
}

export interface DashboardData {
  analyses: SavedAnalysis[];
}

// ── Cross-Tool Market Recommendation (light normalization) ────────────────────

export interface MarketRecommendation {
  country: string;
  fta: string;
  rationale: string;
  tariffInsight?: string;
  riskFlags?: string[];
}

// ── Deal Playbook Types ───────────────────────────────────────────────────────

import type { HsClassificationResult } from '@/app/hscode/_components/hs-classifier';

export interface EnhancedHsResult {
  base: HsClassificationResult;
  confidence: number;
  alternativeCodes?: string[];
  riskFlags?: string[];
  explanation: string;
  tradeImplications: {
    tariffImpact?: string;
    complianceImpact?: string;
    documentationImpact?: string;
  };
}

export interface IncotermInsight {
  recommended: string;
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
  marginImpact: string;
  responsibilitySplit: {
    seller: string[];
    buyer: string[];
  };
  warning?: string;
}

export interface DealPlaybook {
  productSummary: string;
  classification: EnhancedHsResult;
  incoterm: IncotermInsight;
  market?: {
    country: string;
    notes: string;
  };
  compliance: string[];
  documentation: string[];
  risks: string[];
  nextActions: string[];
}
