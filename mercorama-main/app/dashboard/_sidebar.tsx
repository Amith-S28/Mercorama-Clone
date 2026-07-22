// app/dashboard/_sidebar.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Lock, LogOut, Menu, X,
  LayoutDashboard,
  Ship, PackageSearch, Briefcase,
  BookOpen, LayoutTemplate, Globe, Compass, DollarSign, Truck,
  Search, ChevronsLeft, ChevronsRight, Plus, Map,
  ChevronRight, Settings, Users, CalendarDays, MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/admin';
import { type AuthUser, setAuthUser } from '@/lib/auth-store';
import { getProfile } from '@/lib/profile-store';
import { planFeatures, type FeatureKey } from '@/app/auth/plan-config';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItemDef = {
  label: string;
  href: string;
  icon: LucideIcon;
  featureKey?: FeatureKey;
  badge?: string;
  badgeColor?: string;
  badgeStarterOnly?: boolean;  // show badge only when plan is starter/free
  tool?: string;               // for /dashboard?tool=xxx active detection
  exactPath?: string;          // for pathname-based active detection
};

// ─── Nav structure ────────────────────────────────────────────────────────────

const HOME_ITEM: NavItemDef = {
  label: 'Home',
  href: '/dashboard',
  icon: LayoutDashboard,
};

// Incoterms Analyzer archived — now part of Incoterm Intelligence layer.
// Route /dashboard?tool=incoterms-analyzer still works if accessed directly.

// HS Code Assistant archived — now part of HS Code Intelligence layer.
// Route /dashboard?tool=hs-code-assistant still works if accessed directly.

// Deal Summary Generator archived — now the final output of Deal Wizard.
// Route /dashboard?tool=deal-summary-generator still works if accessed directly.

const TOOLS_ITEMS: NavItemDef[] = [];

const WORKFLOW_ITEMS: NavItemDef[] = [
  {
    label: 'Export Plan',
    href: '/dashboard?view=export-plan',
    icon: Briefcase,
    featureKey: 'deal-wizard',
    tool: 'export-plan',
  },
  {
    label: 'Trade Advantage',
    href: '/dashboard?view=trade-advantage',
    icon: Globe,
    featureKey: 'fta-diversify',
    tool: 'trade-advantage',
  },
  {
    label: 'Global Markets',
    href: '/dashboard?view=global-markets',
    icon: Compass,
    featureKey: 'export-compass',
    tool: 'global-markets',
  },
  {
    label: 'Freight Connect',
    href: '/dashboard?view=freight-connect',
    icon: Truck,
    featureKey: 'freight-connect',
    tool: 'freight-connect',
  },
  {
    label: 'Fund My Export',
    href: '/dashboard?view=fund-my-export',
    icon: DollarSign,
    tool: 'fund-my-export',
  },
];

const EXPERTS_ITEMS: NavItemDef[] = [
  {
    label: 'Find Experts',
    href: '/dashboard?view=find-experts',
    icon: Search,
    tool: 'find-experts',
  },
  {
    label: 'My Requests',
    href: '/dashboard/requests',
    icon: MessageSquare,
    exactPath: '/dashboard/requests',
  },
  {
    label: 'My Bookings',
    href: '/dashboard/bookings',
    icon: CalendarDays,
    exactPath: '/dashboard/bookings',
  },
];

const EXPERTS_ADMIN_ITEMS: NavItemDef[] = [
  {
    label: 'Expert Profiles',
    href: '/dashboard/experts/manage',
    icon: Users,
    exactPath: '/dashboard/experts/manage',
  },
  {
    label: 'Expert Bookings',
    href: '/dashboard/experts/bookings',
    icon: CalendarDays,
    exactPath: '/dashboard/experts/bookings',
  },
];

const ADMIN_ITEMS: NavItemDef[] = [
  {
    label: 'Cohort Admin',
    href: '/admin/cohorts',
    icon: Users,
    exactPath: '/admin/cohorts',
  },
  {
    label: 'Blog Posts',
    href: '/dashboard/admin/blog',
    icon: BookOpen,
    exactPath: '/dashboard/admin/blog',
  },
  {
    label: 'Marketing Pages',
    href: '/dashboard/admin/pages',
    icon: LayoutTemplate,
    exactPath: '/dashboard/admin/pages',
  },
  {
    label: 'Canada Intel',
    href: '/dashboard/admin/canada-intel',
    icon: Map,
    exactPath: '/dashboard/admin/canada-intel',
  },
  {
    label: 'Data Sources',
    href: '/dashboard/admin/data-sources',
    icon: LayoutDashboard,
    exactPath: '/dashboard/admin/data-sources',
  },
];

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  pro:        'Starter',
  team:       'Growth',
  enterprise: 'Advisory',
};

