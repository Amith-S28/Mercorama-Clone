'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { getWorkflow, clearWorkflow, SOURCE_LABELS, type WorkflowState } from '@/lib/workflow';
import { cn } from '@/lib/utils';

// ── Context Banner ────────────────────────────────────────────────────────────

export function WorkflowBanner({ currentTool }: { currentTool: 'deal' | 'fta' | 'compass' }) {
  const [wf, setWf] = useState<WorkflowState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const data = getWorkflow();
    if (data.source && data.source !== currentTool) setWf(data);
  }, [currentTool]);

  if (!wf || dismissed) return null;

  const label = SOURCE_LABELS[wf.source ?? ''] ?? '';
  const details: string[] = [];
  if (wf.product) details.push(wf.product.slice(0, 40));
  if (wf.hsCode) details.push(`HS ${wf.hsCode}`);
  if (wf.selectedMarket) details.push(wf.selectedMarket);

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-[#01696f]/10 border border-[#01696f]/20 px-4 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <ArrowRight className="h-4 w-4 text-[#01696f] shrink-0" />
        <div className="min-w-0">
          <span className="text-xs font-semibold text-[#01696f] dark:text-[#4f98a3]">{label}</span>
          {details.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">{details.join(' · ')}</span>
          )}
        </div>
      </div>
      <button onClick={() => { setDismissed(true); clearWorkflow(); }} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Progress Indicator ────────────────────────────────────────────────────────

const STEPS = [
  { key: 'deal', label: 'Product & HS' },
  { key: 'fta', label: 'FTA Markets' },
  { key: 'compass', label: 'Market Selection' },
  { key: 'final', label: 'Export Plan' },
];

export function WorkflowProgress({ currentTool }: { currentTool: 'deal' | 'fta' | 'compass' }) {
  const [wf, setWf] = useState<WorkflowState | null>(null);

  useEffect(() => {
    const data = getWorkflow();
    if (data.source || data.product) setWf(data);
  }, [currentTool]);

  if (!wf) return null;

  // Determine completion based on workflow state
  const completed = new Set<string>();
  if (wf.product || wf.hsCode) completed.add('deal');
  if ((wf.ftaMarkets ?? []).length > 0) completed.add('fta');
  if ((wf.compassMarkets ?? []).length > 0 || wf.selectedMarket) completed.add('compass');

  const currentIdx = STEPS.findIndex((s) => s.key === currentTool);

  return (
    <div className="mb-4 flex items-center justify-center gap-0 text-xs">
      {STEPS.map((step, i) => {
        const done = completed.has(step.key);
        const active = step.key === currentTool;
        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && <div className={cn('w-6 sm:w-10 h-px', done || i <= currentIdx ? 'bg-[#01696f]' : 'bg-border')} />}
            <div className="flex items-center gap-1">
              <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                done ? 'bg-[#01696f] text-white' : active ? 'bg-[#01696f] text-white' : 'bg-muted text-muted-foreground')}>
                {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn('hidden sm:inline', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
