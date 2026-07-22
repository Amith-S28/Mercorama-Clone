'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Pencil, LayoutTemplate, ExternalLink } from 'lucide-react';
import { useAllMarketingPages, DEFAULT_PAGES } from '@/hooks/useMarketingPages';
import { checkIsAdmin } from '@/lib/admin';
import { cn } from '@/lib/utils';

const PAGE_LABELS: Record<string, string> = {
  home:      'Home Page',
  pricing:   'Pricing Page',
  deal:      'Deal Builder',
  incoterms: 'Incoterms Analyzer',
  hscode:    'HS Code Assistant',
  contract:  'Deal Summary Generator',
  blog:      'Blog',
  contact:   'Contact',
};

const PAGE_HREFS: Record<string, string> = {
  home:      '/',
  pricing:   '/beta',
  deal:      '/deal',
  incoterms: '/incoterms',
  hscode:    '/hscode',
  contract:  '/deal-summary',
  blog:      '/blog',
  contact:   '/contact',
};

export default function AdminPagesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: pages, isLoading } = useAllMarketingPages();

  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setIsAdminUser(true);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || !isAdminUser) return null;

  // Merge fetched pages with default list so all pages always appear
  const slugsInDb = new Set((pages ?? []).map((p) => p.slug));
  const missingPages = DEFAULT_PAGES.filter((p) => !slugsInDb.has(p.slug));
  const allPages = [
    ...(pages ?? []),
    ...missingPages.map((p) => ({ id: '', slug: p.slug, title: p.title, updated_at: '' })),
  ].sort((a, b) => {
    const order = DEFAULT_PAGES.map((p) => p.slug);
    return order.indexOf(a.slug) - order.indexOf(b.slug);
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketing Pages</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Edit content and design blocks for key pages on the site.
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden bg-background">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading pages…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Page</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">URL</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Last Updated</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allPages.map((page) => (
                <tr key={page.slug} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{PAGE_LABELS[page.slug] ?? page.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <a
                      href={PAGE_HREFS[page.slug] ?? `/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs"
                    >
                      {PAGE_HREFS[page.slug] ?? `/${page.slug}`}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                    {page.updated_at
                      ? format(new Date(page.updated_at), 'MMM d, yyyy')
                      : <span className="text-muted-foreground/50">Not yet saved</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/admin/pages/${page.slug}`}>
                      <button
                        type="button"
                        className={cn(
                          'flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                          'hover:bg-muted'
                        )}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Content saved here is stored in Supabase and rendered on the live site.
      </p>
    </div>
  );
}
