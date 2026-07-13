import { describe, expect, it } from 'vitest';
import { buildAiReport } from '@/lib/ai-report-builder';
import type { PillarKey } from '@/types';

const pillarScores = {
  management: 80,
  product: 90,
  operations: 70,
  financial: 45,
  legal: 75,
  market: 70,
  cultural: 55,
  digital: 60,
  programs: 68,
} satisfies Record<PillarKey, number>;

describe('ai-report-builder', () => {
  it('summarizes SME readiness with identified gaps', () => {
    const report = buildAiReport({
      smeName: 'Atlantic Maple Foods Inc.',
      targetCountryName: 'Japan',
      overallScore: 72.4,
      grade: 'B',
      pillarScores,
      gaps: ['financial', 'cultural'],
    });

    expect(report.summary).toContain('Atlantic Maple Foods Inc.');
    expect(report.summary).toContain('Japan');
    expect(report.gaps).toContain('financial');
    expect(report.actions.length).toBeGreaterThan(0);
    expect(report.actions[0]?.tool).toBeTruthy();
  });

  it('derives gaps from pillar scores when none are provided', () => {
    const report = buildAiReport({
      smeName: 'Nordic Precision',
      targetCountryName: 'Germany',
      overallScore: 58,
      grade: 'C',
      pillarScores: { ...pillarScores, financial: 40, cultural: 42 },
      gaps: [],
    });

    expect(report.gaps).toContain('financial');
    expect(report.gaps).toContain('cultural');
  });
});
