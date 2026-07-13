'use client';

import { motion } from 'motion/react';
import type { OptionKey, Question } from '@/types';
import { cn } from '@/lib/cn';
import { buttonSpring } from '@/lib/animation/presets';

export interface QuestionCardProps {
  question: Question;
  selected?: OptionKey;
  onSelect: (key: OptionKey) => void;
  disabled?: boolean;
  index?: number;
}

const OPTION_LABELS: Record<OptionKey, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
};

export function QuestionCard({
  question,
  selected,
  onSelect,
  disabled,
  index = 0,
}: QuestionCardProps) {
  return (
    <article className="space-y-4">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent-premium)]">
          Question {index + 1}
        </p>
        <h3 className="mt-2 text-base font-medium leading-relaxed text-[var(--text-primary)]">
          {question.text}
        </h3>
        {question.trap && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--accent-warning)]">Advisory trap: </span>
            {question.trap}
          </p>
        )}
      </header>

      <div className="grid gap-2" role="radiogroup" aria-label={question.text}>
        {question.options.map((option) => {
          const isSelected = selected === option.key;
          return (
            <motion.button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(option.key)}
              className={cn(
                'flex w-full items-start gap-3 rounded-[var(--radius-card)] border px-3 py-3 text-left transition-colors',
                isSelected
                  ? 'border-[var(--accent-premium)] bg-[color-mix(in_srgb,var(--accent-premium)_12%,transparent)]'
                  : 'border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] hover:border-[var(--border-medium-contrast)]',
                disabled && 'cursor-not-allowed opacity-60'
              )}
              whileHover={disabled ? undefined : { scale: 1.01, borderColor: 'var(--accent-premium)' }}
              whileTap={disabled ? undefined : { scale: 0.99 }}
              transition={buttonSpring.transition}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  isSelected
                    ? 'border-[var(--accent-premium)] bg-[var(--accent-premium)] text-[var(--bg-primary)]'
                    : 'border-[var(--border-medium-contrast)] text-[var(--text-secondary)]'
                )}
              >
                {OPTION_LABELS[option.key]}
              </span>
              <span className="text-sm leading-relaxed text-[var(--text-primary)]">{option.text}</span>
            </motion.button>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--text-muted)]">Source: {question.source}</p>
    </article>
  );
}
