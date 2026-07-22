'use client';

import { useEffect, useState } from 'react';
import { getUserWithPlan, type Plan } from '@/lib/gate';
import { Badge } from '@/components/ui/badge';

const planStyles: Record<Plan, { bg: string; text: string; label: string }> = {
  free:       { bg: 'bg-gray-100 text-gray-700 border-gray-300', text: '', label: 'FREE' },
  pro:        { bg: 'bg-[hsl(var(--accent))] text-white', text: '', label: 'STARTER' },
  team:       { bg: 'bg-primary text-white', text: '', label: 'GROWTH' },
  enterprise: { bg: 'bg-amber-500 text-white', text: '', label: 'ADVISORY' },
};

export function PlanBadge() {
  const [plan, setPlan] = useState<Plan>('free');

  useEffect(() => {
    const user = getUserWithPlan('default');
    setPlan(user.plan);
  }, []);

  const style = planStyles[plan];

  return (
    <Badge 
      variant={plan === 'free' ? 'outline' : 'default'}
      className={`${style.bg} border font-semibold`}
    >
      {style.label}
    </Badge>
  );
}
