'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  /** The value of the slider */
  value: number;
  /** Callback fired when the value changes */
  onChange: (value: number) => void;
  /** Minimum slider value */
  min: number;
  /** Maximum slider value */
  max: number;
  /** Incremental step size */
  step?: number;
  /** Extra container styling */
  className?: string;
}

/**
 * A beautiful, design-engineered range slider styled with active track fill.
 * Follows layout design cues from Watermelon UI.
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
}: SliderProps) {
  const id = useId();
  
  // Calculate percentage of track completion
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('relative w-full flex items-center py-2 select-none', className)}>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="custom-slider"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`,
        }}
        aria-label="Value slider"
      />
    </div>
  );
}
