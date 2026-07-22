'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, LogOut, ChevronDown,
  Hash, ArrowRightLeft, Briefcase,
  Compass, Globe, Users, Search,
  Info, BookOpen, Mail,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getAuthUser, clearAuthUser, type AuthUser } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

type NavItem = { name: string; href: string; icon: LucideIcon };

const BOARD = process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com';

const PLATFORM_LOGGED_OUT: NavItem[] = [
  { name: 'HS Code Intelligence',   href: '/hscode',       icon: Hash },
  { name: 'Incoterms Navigator',    href: '/incoterms',    icon: ArrowRightLeft },
];

const PLATFORM_LOGGED_IN: NavItem[] = [
  { name: 'HS Code Intelligence',   href: `${BOARD}/dashboard?tool=hs-code-assistant`,      icon: Hash },
  { name: 'Incoterms Navigator',    href: `${BOARD}/dashboard?tool=incoterms-analyzer`,     icon: ArrowRightLeft },
];

const TRADE_LOGGED_OUT: NavItem[] = [
  { name: 'Export Compass',       href: '/export-compass', icon: Compass },
  { name: 'Trade Advantage', href: '/fta-diversify',  icon: Globe },
];

const TRADE_LOGGED_IN: NavItem[] = [
  { name: 'Export Compass',       href: `${BOARD}/dashboard?tool=export-compass`, icon: Compass },
  { name: 'Trade Advantage', href: `${BOARD}/dashboard?tool=fta-diversify`,  icon: Globe },
];

const EXPERTS_LINKS: NavItem[] = [
  { name: 'Why Experts?',  href: '/experts',                      icon: Users },
  { name: 'Find Experts',  href: '/experts/search',               icon: Search },
  { name: 'Collections',   href: '/experts/search?tab=collections', icon: BookOpen },
  { name: 'Apply as an Expert',  href: '/experts/apply',          icon: Users },
];

const ABOUT_LINKS: NavItem[] = [
  { name: 'About Us', href: '/about',   icon: Info },
  { name: 'Blog',     href: '/blog',    icon: BookOpen },
];

