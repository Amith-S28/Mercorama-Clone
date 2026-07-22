import { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardSidebar } from './_sidebar';
import { WelcomeModal } from './_components/welcome-modal';

export const metadata: Metadata = {
  title: 'Dashboard – Mercorama | AI-Powered Trade Intelligence Platform',
  description: 'View your trade analysis history, track Incoterm usage, and access past HS Code classifications and deal summaries.',
  keywords: ['trade dashboard', 'analysis history', 'trade analytics'],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<div className="hidden md:block w-64 shrink-0 border-r bg-background transition-all duration-200" />}>
        <DashboardSidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-20 md:pt-10 md:px-8 md:py-10">
        {children}
      </main>
      <WelcomeModal />
    </div>
  );
}