const PLAN_BADGE: Record<string, string> = {
  pro:        'bg-primary/10 text-primary',
  team:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  enterprise: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

function getFeatures(plan: string): FeatureKey[] {
  if (plan in planFeatures) return planFeatures[plan as keyof typeof planFeatures];
  return planFeatures.pro;
}

// ─── Tooltip wrapper (collapsed mode) ─────────────────────────────────────────

function Tooltip({ label, children, collapsed }: { label: string; children: React.ReactNode; collapsed: boolean }) {
  if (!collapsed) return <>{children}</>;
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
                      hidden group-hover/tip:flex items-center
                      rounded-md border bg-popover px-2.5 py-1.5 shadow-md">
        <span className="whitespace-nowrap text-xs font-medium text-popover-foreground">{label}</span>
      </div>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({
  item,
  active,
  locked,
  collapsed,
  isStarterOrFree,
}: {
  item: NavItemDef;
  active: boolean;
  locked: boolean;
  collapsed: boolean;
  isStarterOrFree: boolean;
}) {
  const Icon = item.icon;

  const baseClass = cn(
    'flex items-center rounded-lg transition-colors relative',
    collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-3 py-2 w-full',
  );

  const stateClass = locked
    ? 'text-muted-foreground/50 hover:bg-muted/60 cursor-pointer'
    : active
    ? 'bg-accent text-accent-foreground font-medium'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground';

  const showBadge = !locked && item.badge && (!item.badgeStarterOnly || isStarterOrFree);

  const content = (
    <>
      <Icon className={cn('shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-[17px] w-[17px]')} />
      {!collapsed && (
        <>
          <span className="flex-1 text-sm truncate">{item.label}</span>
          {locked && (
            <Lock className="h-3 w-3 shrink-0 opacity-60" />
          )}
          {showBadge && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none', item.badgeColor)}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </>
  );

  return (
    <Tooltip label={item.label} collapsed={collapsed}>
      {locked ? (
        <Link href="/beta" className={cn(baseClass, stateClass)} title={collapsed ? item.label : undefined}>
          {content}
        </Link>
      ) : (
        <Link href={item.href} className={cn(baseClass, stateClass)} title={collapsed ? item.label : undefined}>
          {content}
        </Link>
      )}
    </Tooltip>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-1 border-t border-border/50" />;
  return (
    <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
      {label}
    </p>
  );
}

// ─── Main sidebar component ───────────────────────────────────────────────────

export function DashboardSidebar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTool = searchParams.get('view') ?? searchParams.get('tool') ?? '';

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser()
      .then(async ({ data: { user: sbUser } }) => {
        if (!sbUser) {
          router.replace('/auth/signin?callbackUrl=/dashboard');
          return;
        }
        const email = sbUser.email ?? '';

        // Fetch plan from users table (user_metadata is never set by the webhook)
        let plan: AuthUser['plan'] = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'enterprise' : 'pro';
        if (plan !== 'enterprise') {
          try {
            const res = await fetch('/api/me');
            if (res.ok) {
              const me = await res.json();
              plan = me.plan ?? plan;
            }
          } catch { /* keep default */ }
        }

        const authUser: AuthUser = {
          id: sbUser.id,
          email,
          name: sbUser.user_metadata?.full_name ?? sbUser.user_metadata?.name ?? getProfile().name ?? email,
          plan,
          isVerified: true,
        };
        setUser(authUser);
        setAuthUser(authUser);
        setAvatarUrl(getProfile().avatarUrl);
      })
      .catch(() => { /* silent — user stays null, page still renders */ })
      .finally(() => {
        setUserLoading(false);
      });
  }, [router]);

  // ── Collapsed state (localStorage) ───────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mercorama_sidebar_collapsed');
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('mercorama_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  }, []);

  // ── Close mobile drawer on route change ───────────────────────────────────
  useEffect(() => { setMobileOpen(false); }, [pathname, currentTool]);

  // ── ESC clears search ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearch('');
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const features = user ? getFeatures(user.plan) : [];
  const planKey = user?.plan ?? 'free';
  // Don't show locked state while user is still being fetched
  const isAdmin = user && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const isStarterOrFree = planKey === 'free' || planKey === 'pro';

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  function isItemActive(item: NavItemDef): boolean {
    if (item.exactPath) return pathname === item.exactPath;
    if (item.tool) return pathname === '/dashboard' && currentTool === item.tool;
    // Home (no tool)
    return pathname === '/dashboard' && !currentTool;
  }

  // ── Search filter ─────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();

  function filterItems(items: NavItemDef[]): NavItemDef[] {
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }

  const filteredTools     = filterItems(TOOLS_ITEMS);
  const filteredWorkflows = filterItems(WORKFLOW_ITEMS);
  const filteredAdmin     = filterItems(ADMIN_ITEMS);

  const hasAnyResult = filteredTools.length > 0 || filteredWorkflows.length > 0 || (isAdmin && filteredAdmin.length > 0);

  // ── Nav content (shared desktop + mobile) ─────────────────────────────────
  const navContent = (
    <div className="flex h-full flex-col">

      {/* ── Logo + collapse toggle ── */}
      <div className={cn(
        'flex items-center border-b py-3',
        collapsed ? 'flex-col gap-2 px-2' : 'justify-between px-4',
      )}>
        {collapsed ? (
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm select-none">
              M
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              <Image
                src="/mercorama_logo_2026.png"
                alt="Mercorama"
                width={143}
                height={36}
                className="h-9 w-auto"
                priority
              />
            </Link>
            <span className="inline-flex items-center rounded-full bg-[#01696f]/10 dark:bg-[#4f98a3]/15 text-[#01696f] dark:text-[#4f98a3] px-2 py-0.5 text-xs font-semibold tracking-wide select-none">
              beta
            </span>
          </div>
        )}
        {/* Mobile close / Desktop collapse toggle */}
        <button
          className={cn(
            'rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors',
            collapsed && 'mt-1',
          )}
          onClick={collapsed ? toggleCollapsed : undefined}
          aria-label={collapsed ? 'Expand sidebar' : undefined}
        >
          {/* Mobile-only close */}
          <X className="h-5 w-5 md:hidden" onClick={() => setMobileOpen(false)} />
          {/* Desktop collapse (shown via media class on parent) */}
          {collapsed
            ? <ChevronsRight className="hidden h-4 w-4 md:block" />
            : <ChevronsLeft className="hidden h-4 w-4 md:block" onClick={toggleCollapsed} />
          }
        </button>
      </div>

      {/* ── Search ── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search tools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border bg-muted/40 pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Primary CTA ── */}
      <div className={cn('px-3 pt-2 pb-1', collapsed && 'flex justify-center')}>
        <Tooltip label="Build Export Plan" collapsed={collapsed}>
          <Link href="/dashboard?view=export-plan">
            {collapsed ? (
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                <Plus className="h-4 w-4" />
              </button>
            ) : (
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                <Plus className="h-4 w-4 shrink-0" />
                Build Export Plan
              </button>
            )}
          </Link>
        </Tooltip>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {/* No results */}
        {q && !hasAnyResult && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No tools match "{search}"
          </p>
        )}

        {/* Admin section (Home at top) */}
        {isAdmin && filteredAdmin.length > 0 && (
          <>
            <SectionLabel label="Admin" collapsed={collapsed} />
            <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
              <NavItem
                item={HOME_ITEM}
                active={isItemActive(HOME_ITEM)}
                locked={false}
                collapsed={collapsed}
                isStarterOrFree={isStarterOrFree}
              />
              {filteredAdmin.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={isItemActive(item)}
                  locked={false}
                  collapsed={collapsed}
                  isStarterOrFree={isStarterOrFree}
                />
              ))}
            </div>
          </>
        )}

        {/* Home for non-admin users */}
        {!isAdmin && (
          <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
            <NavItem
              item={HOME_ITEM}
              active={isItemActive(HOME_ITEM)}
              locked={false}
              collapsed={collapsed}
              isStarterOrFree={isStarterOrFree}
            />
          </div>
        )}

        {/* Experts section */}
        <SectionLabel label="Experts" collapsed={collapsed} />
        <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
          {EXPERTS_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isItemActive(item)}
              locked={false}
              collapsed={collapsed}
              isStarterOrFree={isStarterOrFree}
            />
          ))}
          {isAdmin && EXPERTS_ADMIN_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isItemActive(item)}
              locked={false}
              collapsed={collapsed}
              isStarterOrFree={isStarterOrFree}
            />
          ))}
        </div>

        {/* Workflows section */}
        {filteredWorkflows.length > 0 && (
          <>
            <SectionLabel label="Growth" collapsed={collapsed} />
            <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
              {filteredWorkflows.map((item) => {
                const locked = !userLoading && !!(item.featureKey && !features.includes(item.featureKey));
                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={isItemActive(item)}
                    locked={locked}
                    collapsed={collapsed}
                    isStarterOrFree={isStarterOrFree}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Tools section */}
        {filteredTools.length > 0 && (
          <>
            <SectionLabel label="Tools" collapsed={collapsed} />
            <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
              {filteredTools.map((item) => {
                const locked = !userLoading && !!(item.featureKey && !features.includes(item.featureKey));
                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={isItemActive(item)}
                    locked={locked}
                    collapsed={collapsed}
                    isStarterOrFree={isStarterOrFree}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Upgrade nudge (non-collapsed, Starter/Free) */}
        {!collapsed && !q && isStarterOrFree && (
          <div className="mt-4 mx-1 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-3">
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
              Unlock FTA &amp; Export Compass
            </p>
            <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
              Growth plan — 30 FTA analyses + 20 Export Compass runs/month.
            </p>
            <Link
              href="/beta"
              className="block text-center rounded-md bg-teal-700 dark:bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:hover:bg-teal-700 transition-colors"
            >
              Upgrade to Growth →
            </Link>
          </div>
        )}
      </nav>

      {/* ── Collapse toggle (desktop, bottom of nav) ── */}
      <div className="hidden md:flex border-t px-3 py-2 justify-end">
        <button
          onClick={toggleCollapsed}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronsRight className="h-4 w-4" />
            : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )
          }
        </button>
      </div>

      {/* ── User footer ── */}
      <div className={cn('border-t', collapsed ? 'px-2 py-3' : 'px-3 py-3')}>
        {user ? (
          collapsed ? (
            // Collapsed: just avatar
            <Tooltip label={`${user.name} · ${PLAN_LABEL[planKey] ?? planKey}`} collapsed={collapsed}>
              <Link href="/dashboard/profile">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent hover:ring-primary/40 transition-all mx-auto block" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold mx-auto select-none ring-2 ring-transparent hover:ring-primary/40 transition-all">
                    {initials}
                  </div>
                )}
              </Link>
            </Tooltip>
          ) : (
            // Expanded: full footer
            <div className="space-y-2">
              {/* Avatar + name + email row */}
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 group rounded-lg px-1 py-1 hover:bg-muted transition-colors">
                <div className="shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/40 transition-all" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold select-none ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold leading-tight group-hover:text-primary transition-colors">{user.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground leading-tight">{user.email}</p>
                </div>
                <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </Link>

              {/* Plan badge + sign out row */}
              <div className="flex items-center justify-between px-1">
                <Link
                  href="/beta"
                  title="View or upgrade your plan"
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80',
                    PLAN_BADGE[planKey] ?? PLAN_BADGE.free
                  )}
                >
                  {PLAN_LABEL[planKey] ?? planKey}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>

              {/* Starter upgrade nudge */}
              {planKey === 'pro' && (
                <Link href="/beta" className="block px-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                  Upgrade to Growth for more analyses →
                </Link>
              )}

              {/* Footer links */}
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 px-1 pt-1 border-t border-border/60">
                {[
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Privacy', href: '/privacy' },
                  { label: 'Terms', href: '/terms' },
                  { label: 'Contact', href: '/contact' },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="px-1 text-[10px] text-muted-foreground/50 leading-snug">
                © 2026 MERCORAMA ·{' '}
                <a href="https://mightyiq.ca" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground transition-colors">
                  MightyIQ Inc.
                </a>
              </p>
            </div>
          )
        ) : (
          <div className="h-12 animate-pulse rounded-md bg-muted" />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Image
              src="/mercorama_logo_2026.png"
              alt="Mercorama"
              width={143}
              height={36}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground tracking-wide select-none">
            Beta
          </span>
        </div>
        <button
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Desktop sidebar ── */}
      <aside className={cn(
        'hidden md:flex h-screen flex-col border-r bg-background sticky top-0 transition-all duration-200 overflow-hidden',
        collapsed ? 'w-[60px]' : 'w-64',
      )}>
        {navContent}
      </aside>

      {/* ── Mobile drawer ── */}
      <aside className={cn(
        'md:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {navContent}
      </aside>
    </>
  );
}
