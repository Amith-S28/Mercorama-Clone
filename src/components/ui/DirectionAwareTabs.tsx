'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export type TabItem = {
  id: string;
  label: string;
};

export interface DirectionAwareTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * A tab navigation component featuring a shared-layout slider bubble animation.
 * Follows the motion design patterns of Cult UI.
 */
export function DirectionAwareTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: DirectionAwareTabsProps) {
  return (
    <div 
      className={cn(
        'flex space-x-1 p-1 rounded-full bg-surface-muted border border-border w-fit shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]', 
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              isActive
                ? 'text-paper-white'
                : 'text-text-secondary hover:text-text-primary'
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isActive && (
              <motion.span
                layoutId="direction-aware-tabs-bubble"
                className="absolute inset-0 z-0 bg-accent rounded-full border border-accent-hover shadow-[0_2px_8px_rgba(255,154,0,0.3)]"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.38 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
