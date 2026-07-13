'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ApiHealthDashboard } from '@/components/health/ApiHealthDashboard';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof FolderOpen;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/sandbox/agency', label: 'Portfolio', icon: FolderOpen },
  { href: '/sandbox/agency/report', label: 'Report', icon: ClipboardList },
];

export interface AgencySidebarProps {
  onboardingTrigger?: ReactNode;
}

export function AgencySidebar({ onboardingTrigger }: AgencySidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('agency-sidebar-collapsed');
    if (stored === 'true') {
      setCollapsed(true);
    }
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('agency-sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <motion.aside
      className={cn('sidebar', collapsed ? 'sidebar--collapsed' : 'sidebar--expanded')}
      animate={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
    >
      <div className="sidebar__header">
        {!collapsed ? (
          <motion.div
            className="sidebar__brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="sidebar__brand-title">Trade Agency</span>
            <span className="sidebar__brand-subtitle">Sandbox Portal</span>
          </motion.div>
        ) : null}
        <button
          type="button"
          className="sidebar__toggle"
          onClick={handleToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Agency navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/sandbox/agency' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar__link',
                isActive && 'sidebar__link--active'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar__link-icon">
                <Icon size={18} />
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__slot">
        {onboardingTrigger ?? (
          <button
            type="button"
            className="sidebar__link"
            style={{
              width: '100%',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : undefined,
            }}
            aria-label="Start onboarding"
          >
            <span className="sidebar__link-icon">
              <Sparkles size={18} />
            </span>
            {!collapsed ? <span>Onboarding</span> : null}
          </button>
        )}
      </div>

      <div className="sidebar__footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', width: '100%', padding: '0 0.5rem' }}>
          {!collapsed && <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Theme</span>}
          <ThemeToggle />
        </div>
        <ApiHealthDashboard collapsed={collapsed} />
      </div>
    </motion.aside>
  );
}
