'use client';

import { cn } from '@/lib/utils';

export interface LiveIndicatorProps {
  origin: 'live' | 'cache' | 'mock-fallback' | 'historical-offline' | string;
  sourceName?: string;
  className?: string;
}

export function LiveIndicator({ origin, sourceName, className }: LiveIndicatorProps) {
  const isLive = origin.startsWith('live');
  const isCache = origin === 'cache';
  
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]", className)}>
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isLive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" style={{ animationDuration: '2s' }}></span>
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            isLive ? "h-1.5 w-1.5 bg-[var(--success)]" : isCache ? "h-1.5 w-1.5 bg-[var(--success)] opacity-50" : "h-1.5 w-1.5 bg-[var(--warning)]"
          )}
        ></span>
      </span>
      {isLive ? 'LIVE' : isCache ? 'CACHED' : 'FALLBACK'}
      {sourceName && (
        <span className="opacity-60 ml-1 truncate max-w-[120px]" title={sourceName}>
          {sourceName}
        </span>
      )}
    </div>
  );
}
