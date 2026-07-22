'use client';

import { cn } from '@/lib/utils';

interface FilterDef {
  key: string;
  label: string;
  type: 'all' | 'region' | 'expertType';
}

const FILTERS: FilterDef[] = [
  { key: 'all',                label: 'All',              type: 'all' },
  { key: 'north-america',     label: 'North America',    type: 'region' },
  { key: 'europe',            label: 'Europe',           type: 'region' },
  { key: 'asia-pacific',      label: 'Asia-Pacific',     type: 'region' },
  { key: 'latin-america',     label: 'Latin America',    type: 'region' },
  { key: 'mena',              label: 'MENA',             type: 'region' },
  { key: 'customs-broker',    label: 'Customs Brokers',  type: 'expertType' },
  { key: 'freight-forwarder', label: 'Freight Forwarders', type: 'expertType' },
  { key: 'citp-fibp',         label: 'CITP/FIBP',        type: 'expertType' },
  { key: 'trade-finance',     label: 'Trade Finance',    type: 'expertType' },
];

export interface CollectionFilters {
  region?: string;
  expertType?: string;
}

interface ExpertCollectionsBarProps {
  active: CollectionFilters;
  counts?: Record<string, number>;
  onFilter: (filters: CollectionFilters) => void;
}

export function ExpertCollectionsBar({ active, counts = {}, onFilter }: ExpertCollectionsBarProps) {
  const activeKey = active.region ?? active.expertType ?? 'all';

  function handleClick(f: FilterDef) {
    if (f.type === 'all') {
      onFilter({});
    } else if (f.type === 'region') {
      onFilter({ region: f.key });
    } else {
      onFilter({ expertType: f.key });
    }
  }

  return (
    <div className="relative mb-4">
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {FILTERS.map((f) => {
          const isActive = activeKey === f.key;
          const count = f.key === 'all' ? undefined : counts[f.key];
          return (
            <button
              key={f.key}
              onClick={() => handleClick(f)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-200',
                isActive
                  ? 'bg-[#01696f] text-white border-[#01696f] shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-[#01696f]/40 hover:text-foreground',
              )}
            >
              {f.label}
              {count !== undefined && count > 0 && (
                <span className={cn('ml-1', isActive ? 'text-white/70' : 'text-muted-foreground/60')}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Right fade hint on mobile */}
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />

      {/* Hide scrollbar */}
      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
