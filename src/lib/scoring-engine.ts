import type {
  OptionKey,
  PillarKey,
  ReadinessGrade,
  ScoringResult,
} from '@/types';

export const PILLAR_WEIGHTS: Record<PillarKey, number> = {
  management: 0.15,
  product: 0.12,
  operations: 0.13,
  financial: 0.15,
  legal: 0.12,
  market: 0.1,
  cultural: 0.08,
  digital: 0.07,
  programs: 0.08,
};

export const PILLAR_LABELS: Record<PillarKey, string> = {
  management: 'Staff Knowledge & Training',
  product: 'Product/Service Readiness',
  operations: 'Operations & Logistics',
  financial: 'Trade Finance & Risk',
  legal: 'Legal & Regulatory',
  market: 'Strategy & Market Selection',
  cultural: 'Cultural Readiness',
  digital: 'Digital & E-Commerce',
  programs: 'Program & Funding',
};

export const PILLAR_KEYS = Object.keys(PILLAR_WEIGHTS) as PillarKey[];

export type PillarProgress = { answered: number; total: number };

export function createEmptyPillarCompletion(): Record<PillarKey, PillarProgress> {
  return PILLAR_KEYS.reduce(
    (acc, pillar) => {
      acc[pillar] = { answered: 0, total: 0 };
      return acc;
    },
    Object.create(null) as Record<PillarKey, PillarProgress>
  );
}

export function isPillarKey(value: unknown): value is PillarKey {
  return typeof value === 'string' && (PILLAR_KEYS as string[]).includes(value);
}

export function buildPillarCompletion(
  selectedQuestionIds: string[],
  answers: Record<string, OptionKey>,
  questionPillarMap: Record<string, PillarKey>
): Record<PillarKey, PillarProgress> {
  const totals = createEmptyPillarCompletion();

  for (const qId of selectedQuestionIds) {
    const pillar = questionPillarMap[qId];
    if (!isPillarKey(pillar)) continue;
    totals[pillar].total += 1;
    if (answers[qId]) totals[pillar].answered += 1;
  }

  return totals;
}

export const OPTION_SCORES: Record<OptionKey, number> = {
  A: 100,
  B: 70,
  C: 40,
  D: 10,
};

export const GRADE_BOUNDARIES = {
  A: 85,
  B: 70,
  C: 50,
  D: 25,
} as const;

export function classifyGrade(score: number): ReadinessGrade {
  if (score >= GRADE_BOUNDARIES.A) return 'A';
  if (score >= GRADE_BOUNDARIES.B) return 'B';
  if (score >= GRADE_BOUNDARIES.C) return 'C';
  if (score >= GRADE_BOUNDARIES.D) return 'D';
  return 'F';
}

export function gradeColor(grade: ReadinessGrade): string {
  const colors: Record<ReadinessGrade, string> = {
    A: 'var(--success)',
    B: 'var(--info)',
    C: 'var(--warning)',
    D: 'var(--warning-strong)',
    F: 'var(--danger)',
  };
  return colors[grade];
}

export function gradeLabel(grade: ReadinessGrade): string {
  const labels: Record<ReadinessGrade, string> = {
    A: 'Export-Ready',
    B: 'Developing',
    C: 'Significant Gaps',
    D: 'Not Ready',
    F: 'Critical Deficiencies',
  };
  return labels[grade];
}

export interface ScoringInput {
  selectedQuestions: string[];
  resolvedAnswers: Record<string, OptionKey>;
  questionPillarMap: Record<string, PillarKey>;
}

export function calculateReadinessScore(input: ScoringInput): ScoringResult {
  const pillarTotals: Partial<Record<PillarKey, { sum: number; count: number }>> = {};

  for (const qId of input.selectedQuestions) {
    const key = input.resolvedAnswers[qId];
    if (!key) continue;
    const pillar = input.questionPillarMap[qId];
    if (!pillar) continue;
    const bucket = pillarTotals[pillar] ?? { sum: 0, count: 0 };
    bucket.sum += OPTION_SCORES[key];
    bucket.count += 1;
    pillarTotals[pillar] = bucket;
  }

  const pillarScores = {} as Record<PillarKey, number>;
  (Object.keys(PILLAR_WEIGHTS) as PillarKey[]).forEach((pillar) => {
    const bucket = pillarTotals[pillar];
    pillarScores[pillar] = bucket && bucket.count > 0 ? bucket.sum / bucket.count : 0;
  });

  let overallScore = 0;
  (Object.keys(PILLAR_WEIGHTS) as PillarKey[]).forEach((pillar) => {
    overallScore += pillarScores[pillar] * PILLAR_WEIGHTS[pillar];
  });

  overallScore = Math.round(overallScore * 100) / 100;
  const gaps = (Object.keys(pillarScores) as PillarKey[]).filter(
    (p) => pillarScores[p] < 50
  );

  return {
    overallScore,
    grade: classifyGrade(overallScore),
    pillarScores,
    gaps,
  };
}

export function computeScore(
  answers: Record<string, OptionKey>,
  questionPillarMap: Record<string, PillarKey>,
  selectedQuestions: string[]
): ScoringResult {
  return calculateReadinessScore({
    selectedQuestions,
    resolvedAnswers: answers,
    questionPillarMap,
  });
}