const PLATFORM_PUBLIC_HREFS = ['/hscode', '/incoterms'];
const TRADE_PUBLIC_HREFS    = ['/export-compass', '/fta-diversify'];
const EXPERTS_PUBLIC_HREFS  = ['/experts'];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Platform dropdown archived — pages kept for future reuse
  const [platformOpen, setPlatformOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [expertsOpen, setExpertsOpen] = useState(false);
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);
  const [mobileTradeOpen, setMobileTradeOpen] = useState(false);
  const [mobileExpertsOpen, setMobileExpertsOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const platformRef = useRef<HTMLDivElement>(null);
  const tradeRef    = useRef<HTMLDivElement>(null);
  const aboutRef    = useRef<HTMLDivElement>(null);
  const expertsRef  = useRef<HTMLDivElement>(null);
  const navRef      = useRef<HTMLElement>(null);

  const [onBoard, setOnBoard] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
    setOnBoard(window.location.hostname.startsWith('board.'));
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (platformRef.current && !platformRef.current.contains(target)) setPlatformOpen(false);
      if (tradeRef.current && !tradeRef.current.contains(target)) setTradeOpen(false);
      if (aboutRef.current && !aboutRef.current.contains(target)) setAboutOpen(false);
      if (expertsRef.current && !expertsRef.current.contains(target)) setExpertsOpen(false);
      if (navRef.current && !navRef.current.contains(target)) setMobileMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    clearAuthUser();
    setUser(null);
    router.push('/');
  };

  const PLATFORM = user ? PLATFORM_LOGGED_IN : PLATFORM_LOGGED_OUT;
  const TRADE    = user ? TRADE_LOGGED_IN    : TRADE_LOGGED_OUT;
  const isDealActive = pathname === '/deal' || pathname.includes('deal-wizard');
  const isPlatformActive =
    PLATFORM_PUBLIC_HREFS.some((h) => pathname.startsWith(h)) ||
    pathname === '/analyze/incoterm';
  const isTradeActive = TRADE_PUBLIC_HREFS.some((h) => pathname.startsWith(h));
  const isExpertsActive = EXPERTS_PUBLIC_HREFS.some((h) => pathname.startsWith(h));
  const isAboutActive = ABOUT_LINKS.some(
    (l) => pathname === l.href || pathname.startsWith(l.href + '/'),
  );

  return (
    <nav
      ref={navRef}
      className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo — clicking is the home link */}
          <div className="flex items-center">
            <a href="https://mercorama.com" className="flex items-center gap-1" aria-label="Mercorama Beta">
              <Image
                src="/mercorama_logo_2026.png"
                alt="Mercorama"
                width={143}
                height={36}
                className="h-9 sm:h-11 w-auto"
                priority
              />
              <span className="inline-flex items-center rounded-full bg-[#01696f]/10 dark:bg-[#4f98a3]/15 text-[#01696f] dark:text-[#4f98a3] px-2 py-0.5 text-xs font-semibold tracking-wide select-none">
                beta
              </span>
            </a>
          </div>

          {/* Desktop centre nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Deal Builder — standalone */}
            <Link
              href={user ? `${BOARD}/dashboard?tool=deal-wizard` : '/deal'}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isDealActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Briefcase className="h-3.5 w-3.5 text-[#FF6100]" />
              Deal Builder
            </Link>

            {/* Trade Intelligence ▾ */}
            <div className="relative" ref={tradeRef}>
              <button
                onClick={() => {
                  setTradeOpen((v) => !v);
                  setPlatformOpen(false);
                  setAboutOpen(false);
                }}
                className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isTradeActive || tradeOpen
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                Trade Intelligence
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    tradeOpen && 'rotate-180',
                  )}
                />
              </button>

              {tradeOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 rounded-md border bg-background shadow-lg py-1 z-50">
                  {TRADE.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setTradeOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                        pathname === item.href
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-[#FF6100]" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Experts ▾ */}
            <div className="relative" ref={expertsRef}>
              <button
                onClick={() => {
                  setExpertsOpen((v) => !v);
                  setPlatformOpen(false);
                  setTradeOpen(false);
                  setAboutOpen(false);
                }}
                className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isExpertsActive || expertsOpen
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                Experts
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    expertsOpen && 'rotate-180',
                  )}
                />
              </button>

              {expertsOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 rounded-md border bg-background shadow-lg py-1 z-50">
                  {EXPERTS_LINKS.map((item, idx) => (
                    <div key={item.name}>
                      {idx === EXPERTS_LINKS.length - 1 && <div className="my-1 border-t border-border" />}
                      <Link
                        href={item.href}
                        onClick={() => setExpertsOpen(false)}
                        className={cn(
                          'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0 text-[#FF6100]" />
                        {item.name}
                        {item.name === 'Apply as an Expert' && (
                          <span className="ml-auto rounded-full bg-[#01696f]/15 text-[#01696f] dark:text-[#4f98a3] px-1.5 py-0.5 text-[9px] font-bold">New</span>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* About ▾ */}
            <div className="relative" ref={aboutRef}>
              <button
                onClick={() => {
                  setAboutOpen((v) => !v);
                  setPlatformOpen(false);
                  setTradeOpen(false);
                }}
                className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isAboutActive || aboutOpen
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                About
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    aboutOpen && 'rotate-180',
                  )}
                />
              </button>

              {aboutOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 rounded-md border bg-background shadow-lg py-1 z-50">
                  {ABOUT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAboutOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                        pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-[#FF6100]" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Contact — standalone */}
            <Link
              href="/contact"
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === '/contact'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              Contact
            </Link>
          </div>

          {/* Desktop right — auth actions */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <a href={`${BOARD}/dashboard`}>
                  <Button size="sm" variant="outline">
                    Dashboard
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <a
                  href={`${BOARD}/auth/signin`}
                  onClick={() =>
                    trackEvent('cta_click', { label: 'navbar_sign_in', location: 'navbar' })
                  }
                >
                  <Button size="sm" variant="ghost">
                    Sign In
                  </Button>
                </a>
                <Link
                  href="/beta"
                  onClick={() =>
                    trackEvent('cta_click', { label: 'navbar_apply_beta', location: 'navbar' })
                  }
                >
                  <Button size="sm">Apply for Beta →</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted cursor-pointer touch-manipulation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background z-50 relative flex flex-col">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Deal Builder — standalone */}
            <Link
              href={user ? `${BOARD}/dashboard?tool=deal-wizard` : '/deal'}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-base font-medium',
                isDealActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Briefcase className="h-4 w-4 shrink-0 text-[#FF6100]" />
              Deal Builder
            </Link>

            {/* Trade Intelligence accordion */}
            <button
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileTradeOpen((v) => !v)}
            >
              Trade Intelligence
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  mobileTradeOpen && 'rotate-180',
                )}
              />
            </button>
            {mobileTradeOpen &&
              TRADE.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-base font-medium pl-6',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#FF6100]" />
                  {item.name}
                </Link>
              ))}

            {/* Experts accordion */}
            <button
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileExpertsOpen((v) => !v)}
            >
              Experts
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  mobileExpertsOpen && 'rotate-180',
                )}
              />
            </button>
            {mobileExpertsOpen &&
              EXPERTS_LINKS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-base font-medium pl-6',
                    pathname.startsWith(item.href.split('?')[0])
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#FF6100]" />
                  {item.name}
                </Link>
              ))}

            {/* About accordion */}
            <button
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileAboutOpen((v) => !v)}
            >
              About
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  mobileAboutOpen && 'rotate-180',
                )}
              />
            </button>
            {mobileAboutOpen &&
              ABOUT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-base font-medium pl-6',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#FF6100]" />
                  {item.name}
                </Link>
              ))}

            {/* Contact — standalone */}
            <Link
              href="/contact"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-base font-medium',
                pathname === '/contact'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Mail className="h-4 w-4 shrink-0 text-[#FF6100]" />
              Contact
            </Link>

            {/* Auth links */}
            <div className="pt-2 border-t border-border mt-2">
              {user ? (
                <>
                  <a
                    href={`${BOARD}/dashboard`}
                    className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <button
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <a
                  href={`${BOARD}/auth/signin`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </a>
              )}
            </div>
          </div>

          {/* Apply for Beta — pinned at drawer bottom */}
          {!user && (
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <Link
                href="/beta"
                className="block w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  trackEvent('cta_click', {
                    label: 'navbar_apply_beta_mobile',
                    location: 'navbar_mobile',
                  });
                }}
              >
                <Button size="default" className="w-full">
                  Apply for Beta →
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
