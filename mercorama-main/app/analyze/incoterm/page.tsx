'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-store';
import { Loader2 } from 'lucide-react';

export default function IncotermsRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (getAuthUser()) {
      router.replace('/dashboard?tool=incoterms-analyzer');
    } else {
      router.replace('/auth/signin?callbackUrl=/dashboard?tool=incoterms-analyzer');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
