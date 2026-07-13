'use client';

import { motion } from 'motion/react';
import type { PillarKey } from '@/types';
import { PILLAR_LABELS } from '@/lib/scoring-engine';
import { snappy } from '@/lib/animation/presets';

export interface PillarsMatrixProps {
  pillarScores: Record<PillarKey, number>;
}

function pillarColor(score: number): string {
  if (score >= 70) return '#22C55E';
  if (score >= 50) return '#2563EB';
  if (score >= 25) return '#F59E0B';
  return '#EF4444';
}

export function PillarsMatrix({ pillarScores }: PillarsMatrixProps) {
  const entries = (Object.keys(PILLAR_LABELS) as PillarKey[]).map((key) => ({
    key,
    label: PILLAR_LABELS[key],
    score: pillarScores[key] ?? 0,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
          Pillar Matrix
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Linear readiness breakdown across nine export pillars
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {entries.map(({ key, label, score }) => (
          <div key={key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '0.375rem',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{label}</span>
              <span
                className="mono-label"
                style={{ fontSize: '0.6875rem', color: pillarColor(score), flexShrink: 0 }}
              >
                {Math.round(score)}%
              </span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                transition={snappy}
                style={{ background: pillarColor(score) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
