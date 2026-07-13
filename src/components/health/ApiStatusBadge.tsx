import type { ApiHealthStatus } from '@/types';
import { Badge, type BadgeVariant } from '@/components/ui/crazxy/Badge';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<ApiHealthStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
  unconfigured: 'Unconfigured',
  unknown: 'Unknown',
};

const STATUS_VARIANTS: Record<ApiHealthStatus, BadgeVariant> = {
  healthy: 'healthy',
  degraded: 'degraded',
  down: 'down',
  unconfigured: 'unconfigured',
  unknown: 'unknown',
};

const STATUS_DOT_CLASS: Record<ApiHealthStatus, string> = {
  healthy: 'status-dot--healthy',
  degraded: 'status-dot--degraded',
  down: 'status-dot--down',
  unconfigured: 'status-dot--unconfigured',
  unknown: 'status-dot--unknown',
};

export interface ApiStatusBadgeProps {
  status: ApiHealthStatus;
  showDot?: boolean;
  className?: string;
}

export function ApiStatusBadge({
  status,
  showDot = true,
  className,
}: ApiStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={className}>
      {showDot ? (
        <span
          className={cn('status-dot', STATUS_DOT_CLASS[status])}
          aria-hidden
        />
      ) : null}
      {STATUS_LABELS[status]}
    </Badge>
  );
}
