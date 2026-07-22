'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-store';

/**
 * Redirects logged-in users to the dashboard tool page.
 * Place at the top of any standalone tool page.
 */
export function AuthRedirect({ dashboardTool }: { dashboardTool: string }) {
  const router = useRouter();
  useEffect(() => {
    if (getAuthUser()) {
      router.replace(`/dashboard?tool=${dashboardTool}`);
    }
  }, [dashboardTool, router]);
  return null;
}
