// app/admin/pricing-archive/page.tsx
// Admin-only view of the archived pricing page.
// Non-admins are redirected to /dashboard.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MarketingCmsSection } from '@/components/marketing/MarketingCmsSection';

export default function PricingArchivePage() {
  const router  = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Admin gate: hit any admin endpoint; 401 = not admin → redirect
    fetch('/api/admin/freight-connect/overview')
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.replace('/dashboard');
        } else {
          setReady(true);
        }
      })
      .catch(() => router.replace('/dashboard'));
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-4 py-2 text-center">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
          Admin view — Archived pricing page (captured 26 March 2026). Not publicly accessible.
        </p>
      </div>
      <Navbar />
      <MarketingCmsSection slug="pricing" />
      <Footer />
    </div>
  );
}
