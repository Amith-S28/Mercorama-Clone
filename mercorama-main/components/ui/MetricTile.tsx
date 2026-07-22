import * as React from 'react'
import { cn } from '@/lib/utils'

interface MetricTileProps {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  className?: string
}

function MetricTile({ label, value, trend, trendLabel, className }: MetricTileProps) {
  const trendColor =
    trend === undefined
      ? 'text-gray-500'
      : trend > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : trend < 0
          ? 'text-red-500 dark:text-red-400'
          : 'text-gray-500 dark:text-slate-400'

  return (
    <div
      data-slot="metric-tile"
      className={cn(
        'flex flex-col gap-1 rounded-2xl border border-gray-200 bg-card p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60',
        className,
      )}
    >
      <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
        {value}
      </span>
      {(trend !== undefined || trendLabel) && (
        <span className={cn('text-sm font-medium', trendColor)}>
          {trend !== undefined && (trend > 0 ? '+' : '')}{trend !== undefined ? `${trend}%` : ''}{' '}
          {trendLabel}
        </span>
      )}
    </div>
  )
}

export { MetricTile }
