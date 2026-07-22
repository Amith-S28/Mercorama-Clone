'use client';

import { motion } from 'motion/react';
import type { IndustrySector } from '@/types';
import { cn } from '@/lib/utils';
import { snappy } from '@/lib/animation/presets';
import {
  Factory,
  Fish,
  HelpCircle,
  Shield,
  UtensilsCrossed,
} from '@/components/ui/icons';
import { GlowBorder } from '@/components/ui/effects/GlowBorder';

const SECTORS: {
  value: IndustrySector;
  label: string;
  description: string;
  icon: typeof UtensilsCrossed;
}[] = [
  {
    value: 'Food, Beverage & CPG',
    label: 'Food & CPG',
    description: 'Packaged foods, beverages, and consumer goods',
    icon: UtensilsCrossed,
  },
  {
    value: 'Seafood & Ocean Economy',
    label: 'Seafood',
    description: 'Fisheries, aquaculture, and marine products',
    icon: Fish,
  },
  {
    value: 'Advanced Manufacturing & Industrial',
    label: 'Manufacturing',
    description: 'Precision parts, machinery, and industrial goods',
    icon: Factory,
  },
  {
    value: 'Defence, Dual-Use & Critical Supply Chains',
    label: 'Defence & Dual-Use',
    description: 'Controlled goods requiring export compliance review',
    icon: Shield,
  },
  {
    value: 'Other / Unsure',
    label: 'Other / Unsure',
    description: 'Sector not listed or still being determined',
    icon: HelpCircle,
  },
];

export interface SectorSelectorProps {
  value: IndustrySector | '';
  onChange: (sector: IndustrySector) => void;
  disabled?: boolean;
}

export function SectorSelector({ value, onChange, disabled }: SectorSelectorProps) {
  return (
    <fieldset className="grid gap-3" disabled={disabled}>
      <legend className="sr-only">Industry sector</legend>
      {SECTORS.map((sector) => {
        const Icon = sector.icon;
        const selected = value === sector.value;
        return (
          <GlowBorder key={sector.value} active={selected}>
            <motion.label
              layout
              transition={snappy}
              className={cn(
                'relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors',
                selected
                  ? 'border-transparent bg-[color-mix(in_srgb,var(--accent-premium)_12%,transparent)]'
                  : 'border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] hover:border-[var(--border-medium-contrast)]',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <input
                type="radio"
                name="industry-sector"
                value={sector.value}
                checked={selected}
                onChange={() => onChange(sector.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] border',
                  selected
                    ? 'border-[var(--accent-premium)] text-[var(--accent-premium)]'
                    : 'border-[var(--border-low-contrast)] text-[var(--text-secondary)]'
                )}
                aria-hidden
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  {sector.label}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                  {sector.description}
                </span>
              </span>
              <span
                className={cn(
                  'mt-1 h-4 w-4 shrink-0 rounded-full border-2',
                  selected
                    ? 'border-[var(--accent-premium)] bg-[var(--accent-premium)]'
                    : 'border-[var(--border-medium-contrast)]'
                )}
                aria-hidden
              />
            </motion.label>
          </GlowBorder>
        );
      })}
    </fieldset>
  );
}
