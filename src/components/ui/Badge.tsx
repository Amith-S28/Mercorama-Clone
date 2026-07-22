import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'healthy'
  | 'degraded'
  | 'down'
  | 'unconfigured'
  | 'unknown';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-obsidian/5 text-obsidian/70 border-border-light',
  accent: 'bg-accent-muted text-accent border-accent/20',
  healthy: 'bg-status-healthy/10 text-status-healthy border-status-healthy/25',
  degraded: 'bg-status-degraded/10 text-status-degraded border-status-degraded/25',
  down: 'bg-status-down/10 text-status-down border-status-down/25',
  unconfigured:
    'bg-status-unconfigured/10 text-status-unconfigured border-status-unconfigured/25',
  unknown: 'bg-status-unknown/10 text-status-unknown border-status-unknown/25',
};

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'ui-root inline-flex items-center gap-1',
        'rounded-full border px-2.5 py-0.5',
        'font-mono text-xs uppercase tracking-widest',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
