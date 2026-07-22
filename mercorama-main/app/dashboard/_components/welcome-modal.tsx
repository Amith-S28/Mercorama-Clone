// app/dashboard/_components/welcome-modal.tsx
// Shows once on first dashboard visit after activation (?welcome=1 in URL).
// Uses localStorage to ensure it never shows again after dismiss.
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LS_KEY = 'mercorama_welcomed';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function WelcomeModalInner() {
  const params   = useSearchParams();
  const router   = useRouter();
  const pathname = usePathname();

  const welcomeParam = params.get('welcome') === '1';
  const plan         = params.get('plan') ?? 'starter';
  const price        = params.get('price') ?? (plan === 'growth' ? '299' : '99');

  const [open, setOpen] = useState(false);

  // Compute locked-until date (6 months from now) at render time
  const lockedUntil = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString();
  })();

  useEffect(() => {
    if (!welcomeParam) return;
    const already = localStorage.getItem(LS_KEY);
    if (!already) setOpen(true);
  }, [welcomeParam]);

  function dismiss() {
    localStorage.setItem(LS_KEY, 'true');
    setOpen(false);
    // Remove ?welcome=1 from URL without triggering a navigation
    router.replace(pathname, { scroll: false });
  }

  if (!open) return null;

  const planName    = plan === 'growth' ? 'Growth' : 'Starter';
  const ctaHref     = plan === 'growth' ? '/export-compass' : '/dashboard?tool=hs-code-assistant';
  const ctaLabel    = plan === 'growth' ? 'Start with Export Compass →' : 'Start with HS Code Assistant →';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative bg-background rounded-2xl border shadow-2xl w-full max-w-md p-8 space-y-5">

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6100]">
            Founding Member
          </p>
          <h2 className="text-xl font-bold tracking-tight">
            Welcome to Mercorama.
          </h2>
        </div>

        <div className="rounded-lg border bg-muted/40 px-4 py-4 space-y-1.5 text-sm">
          <p>
            <span className="text-muted-foreground">Plan:</span>{' '}
            <strong>{planName}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Founding price:</span>{' '}
            <strong>${price}/mo CAD</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Price locked until:</span>{' '}
            <strong>{formatDate(lockedUntil)}</strong>
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          You're one of our founding members. Your founding rate is locked for
          at least 6 months — regardless of platform growth.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <Link href={ctaHref} onClick={dismiss}>
            <Button className="w-full bg-[#FF6100] hover:bg-[#e55800] text-white">
              {ctaLabel}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground">
            Skip for now
          </Button>
        </div>

      </div>
    </div>
  );
}

export function WelcomeModal() {
  return (
    <Suspense fallback={null}>
      <WelcomeModalInner />
    </Suspense>
  );
}
