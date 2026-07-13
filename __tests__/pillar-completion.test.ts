import { describe, expect, it } from 'vitest';
import {
  buildPillarCompletion,
  createEmptyPillarCompletion,
  PILLAR_KEYS,
} from '@/lib/scoring-engine';
import { getQuestionPillarMap, selectAssessmentQuestions } from '@/lib/question-pool';

describe('buildPillarCompletion', () => {
  it('initializes all nine pillars without prototype pollution', () => {
    const empty = createEmptyPillarCompletion();
    for (const pillar of PILLAR_KEYS) {
      expect(empty[pillar]).toEqual({ answered: 0, total: 0 });
    }
    expect(Object.getPrototypeOf(empty)).toBeNull();
  });

  it('counts answered questions per pillar for a 30-question set', () => {
    const selected = selectAssessmentQuestions(7);
    const pillarMap = getQuestionPillarMap();
    const answers = Object.fromEntries(selected.map((id, index) => [id, index % 2 === 0 ? 'A' : 'B'])) as Record<
      string,
      'A' | 'B'
    >;

    const completion = buildPillarCompletion(selected, answers, pillarMap);
    const totalQuestions = PILLAR_KEYS.reduce((sum, pillar) => sum + completion[pillar].total, 0);
    const totalAnswered = PILLAR_KEYS.reduce((sum, pillar) => sum + completion[pillar].answered, 0);

    expect(selected).toHaveLength(30);
    expect(totalQuestions).toBe(30);
    expect(totalAnswered).toBe(30);
  });
});
