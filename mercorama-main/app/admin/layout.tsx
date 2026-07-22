'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_EMAILS } from '@/lib/admin';
import { createClient } from '@/lib/supabase/client';
import { DashboardSidebar } from '@/app/dashboard/_sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
        router.replace('/dashboard');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  if (!ready) return null;

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
