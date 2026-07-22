'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { getUserWithPlan, getMonthlyUsage, getResetDate, type Plan } from '@/lib/gate';
import { UpgradeModal } from './upgrade-modal';

// Matches gate.ts: total standalone tool runs per plan
const PLAN_LIMITS = {
  free:       10,
  pro:        30,
  team:       150,
  enterprise: Infinity,
};

export function UsageMeter() {
  const [user, setUser] = useState<{ plan: Plan } | null>(null);
  const [usage, setUsage] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const userData = getUserWithPlan('default');
    const usageData = getMonthlyUsage('default');
    setUser(userData);
    setUsage(usageData.total);
  }, []);

  if (!user) return null;

  const limit = PLAN_LIMITS[user.plan];
  const resetDate = getResetDate();
  const percentage = limit === Infinity ? 0 : (usage / limit) * 100;

  const getProgressColor = () => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 85) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handleClick = () => {
    if (user.plan === 'free') {
      setShowUpgrade(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex flex-col gap-1 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex items-baseline gap-2 text-sm font-medium">
          <span className="text-foreground">{usage}</span>
          <span className="text-muted-foreground">/ {limit === Infinity ? '∞' : limit}</span>
          <span className="text-xs text-muted-foreground">analyses</span>
        </div>
        
        {limit !== Infinity && (
          <Progress 
            value={percentage} 
            className="h-1.5"
          />
        )}
        
        <p className="text-xs text-muted-foreground">
          Resets {resetDate}
        </p>
      </button>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
      />
    </>
  );
}
