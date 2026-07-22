'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const VIEW_LABELS: Record<string, string> = {
  'profile':         'Business Profile',
  'canada-markets':  'Canada Markets',
  'canada-plan':     'Canada Go-to-Market Plan',
  'global-markets':  'Global Markets',
  'export-plan':     'Export Plan',
  'trade-advantage': 'Trade Advantage',
  'freight-connect': 'Freight Connect',
  'fund-my-export':  'Fund My Export',
  'find-experts':    'Find Experts',
};

// Legacy tool param labels (for ?tool= routes)
const TOOL_LABELS: Record<string, string> = {
  'deal-wizard':              'Export Plan',
  'export-compass':           'Global Markets',
  'fta-diversify':            'Trade Advantage',
  'fund-my-export':           'Fund My Export',
  'freight-connect':          'Freight Connect',
  'find-experts':             'Find Experts',
  'incoterms-analyzer':       'Incoterms Analyzer',
  'hs-code-assistant':        'HS Code Assistant',
  'deal-summary-generator':   'Deal Summary',
  'contract-generator':       'Deal Summary',
};

export function DashboardBreadcrumb() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const tool = searchParams.get('tool');

  const activeLabel = view ? VIEW_LABELS[view] : tool ? TOOL_LABELS[tool] : null;

  if (!activeLabel) return null;

  return (
    <nav className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home className="h-3 w-3" />
        <span>Dashboard</span>
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{activeLabel}</span>
    </nav>
  );
}
