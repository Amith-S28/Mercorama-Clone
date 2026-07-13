'use client';

import { motion } from 'motion/react';
import type { PillarKey } from '@/types';
import { PILLAR_KEYS, PILLAR_LABELS, createEmptyPillarCompletion, type PillarProgress } from '@/lib/scoring-engine';
import { cn } from '@/lib/cn';
import { smooth } from '@/lib/animation/presets';

export type { PillarProgress };

export interface PillarProgressBarProps {
  completion: Partial<Record<PillarKey, PillarProgress>>;
  className?: string;
}

export function PillarProgressBar({ completion, className }: PillarProgressBarProps) {
  const safeCompletion = { ...createEmptyPillarCompletion(), ...completion };

  const overallAnswered = PILLAR_KEYS.reduce(
    (sum, key) => sum + safeCompletion[key].answered,
    0
  );
  const overallTotal = PILLAR_KEYS.reduce((sum, key) => sum + safeCompletion[key].total, 0);
  const overallPct = overallTotal > 0 ? (overallAnswered / overallTotal) * 100 : 0;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>Assessment progress</span>
        <span className="font-mono text-[var(--accent-premium)]">
          {overallAnswered}/{overallTotal}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--bg-elevated)]">
        <motion.div
          className="h-full rounded-[var(--radius-pill)] bg-[var(--accent-premium)]"
          initial={{ width: 0 }}
          animate={{ width: `${overallPct}%` }}
          transition={smooth}
        />
      </div>

      <ul className="grid gap-2 sm:grid-cols-3">
        {PILLAR_KEYS.map((pillar) => {
          const { answered, total } = safeCompletion[pillar];
          const pct = total > 0 ? (answered / total) * 100 : 0;
          const complete = answered >= total && total > 0;

          return (
            <li
              key={pillar}
              className="rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                  {PILLAR_LABELS[pillar]}
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[10px]',
                    complete ? 'text-[var(--accent-success)]' : 'text-[var(--text-muted)]'
                  )}
                >
                  {answered}/{total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--bg-secondary)]">
                <motion.div
                  className={cn(
                    'h-full rounded-[var(--radius-pill)]',
                    complete ? 'bg-[var(--accent-success)]' : 'bg-[var(--accent-premium)]'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={smooth}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
