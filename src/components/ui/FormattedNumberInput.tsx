'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

export interface FormattedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
}

export function FormattedNumberInput({
  value,
  onChange,
  min = 0,
  max,
  className,
  placeholder,
  prefix = '',
  suffix = '',
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Sync external value to internal string representation
  useEffect(() => {
    setDisplayValue(value.toLocaleString());
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // Remove non-digit characters except period and minus
    raw = raw.replace(/[^\d.-]/g, '');

    if (raw === '' || raw === '-') {
      setDisplayValue(raw);
      onChange(0);
      return;
    }

    const numeric = parseFloat(raw);
    if (!isNaN(numeric)) {
      // Check constraints
      let bounded = numeric;
      if (max !== undefined && bounded > max) bounded = max;
      if (min !== undefined && bounded < min) bounded = min;
      
      // Update string representation for cursor stability during typing, 
      // but if the user reaches max/min, we clamp it immediately.
      if (numeric !== bounded) {
         setDisplayValue(bounded.toLocaleString());
      } else {
         // Add commas to the raw number string
         const parts = raw.split('.');
         parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
         setDisplayValue(parts.join('.'));
      }
      
      onChange(bounded);
    }
  };

  const handleBlur = () => {
    if (displayValue === '' || displayValue === '-') {
      setDisplayValue(min.toLocaleString());
      onChange(min);
    } else {
      setDisplayValue(value.toLocaleString());
    }
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      {prefix && (
        <span className="absolute left-3 text-[var(--text-secondary)] font-mono text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          'w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-interactive)] px-3 py-2 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-premium)] transition-colors',
          prefix && 'pl-8',
          suffix && 'pr-8'
        )}
      />
      {suffix && (
        <span className="absolute right-3 text-[var(--text-secondary)] font-mono text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
