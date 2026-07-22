import { cn } from '@/lib/utils';

export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps {
  size?: LoaderSize;
  label?: string;
  className?: string;
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export function Loader({ size = 'md', label = 'Loading', className }: LoaderProps) {
  return (
    <div
      className={cn(
        'ui-root inline-flex items-center gap-2',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span
        className={cn(
          'animate-spin rounded-full border-accent border-t-transparent',
          sizeClasses[size]
        )}
        aria-hidden
      />
      {label ? (
        <span className="font-mono text-xs uppercase tracking-widest text-obsidian/50">
          {label}
        </span>
      ) : null}
    </div>
  );
}
