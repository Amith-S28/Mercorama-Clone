import type { AiReport, PillarKey, ReadinessGrade } from '@/types';
import { PILLAR_LABELS } from '@/lib/scoring-engine';

const GAP_TOOLS: Partial<Record<PillarKey, string>> = {
  management: 'BDC Export Readiness Framework',
  product: 'CBSA Tariff Finder',
  operations: 'ICC Incoterms 2020',
  financial: 'EDC Account Performance Security',
  legal: 'CFIA Export Requirements',
  market: 'UN Comtrade',
  cultural: 'Trade Commissioner Service',
  digital: 'CanExport SMEs',
  programs: 'CanExport Funding',
};

export function buildAiReport(input: {
  smeName: string;
  targetCountryName: string;
  overallScore: number;
  grade: ReadinessGrade;
  pillarScores: Record<PillarKey, number>;
  gaps: PillarKey[];
}): AiReport {
  const criticalGaps = input.gaps.length > 0 ? input.gaps : findGaps(input.pillarScores);

  const actions = criticalGaps.slice(0, 5).map((pillar) => ({
    task: `Close ${PILLAR_LABELS[pillar].toLowerCase()} gap before ${input.targetCountryName} entry`,
    tool: GAP_TOOLS[pillar] ?? 'Trade Agency Playbook',
    regulation: pillar === 'legal' ? 'Import compliance review' : null,
  }));

  if (actions.length === 0) {
    actions.push({
      task: `Prepare distributor pitch pack for ${input.targetCountryName}`,
      tool: 'Export brief generator',
      regulation: null,
    });
  }

  return {
    summary: `${input.smeName} scores ${input.overallScore.toFixed(1)} (Grade ${input.grade}) for ${input.targetCountryName} export readiness. ${
      criticalGaps.length > 0
        ? `Priority gaps: ${criticalGaps.map((g) => PILLAR_LABELS[g]).join(', ')}.`
        : 'No pillar falls below the 50% readiness threshold.'
    }`,
    gaps: criticalGaps,
    actions,
  };
}

function findGaps(pillarScores: Record<PillarKey, number>): PillarKey[] {
  return (Object.keys(pillarScores) as PillarKey[]).filter((pillar) => pillarScores[pillar] < 50);
}
