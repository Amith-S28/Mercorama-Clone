// app/dashboard/_tools/export-compass-tool.tsx
'use client';

import { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { ExportCompassWizard } from '@/app/export-compass/_components/export-compass-wizard';
import { ToolCrossPromo } from './../_components/tool-cross-promo';
import { ExpertCTA } from '@/components/ExpertCTA';
import { WorkflowBanner as StepBanner } from '@/components/workflow-banner';

export function ExportCompassTool({
  product,
  hsCode,
}: {
  product?: string;
  hsCode?: string;
}) {
  const [canadaFocus, setCanadaFocus] = useState<string | null>(null);
  const [snapshotProduct, setSnapshotProduct] = useState('');

  useEffect(() => {
    try { const r = localStorage.getItem('mercorama_canada_focus'); if (r) { const d = JSON.parse(r); setCanadaFocus(d.province ?? null); } } catch {}
    try { const r = localStorage.getItem('mercorama_snapshot'); if (r) { const d = JSON.parse(r); setSnapshotProduct(d.productDescription ?? ''); } } catch {}
  }, []);

  const initialProduct = product ? decodeURIComponent(product) : snapshotProduct;
  const initialHsCode  = hsCode  ? decodeURIComponent(hsCode)  : '';

  return (
    <div>
      <StepBanner
        step={3}
        totalSteps={4}
        label="Export Compass"
        contextChip={canadaFocus ? `Building on: ${canadaFocus}` : undefined}
      />
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5">
          <Compass className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">A GPS for Canadian exporters</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Export Compass</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Find the top 10 global export markets for any Canadian product — AI-powered scoring
          across demand, growth, FTA access, logistics, and risk.
        </p>
      </div>
      <ExportCompassWizard initialProduct={initialProduct} initialHsCode={initialHsCode} />
      <div className="mt-4">
        <ExpertCTA context="these market results" />
      </div>
      <ToolCrossPromo currentTool="export-compass" />
    </div>
  );
}
