// app/dashboard/_tools/freight-connect-tool.tsx
// Freight Connect embedded in the dashboard — shows the search UI inline.
'use client';

import Link from 'next/link';
import { Truck, Package, BarChart3, ExternalLink, Search } from 'lucide-react';
import { ToolCrossPromo } from '../_components/tool-cross-promo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trackEvent } from '@/lib/analytics';
import { useEffect, useState } from 'react';

export function FreightConnectTool() {
  const [isGrowth, setIsGrowth] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.ok ? r.json() : null)
      .then((me) => {
        const growth = me?.plan === 'team' || me?.plan === 'enterprise';
        setIsGrowth(growth);
        trackEvent('fc_dashboard_widget_viewed', { plan: growth ? 'growth' : 'starter' });
      })
      .catch(() => {});
  }, []);

  const LINKS = [
    {
      href: '/freight-connect',
      icon: Search,
      label: 'Find a Forwarder',
      description: 'Search CIFFA-certified forwarders by lane, mode, and HS chapter',
      cta: 'Open Freight Connect →',
      highlight: true,
    },
    {
      href: '/freight-connect/quotes',
      icon: Package,
      label: 'Quote Inbox',
      description: 'View pending and received quotes from forwarders',
      cta: 'View Inbox →',
      highlight: false,
    },
    ...(isGrowth ? [{
      href: '/freight-connect/analytics',
      icon: BarChart3,
      label: 'Lane Analytics',
      description: 'Track lanes, response rates, and rate benchmarks',
      cta: 'View Analytics →',
      highlight: false,
    }] : []),
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 px-3 py-1.5">
          <Truck className="h-4 w-4 text-sky-700 dark:text-sky-400" />
          <span className="text-sm font-medium text-sky-700 dark:text-sky-400">Freight Connect</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Find Your Freight Forwarder
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Match to CIFFA-certified Canadian freight forwarders — by product, destination market,
          and shipping mode. Request quotes anonymously. Reveal your identity only when ready.
        </p>
      </div>

      {/* Trust signals */}
      <div className="mb-8 flex flex-wrap gap-4">
        {[
          '✅ CIFFA-certified members only',
          '✅ Your identity stays private until you choose',
          '✅ 48-hour response SLA enforced',
        ].map((t) => (
          <span key={t} className="text-sm text-muted-foreground">{t}</span>
        ))}
      </div>

      {/* Quick action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(({ href, icon: Icon, label, description, cta, highlight }) => (
          <Card key={href} className={highlight ? 'border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50 dark:from-sky-900/20 to-background' : ''}>
            <CardContent className="pt-5 flex flex-col h-full">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${highlight ? 'bg-sky-100 dark:bg-sky-900/40' : 'bg-primary/10'}`}>
                  <Icon className={`h-4 w-4 ${highlight ? 'text-sky-700 dark:text-sky-400' : 'text-primary'}`} />
                </div>
                <p className="text-sm font-semibold">{label}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
                {description}
              </p>
              <Link href={href}>
                <Button
                  size="sm"
                  variant={highlight ? 'default' : 'outline'}
                  className={`w-full gap-1.5 ${highlight ? 'bg-sky-700 hover:bg-sky-800 text-white' : ''}`}
                  onClick={() => trackEvent('fc_dashboard_link_clicked', { destination: href })}
                >
                  {cta}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth upgrade nudge for starter users */}
      {!isGrowth && (
        <div className="mt-8 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Unlock Growth features
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
            Bulk quote requests (up to 3 forwarders), saved shortlists, lane analytics, and rate benchmarking.
          </p>
          <Link href="/beta">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              Upgrade to Growth ($249/mo) →
            </Button>
          </Link>
        </div>
      )}
      <ToolCrossPromo currentTool="freight-connect" />
    </div>
  );
}
