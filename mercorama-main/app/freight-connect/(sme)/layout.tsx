// app/freight-connect/layout.tsx
// Wraps all /freight-connect/* pages with the dashboard sidebar.
import { Suspense } from 'react';
import { DashboardSidebar } from '@/app/dashboard/_sidebar';

export default function FreightConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<div className="hidden md:block w-64 shrink-0 border-r bg-background" />}>
        <DashboardSidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-20 md:pt-10 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
