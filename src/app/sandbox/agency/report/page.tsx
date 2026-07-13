import { Suspense } from 'react';
import { ReportWorkspace } from '@/components/report/ReportWorkspace';

export default function AgencyReportPage() {
  return (
    <Suspense fallback={<div className="page-container">Loading report…</div>}>
      <ReportWorkspace />
    </Suspense>
  );
}
