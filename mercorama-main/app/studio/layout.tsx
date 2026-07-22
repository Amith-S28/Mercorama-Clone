'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User, Briefcase, Calendar, CalendarDays, BookOpen, ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { label: 'Profile',      href: '/studio/profile',      icon: User },
  { label: 'Requests',     href: '/studio/requests',     icon: MessageSquare },
  { label: 'Services',     href: '/studio/services',     icon: Briefcase },
  { label: 'Availability', href: '/studio/availability', icon: Calendar },
  { label: 'Bookings',     href: '/studio/bookings',     icon: CalendarDays },
  { label: 'Collections',  href: '/studio/collections',  icon: BookOpen },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [expertName, setExpertName] = useState('');

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/signin?next=/studio/profile'); return; }

      // Verify user is an expert
      const res = await fetch('/api/studio/profile');
      if (!res.ok) { router.replace('/dashboard'); return; }
      const profile = await res.json();
      setExpertName(profile.headline?.split('—')[0]?.trim() ?? 'Expert');
      setLoading(false);
    }
    check();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="p-4 border-b">
          <Link href="https://mercorama.com" className="flex items-center gap-2 mb-3">
            <Image src="/mercorama_logo_2026.png" alt="Mercorama" width={120} height={30} className="h-7 w-auto" />
          </Link>
          <div className="text-xs text-muted-foreground">Expert Studio</div>
          <div className="font-semibold text-sm truncate">{expertName}</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Expert Studio</span>
          <Link href="/dashboard" className="text-xs text-muted-foreground">Dashboard</Link>
        </div>
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 mt-20 md:mt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
