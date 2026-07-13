import { Suspense } from 'react';
import { AgencyPortfolioClient } from '@/components/agency/AgencyPortfolioClient';

export default function AgencyPortfolioPage() {
  return (
    <Suspense fallback={<div className="page-container">Loading portfolio…</div>}>
      <AgencyPortfolioClient />
    </Suspense>
  );
}
