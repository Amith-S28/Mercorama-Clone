import type {
  AssessmentRecord,
  IndustrySector,
  OptionKey,
  PillarKey,
  RoadmapBucket,
  SmeRecord,
} from '@/types';
import { env } from '@/lib/env';

export interface CreateSmeInput {
  name: string;
  province: string;
  industry: IndustrySector;
  productDescription: string;
  hsCode: string;
  exportQuantity: number;
  productionCost: number;
  unitPrice: number;
  targetProfitMargin: number;
  contactEmail?: string | null;
  primaryContact?: string | null;
  website?: string | null;
  hasLocalAgent?: boolean;
  employeeRange?: string | null;
  revenueRange?: string | null;
  targetCountry: string;
  targetCountryName: string;
}

export interface CreateAssessmentInput {
  smeId: string;
  overallScore: number;
  grade: AssessmentRecord['grade'];
  pillarScores: Record<PillarKey, number>;
  answers: Record<string, OptionKey>;
  selectedQuestions: string[];
  aiReport?: AssessmentRecord['aiReport'];
}

interface InMemoryAdvisorNote {
  id: string;
  assessmentId: string;
  advisorId: string;
  pillar: string;
  content: string;
  updatedAt: string;
}

interface InMemoryRoadmapItem {
  id: string;
  assessmentId: string;
  advisorId: string;
  task: string;
  bucket: RoadmapBucket;
  sortOrder: number;
  completed: boolean;
  createdAt: string;
}

const SEED_NOTES: InMemoryAdvisorNote[] = [];

const SEED_ROADMAP: InMemoryRoadmapItem[] = [];

const SEED_SMES: SmeRecord[] = [];

const SEED_ASSESSMENTS: AssessmentRecord[] = [];

let smeStore: SmeRecord[] = [...SEED_SMES];
let assessmentStore: AssessmentRecord[] = [...SEED_ASSESSMENTS];
let noteStore: InMemoryAdvisorNote[] = [...SEED_NOTES];
let roadmapStore: InMemoryRoadmapItem[] = [...SEED_ROADMAP];

let smeCounter = 0;
let asmCounter = 0;

export function listInMemorySmes(): SmeRecord[] {
  return [...smeStore];
}

export function createInMemorySme(input: CreateSmeInput): SmeRecord {
  smeCounter++;
  const sequentialId = `SME-${String(smeCounter).padStart(6, '0')}`;
  
  const record: SmeRecord = {
    id: sequentialId,
    advisorId: env.MOCK_ADVISOR_ID,
    name: input.name,
    province: input.province,
    industry: input.industry,
    productDescription: input.productDescription,
    hsCode: input.hsCode,
    exportQuantity: input.exportQuantity,
    productionCost: input.productionCost,
    unitPrice: input.unitPrice,
    targetProfitMargin: input.targetProfitMargin,
    contactEmail: input.contactEmail ?? null,
    primaryContact: input.primaryContact ?? null,
    website: input.website ?? null,
    hasLocalAgent: input.hasLocalAgent ?? false,
    employeeRange: input.employeeRange ?? null,
    revenueRange: input.revenueRange ?? null,
    targetCountry: input.targetCountry,
    targetCountryName: input.targetCountryName,
    createdAt: new Date().toISOString(),
  };
  smeStore = [record, ...smeStore];
  return record;
}

export function createInMemoryAssessment(input: CreateAssessmentInput): AssessmentRecord {
  asmCounter++;
  const sequentialId = `ASM-${String(asmCounter).padStart(6, '0')}`;
  
  const record: AssessmentRecord = {
    id: sequentialId,
    smeId: input.smeId,
    overallScore: input.overallScore,
    grade: input.grade,
    pillarScores: input.pillarScores,
    answers: input.answers,
    selectedQuestions: input.selectedQuestions,
    aiReport: input.aiReport ?? null,
    createdAt: new Date().toISOString(),
  };
  assessmentStore = [record, ...assessmentStore];
  return record;
}

export function listInMemoryAssessments(): AssessmentRecord[] {
  return [...assessmentStore];
}

export function getInMemoryAssessmentBySmeId(smeId: string): AssessmentRecord | undefined {
  return assessmentStore.find((a) => a.smeId === smeId);
}

export function getInMemoryAssessmentById(id: string): AssessmentRecord | undefined {
  return assessmentStore.find((a) => a.id === id);
}

export function getInMemorySmeById(id: string): SmeRecord | undefined {
  return smeStore.find((s) => s.id === id);
}

export function resetInMemoryStores(): void {
  smeCounter = 0;
  asmCounter = 0;
  smeStore = [...SEED_SMES];
  assessmentStore = [...SEED_ASSESSMENTS];
  noteStore = [...SEED_NOTES];
  roadmapStore = [...SEED_ROADMAP];
}

export function listInMemoryAdvisorNotes(assessmentId: string) {
  return noteStore.filter((n) => n.assessmentId === assessmentId);
}

export function upsertInMemoryAdvisorNote(input: {
  assessmentId: string;
  advisorId: string;
  pillar: string;
  content: string;
}) {
  const existing = noteStore.find(
    (n) => n.assessmentId === input.assessmentId && n.pillar === input.pillar
  );
  if (existing) {
    existing.content = input.content;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }
  const note = {
    id: crypto.randomUUID(),
    ...input,
    updatedAt: new Date().toISOString(),
  };
  noteStore.push(note);
  return note;
}

export function listInMemoryRoadmapItems(assessmentId: string) {
  return roadmapStore
    .filter((item) => item.assessmentId === assessmentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createInMemoryRoadmapItem(input: Omit<InMemoryRoadmapItem, 'id' | 'createdAt'>) {
  const item: InMemoryRoadmapItem = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  roadmapStore.push(item);
  return item;
}

export function updateInMemoryRoadmapItem(
  id: string,
  patch: Partial<Pick<InMemoryRoadmapItem, 'task' | 'bucket' | 'sortOrder' | 'completed'>>
) {
  const item = roadmapStore.find((entry) => entry.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  return item;
}
