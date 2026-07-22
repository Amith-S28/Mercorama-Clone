'use client';

import { motion } from 'motion/react';
import type { ReadinessGrade } from '@/types';
import { gradeColor, gradeLabel } from '@/lib/scoring-engine';
import { useCountUp } from '@/hooks';
import { snappy } from '@/lib/animation/presets';

export interface ScoreGaugeProps {
  score: number;
  grade: ReadinessGrade;
}

const SIZE = 168;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score, grade }: ScoreGaugeProps) {
  const animatedScore = useCountUp(score, { decimals: 1 });
  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;
  const color = gradeColor(grade);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <p className="mono-label" style={{ color: 'var(--text-tertiary)', alignSelf: 'flex-start' }}>
        Readiness Score
      </p>

      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--border-low-contrast)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={snappy}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: '2rem',
              fontWeight: 600,
              lineHeight: 1,
              color,
            }}
          >
            {grade}
          </span>
          <span
            style={{
              marginTop: '0.25rem',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: '1.125rem',
              color: 'var(--text-primary)',
            }}
          >
            {animatedScore.toFixed(1)}
          </span>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        {gradeLabel(grade)}
      </p>
    </div>
  );
}
