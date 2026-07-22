import type { IndustrySector, PillarKey, ReadinessGrade, OptionKey } from './assessment';

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

export interface AiReport {
  summary: string;
  gaps: string[];
  actions: { task: string; tool: string; regulation?: string | null }[];
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
