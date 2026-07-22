'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpertCTAProps {
  context?: string; // e.g. "this HS classification" or "these market results"
}

export function ExpertCTA({ context }: ExpertCTAProps) {
  return (
    <div className="rounded-xl border bg-[#01696f]/5 dark:bg-[#4f98a3]/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Users className="h-5 w-5 text-[#01696f] dark:text-[#4f98a3] shrink-0 mt-0.5 sm:mt-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">Need expert guidance{context ? ` on ${context}` : ''}?</div>
        <p className="text-xs text-muted-foreground">Connect with verified trade professionals — customs brokers, CITP/FIBP advisors, and logistics specialists.</p>
      </div>
      <Link href="/experts/search" className="shrink-0">
        <Button size="sm" variant="outline">Find an Expert</Button>
      </Link>
    </div>
  );
}
