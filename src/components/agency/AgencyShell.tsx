'use client';

import { useState, type ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { AgencySidebar } from '@/components/shared/AgencySidebar';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export interface AgencyShellProps {
  children: ReactNode;
}

export function AgencyShell({ children }: AgencyShellProps) {
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const onboardingTrigger = (
    <button
      type="button"
      className="sidebar__link"
      onClick={() => setOnboardingOpen(true)}
      style={{
        width: '100%',
        border: '1px solid var(--border)',
        cursor: 'pointer',
      }}
      aria-label="Start onboarding"
    >
      <span className="sidebar__link-icon">
        <Sparkles size={18} />
      </span>
      <span>Onboarding</span>
    </button>
  );

  return (
    <>
      <div className="app-shell">
        <AgencySidebar onboardingTrigger={onboardingTrigger} />
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
