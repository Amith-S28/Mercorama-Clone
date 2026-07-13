'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="ui-root flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="font-mono text-xs uppercase tracking-widest text-obsidian/50"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-3xl border border-border-light bg-paper-white',
            'px-4 text-sm text-obsidian outline-none',
            'placeholder:text-obsidian/35',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-status-down focus:border-status-down focus:ring-status-down/20',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error ? (
          <p
            id={`${inputId}-error`}
            className="text-xs text-status-down"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
