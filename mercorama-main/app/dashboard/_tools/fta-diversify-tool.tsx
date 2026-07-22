// app/dashboard/_tools/fta-diversify-tool.tsx
'use client';

import { Globe } from 'lucide-react';
import { FtaDiversifyWizard } from '@/app/fta-diversify/_components/fta-diversify-wizard';
import { ToolCrossPromo } from '../_components/tool-cross-promo';
import { WorkflowBanner, WorkflowProgress } from '@/components/WorkflowBanner';

export function FtaDiversifyTool() {
  return (
    <div>
      <WorkflowBanner currentTool="fta" />
      <WorkflowProgress currentTool="fta" />
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 px-3 py-1.5">
          <Globe className="h-4 w-4 text-teal-700 dark:text-teal-400" />
          <span className="text-sm font-medium text-teal-700 dark:text-teal-400">Canada FTA Market Discovery</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Trade Advantage
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Discover new export markets where Canada's Free Trade Agreements give your product a
          tariff advantage — with AI-generated market snapshots and outlooks.
        </p>
      </div>
      <FtaDiversifyWizard />
      <ToolCrossPromo currentTool="fta-diversify" />
    </div>
  );
}
