'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Platform', href: '/hscode' },
  { label: 'Solutions', href: '/export-compass' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  {
    label: 'Resources',
    children: [
      { label: 'Blog', href: '/blog' },
      { label: 'Data Sources', href: '/data-sources' },
    ],
  },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80" style={{ minHeight: '6.5rem' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3" style={{ minHeight: '6.5rem' }}>
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mercorama-logo-hz.png"
            alt="Mercorama — Intelligent Trade. Endless Opportunities."
            style={{ height: 'clamp(64px, 9vw, 100px)', width: 'auto', display: 'block' }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) =>
            item.children ? (
              <div key={item.label} className="relative">
                <button
                  onClick={() => setResourcesOpen(v => !v)}
                  className="flex items-center gap-1 text-base font-medium text-gray-700 hover:text-gray-900"
                >
                  {item.label}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', resourcesOpen && 'rotate-180')} />
                </button>
                {resourcesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-44 rounded-lg border bg-white shadow-lg py-1">
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setResourcesOpen(false)}
                        className="block px-4 py-2.5 text-base text-gray-700 hover:bg-gray-50"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className="text-base font-medium text-gray-700 hover:text-gray-900"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/contact">
            <Button variant="outline" className="rounded-full px-6 py-2.5 text-base font-semibold border-[#0b1f3a] text-[#0b1f3a] hover:bg-[#0b1f3a] hover:text-white">
              Book a Demo
            </Button>
          </Link>
          <Link href="/beta">
            <Button className="rounded-full px-6 py-2.5 text-base font-semibold bg-[#0b1f3a] hover:bg-[#152d52] text-white">
              Join Early Access
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(v => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {NAV_LINKS.map(item =>
            item.children ? (
              <div key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                {item.children.map(child => (
                  <Link key={child.href} href={child.href} onClick={() => setOpen(false)} className="block py-1.5 text-sm text-gray-700">
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link key={item.label} href={item.href!} onClick={() => setOpen(false)} className="block py-1.5 text-sm font-medium text-gray-700">
                {item.label}
              </Link>
            )
          )}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Link href="/contact"><Button variant="outline" className="w-full rounded-full">Book a Demo</Button></Link>
            <Link href="/beta"><Button className="w-full rounded-full bg-[#0d6e74] hover:bg-[#0a5a5f] text-white">Join Early Access</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
}
