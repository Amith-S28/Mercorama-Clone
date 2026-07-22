'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowBannerProps {
  step: number;
  totalSteps: number;
  label: string;
  ctaLabel?: string;
  ctaHref?: string;
  contextChip?: string;
}

export function WorkflowBanner({ step, totalSteps, label, ctaLabel, ctaHref, contextChip }: WorkflowBannerProps) {
  return (
    <div className="mb-4 rounded-lg bg-muted/40 border px-4 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {contextChip && (
            <span className="rounded-full bg-[#01696f]/10 text-[#01696f] dark:text-[#4f98a3] px-2.5 py-0.5 text-xs font-medium truncate max-w-[200px]">
              {contextChip}
            </span>
          )}
          {ctaLabel && ctaHref && (
            <Link href={ctaHref} className="flex items-center gap-1 text-sm font-semibold text-[#01696f] dark:text-[#4f98a3] hover:underline">
              {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
