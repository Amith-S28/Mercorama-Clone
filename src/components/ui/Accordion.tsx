'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({
  items,
  defaultOpenId,
  allowMultiple = false,
  className,
}: AccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    if (defaultOpenId) return new Set([defaultOpenId]);
    return new Set<string>();
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (!allowMultiple) next.clear();
      next.add(id);
      return next;
    });
  };

  return (
    <div
      className={cn(
        'ui-root flex flex-col gap-2',
        className
      )}
    >
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className="rounded-3xl border border-border-light overflow-hidden"
          >
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className={cn(
                'flex w-full items-center justify-between gap-3',
                'px-4 py-3 text-left bg-paper-white',
                'hover:bg-accent-muted/40 transition-colors'
              )}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-obsidian">
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className="font-mono text-xs uppercase tracking-widest text-obsidian/45">
                    {item.subtitle}
                  </span>
                ) : null}
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="shrink-0 text-obsidian/40"
              >
                <ChevronDown size={18} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border-light px-4 py-3 text-sm text-obsidian/75">
                    {item.content}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
