import { type HTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { icon: typeof Info; classes: string }
> = {
  info: {
    icon: Info,
    classes: 'border-accent/25 bg-accent-muted text-obsidian',
  },
  success: {
    icon: CheckCircle2,
    classes:
      'border-status-healthy/25 bg-status-healthy/10 text-obsidian',
  },
  warning: {
    icon: AlertTriangle,
    classes:
      'border-status-degraded/25 bg-status-degraded/10 text-obsidian',
  },
  error: {
    icon: AlertCircle,
    classes: 'border-status-down/25 bg-status-down/10 text-obsidian',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const { icon: Icon, classes } = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        'ui-root flex gap-3 rounded-3xl border p-4',
        classes,
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
      <div className="flex flex-col gap-1 min-w-0">
        {title ? (
          <p className="text-sm font-semibold">{title}</p>
        ) : null}
        {children ? (
          <div className="text-sm opacity-80">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
