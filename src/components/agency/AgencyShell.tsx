'use client';

import { useState, type ReactNode } from 'react';
import { AgencySidebar } from '@/components/shared/AgencySidebar';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export interface AgencyShellProps {
  children: ReactNode;
}

export function AgencyShell({ children }: AgencyShellProps) {
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  return (
    <>
      <div className="app-shell">
        <AgencySidebar onOnboardingClick={() => setOnboardingOpen(true)} />
        <main className="main-content">{children}</main>
      </div>

      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => {
          setOnboardingOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}
