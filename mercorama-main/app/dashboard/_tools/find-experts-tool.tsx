'use client';

import { Suspense } from 'react';
import { ExpertSearchClient } from '@/app/experts/search/_client';

export function FindExpertsTool() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>}>
      <ExpertSearchClient inDashboard />
    </Suspense>
  );
}
