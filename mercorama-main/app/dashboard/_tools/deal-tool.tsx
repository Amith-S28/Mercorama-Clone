// app/dashboard/_tools/deal-tool.tsx
'use client';

import { useEffect, useState } from 'react';
import { DealWizard } from '@/app/deal/_components/deal-wizard';
import { Briefcase } from 'lucide-react';
import { ToolCrossPromo } from '../_components/tool-cross-promo';
import { WorkflowBanner as StepBanner } from '@/components/workflow-banner';

export function DealTool() {
  const [compassMarket, setCompassMarket] = useState<string | null>(null);

  useEffect(() => {
    try { const r = localStorage.getItem('mercorama_export_compass'); if (r) { const d = JSON.parse(r); setCompassMarket(d.country ?? d.market ?? null); } } catch {}
  }, []);

  return (
    <div>
      <StepBanner
        step={4}
        totalSteps={4}
        label="Deal Builder"
        contextChip={compassMarket ? `Export plan: ${compassMarket}` : undefined}
      />
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
          <Briefcase className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Deal Builder</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          HS Code to Export-Ready Deal Summary
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Start with a product description. We classify the HS Code, guide you through Incoterm
          selection, and generate a deal summary for advisor review — all in four steps.
        </p>
      </div>
      <DealWizard />
      <ToolCrossPromo currentTool="deal-wizard" />
    </div>
  );
}
