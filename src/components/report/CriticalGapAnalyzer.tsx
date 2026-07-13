'use client';

import type { PillarKey } from '@/types';
import { PILLAR_LABELS } from '@/lib/scoring-engine';
import { motion } from 'motion/react';
import { snappy } from '@/lib/animation/presets';

export interface CriticalGapAnalyzerProps {
  pillarScores: Record<PillarKey, number>;
  threshold?: number;
}

export function CriticalGapAnalyzer({ pillarScores, threshold = 50 }: CriticalGapAnalyzerProps) {
  const gaps = (Object.keys(PILLAR_LABELS) as PillarKey[])
    .filter((key) => (pillarScores[key] ?? 0) < threshold)
    .map((key) => ({
      key,
      label: PILLAR_LABELS[key],
      score: pillarScores[key] ?? 0,
    }))
    .sort((a, b) => a.score - b.score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
          Critical Gaps
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Pillars below {threshold}% readiness threshold
        </p>
      </div>

      {gaps.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#22C55E' }}>
          No critical gaps — all pillars meet the {threshold}% threshold.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {gaps.map((gap, index) => (
            <motion.div
              key={gap.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...snappy, delay: index * 0.04 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-low-contrast)',
                background: 'var(--bg-primary)',
              }}
            >
              <span style={{ fontSize: '0.8125rem' }}>{gap.label}</span>
              <span
                className="mono-label"
                style={{ fontSize: '0.6875rem', color: '#EF4444' }}
              >
                {Math.round(gap.score)}%
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
