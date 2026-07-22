// app/dashboard/_components/tool-cross-promo.tsx
// 3-card cross-promotion strip shown at the bottom of every tool.
'use client';

import Link from 'next/link';
import {
  Ship, PackageSearch, Briefcase,
  Globe, Compass, DollarSign, Truck, ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ToolDef = {
  id:          string;
  label:       string;
  tagline:     string;
  icon:        LucideIcon;
  href:        string;
  iconBg:      string;
  iconColor:   string;
};

const ALL_TOOLS: ToolDef[] = [
  {
    id:        'incoterms-analyzer',
    label:     'Incoterms Analyzer',
    tagline:   'Pick the right trade term and understand who bears the risk.',
    icon:      Ship,
    href:      '/dashboard?tool=incoterms-analyzer',
    iconBg:    'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-700 dark:text-blue-400',
  },
  {
    id:        'hs-code-assistant',
    label:     'HS Code Assistant',
    tagline:   'GRI-based classification with duty rates and risk flags.',
    icon:      PackageSearch,
    href:      '/dashboard?tool=hs-code-assistant',
    iconBg:    'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-700 dark:text-violet-400',
  },
  {
    id:        'deal-wizard',
    label:     'Export Plan',
    tagline:   'HS code → Incoterm → export-ready deal summary in one guided flow.',
    icon:      Briefcase,
    href:      '/dashboard?view=export-plan',
    iconBg:    'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id:        'fta-diversify',
    label:     'Trade Advantage',
    tagline:   'Discover FTA-backed export markets with tariff advantages.',
    icon:      Globe,
    href:      '/dashboard?view=trade-advantage',
    iconBg:    'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-700 dark:text-teal-400',
  },
  {
    id:        'export-compass',
    label:     'Global Markets',
    tagline:   'Rank the best global markets for your product.',
    icon:      Compass,
    href:      '/dashboard?view=global-markets',
    iconBg:    'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-700 dark:text-indigo-400',
  },
  {
    id:        'fund-my-export',
    label:     'Fund My Export',
    tagline:   'Find EDC and BDC financing programs matched to your deal.',
    icon:      DollarSign,
    href:      '/dashboard?view=fund-my-export',
    iconBg:    'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-700 dark:text-amber-400',
  },
  {
    id:        'freight-connect',
    label:     'Freight Connect',
    tagline:   'Find CIFFA-certified freight forwarders matched to your lane.',
    icon:      Truck,
    href:      '/dashboard?view=freight-connect',
    iconBg:    'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-700 dark:text-sky-400',
  },
];

// Pick 3 tools that are not the current one.
// Uses a deterministic rotation so the same tool always shows the same 3 suggestions.
function pickSuggestions(currentId: string): ToolDef[] {
  const others = ALL_TOOLS.filter((t) => t.id !== currentId);
  const start  = ALL_TOOLS.findIndex((t) => t.id === currentId);
  const picks: ToolDef[] = [];
  for (let i = 0; picks.length < 3; i++) {
    picks.push(others[(start + i) % others.length]);
  }
  return picks;
}

export function ToolCrossPromo({ currentTool }: { currentTool: string }) {
  const suggestions = pickSuggestions(currentTool);

  return (
    <div className="mt-12 border-t pt-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Also in Mercorama
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {suggestions.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="rounded-xl border bg-muted/20 p-4 flex flex-col gap-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tool.iconBg}`}>
                  <Icon className={`h-4 w-4 ${tool.iconColor}`} />
                </div>
                <p className="text-sm font-semibold leading-tight">{tool.label}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {tool.tagline}
              </p>
              <Link href={tool.href}>
                <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                  Try it <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
