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
