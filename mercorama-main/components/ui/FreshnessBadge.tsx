// components/ui/FreshnessBadge.tsx
// DT-3 — Visual freshness badge for data points.
// Maps confidence_level → colour-coded pill with hover tooltip.

import { type ConfidenceLevel, type SourceTag } from '@/lib/export-compass';

const BADGE_CONFIG: Record<ConfidenceLevel, {
  dot: string;
  label: string;
  bg: string;
  text: string;
  border: string;
}> = {
  verified:  { dot: '🟢', label: 'Live',      bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  current:   { dot: '🔵', label: 'Current',   bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-400',   border: 'border-blue-200 dark:border-blue-800'   },
  aging:     { dot: '🟡', label: 'Aging',     bg: 'bg-yellow-50 dark:bg-yellow-900/20',text: 'text-yellow-700 dark:text-yellow-400',border: 'border-yellow-200 dark:border-yellow-800'},
  stale:     { dot: '🟠', label: 'Stale',     bg: 'bg-orange-50 dark:bg-orange-900/20',text: 'text-orange-700 dark:text-orange-400',border: 'border-orange-200 dark:border-orange-800'},
  estimated: { dot: '⚪', label: 'Estimated', bg: 'bg-muted',                           text: 'text-muted-foreground',               border: 'border-border'                          },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

interface FreshnessBadgeProps {
  confidenceLevel: ConfidenceLevel;
  sourceTag: SourceTag;
  lastVerifiedAt: string | null;
  className?: string;
}

export function FreshnessBadge({
  confidenceLevel,
  sourceTag,
  lastVerifiedAt,
  className = '',
}: FreshnessBadgeProps) {
  const cfg = BADGE_CONFIG[confidenceLevel];

  const tooltip = confidenceLevel === 'estimated'
    ? 'This value is estimated and has not been verified against a live data source. Use with caution.'
    : `Data sourced from ${sourceTag}. Last verified ${lastVerifiedAt ? formatDate(lastVerifiedAt) : 'unknown'}.`;

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold select-none cursor-default ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      <span className="text-[8px] leading-none">{cfg.dot}</span>
      {cfg.label}
    </span>
  );
}

// SourceTag pill — same visual system, used inline beside data points
export function SourceTagPill({ tag }: { tag: SourceTag }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground select-none">
      {tag}
    </span>
  );
}
