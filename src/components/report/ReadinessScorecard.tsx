'use client';

import type { AssessmentRecord } from '@/types';
import { ScoreGauge } from '@/components/report/ScoreGauge';
import { PillarsMatrix } from '@/components/report/PillarsMatrix';
import { CriticalGapAnalyzer } from '@/components/report/CriticalGapAnalyzer';

export interface ReadinessScorecardProps {
  assessment: AssessmentRecord;
}

export function ReadinessScorecard({ assessment }: ReadinessScorecardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="bento-grid">
        <div className="bento-card bento-card--span-4" style={{ display: 'flex', justifyContent: 'center' }}>
          <ScoreGauge score={assessment.overallScore} grade={assessment.grade} />
        </div>
        <div className="bento-card bento-card--span-8">
          <PillarsMatrix pillarScores={assessment.pillarScores} />
        </div>
      </div>
      <div className="bento-card">
        <CriticalGapAnalyzer pillarScores={assessment.pillarScores} />
      </div>
      {assessment.aiReport?.summary ? (
        <div className="bento-card">
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
            AI Advisory Summary
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {assessment.aiReport.summary}
          </p>
        </div>
      ) : null}
    </div>
  );
}
