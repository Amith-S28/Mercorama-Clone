'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExpertProfile } from '@/lib/experts';
import { SessionSelector } from './_session-selector';

interface ProfileClientProps {
  expert: ExpertProfile;
  children?: React.ReactNode;
}

export function ProfileClient({ expert, children }: ProfileClientProps) {
  const [selectedSession, setSelectedSession] = useState(expert.session_types?.[0]?.id ?? '');

  return (
    <>
      {/* Mobile sticky bottom CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white dark:bg-slate-950 border-t z-40 p-3 flex gap-2">
        <Link href={`/experts/request/${expert.slug}`} className="flex-1">
          <Button className="w-full" size="sm">
            Book Advisory Call
          </Button>
        </Link>
        <Link href={`/experts/request/${expert.slug}?type=info`} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            Request Info
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="pb-20 lg:pb-0">
        {children}
      </div>

      {/* Session selector state context for sidebar sync */}
      <div
        data-selected-session={selectedSession}
        style={{ display: 'none' }}
        suppressHydrationWarning
      />
    </>
  );
}
