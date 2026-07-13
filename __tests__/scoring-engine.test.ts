import { describe, it, expect } from 'vitest';
import {
  calculateReadinessScore,
  classifyGrade,
  PILLAR_WEIGHTS,
  OPTION_SCORES,
} from '@/lib/scoring-engine';
import { getQuestionPillarMap, selectAssessmentQuestions } from '@/lib/question-pool';

describe('scoring-engine', () => {
  const pillarMap = getQuestionPillarMap();

  it('all-A answers produce overall score >= 95%', () => {
    const selectedQuestions = selectAssessmentQuestions(1);
    const resolvedAnswers = Object.fromEntries(
      selectedQuestions.map((id) => [id, 'A' as const])
    );
    const result = calculateReadinessScore({
      selectedQuestions,
      resolvedAnswers,
      questionPillarMap: pillarMap,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(95);
    expect(result.grade).toBe('A');
  });

  it('all-D answers produce overall score <= 15%', () => {
    const selectedQuestions = selectAssessmentQuestions(2);
    const resolvedAnswers = Object.fromEntries(
      selectedQuestions.map((id) => [id, 'D' as const])
    );
    const result = calculateReadinessScore({
      selectedQuestions,
      resolvedAnswers,
      questionPillarMap: pillarMap,
    });
    expect(result.overallScore).toBeLessThanOrEqual(15);
    expect(result.grade).toBe('F');
  });

  it('mixed answers produce score in expected range', () => {
    const selectedQuestions = ['Q1.1', 'Q2.1', 'Q3.1', 'Q4.1', 'Q5.1'];
    const resolvedAnswers = {
      'Q1.1': 'A',
      'Q2.1': 'B',
      'Q3.1': 'C',
      'Q4.1': 'D',
      'Q5.1': 'A',
    } as const;
    const result = calculateReadinessScore({
      selectedQuestions,
      resolvedAnswers,
      questionPillarMap: pillarMap,
    });
    expect(result.overallScore).toBeGreaterThan(40);
    expect(result.overallScore).toBeLessThan(80);
  });

  it('pillar weights sum to exactly 1.00', () => {
    const sum = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('grade classification boundaries are correct', () => {
    expect(classifyGrade(85)).toBe('A');
    expect(classifyGrade(70)).toBe('B');
    expect(classifyGrade(50)).toBe('C');
    expect(classifyGrade(25)).toBe('D');
    expect(classifyGrade(24)).toBe('F');
  });

  it('missing answers are excluded from calculation', () => {
    const selectedQuestions = ['Q1.1', 'Q1.2', 'Q2.1'];
    const resolvedAnswers = { 'Q1.1': 'A' as const };
    const result = calculateReadinessScore({
      selectedQuestions,
      resolvedAnswers,
      questionPillarMap: pillarMap,
    });
    expect(result.pillarScores.management).toBe(100);
    expect(result.pillarScores.product).toBe(0);
  });
});

describe('OPTION_SCORES', () => {
  it('follows 100/70/40/10 gradient', () => {
    expect(OPTION_SCORES.A).toBe(100);
    expect(OPTION_SCORES.B).toBe(70);
    expect(OPTION_SCORES.C).toBe(40);
    expect(OPTION_SCORES.D).toBe(10);
  });
});

describe('selectAssessmentQuestions', () => {
  it('returns 30 questions with deterministic seed', () => {
    const a = selectAssessmentQuestions(42);
    const b = selectAssessmentQuestions(42);
    expect(a).toHaveLength(30);
    expect(a).toEqual(b);
  });
});
