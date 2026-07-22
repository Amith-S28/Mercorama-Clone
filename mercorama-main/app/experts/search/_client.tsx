'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ChevronDown, BookOpen, Lock, X as XIcon, MapPin, Globe, Clock, Shield, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ExpertGateModal } from '@/components/experts/ExpertGateModal';
import { ExpertCard as NewExpertCard, type ExpertCardData } from '@/components/experts/ExpertCard';
import { ExpertCollectionsBar, type CollectionFilters } from '@/components/experts/ExpertCollectionsBar';
import type { ExpertProfile, ExpertType, ExpertVertical, ExpertLanguage, ExpertSearchResult } from '@/lib/experts';

// Map ExpertProfile (Supabase) → ExpertCardData (component)
function toCardData(p: ExpertProfile): ExpertCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.headline.split('—')[0].trim() || p.headline,
    credentials: (p.types ?? []).map((t) => t.name),
    title: p.headline,
    specializations: (p.tags ?? []).map((t) => t.name),
    country: 'Canada',
    city: p.location?.split(',')[0]?.trim() ?? '',
    bio: p.bio,
    languages: (p.languages ?? []).map((l) => l.name),
    rating: 4.9,
    reviewCount: 0,
    verified: p.verification_tier === 1,
    avatar_url: p.avatar_url,
  };
}

interface Collection {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_image: string | null;
  expert_profiles: { headline: string; slug: string; avatar_url: string | null };
}

const BOARD = process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com';

const TIER_BADGE: Record<number, { label: string; color: string; icon: typeof ShieldCheck }> = {
  1: { label: 'Licensed & Verified', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: ShieldCheck },
  2: { label: 'Credentials Verified', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Shield },
  3: { label: 'Identity Verified', color: 'bg-muted text-muted-foreground', icon: Shield },
};

// Wrapper: ghost variant uses new component, normal uses the rich original card
function ExpertCardWrapper({ expert, inDashboard, variant = 'compact' }: { expert: ExpertProfile; inDashboard?: boolean; variant?: 'compact' | 'featured' | 'ghost' }) {
  if (variant === 'ghost') return <NewExpertCard expert={toCardData(expert)} variant="ghost" />;
  return <RichExpertCard expert={expert} inDashboard={inDashboard} />;
}

function RichExpertCard({ expert, inDashboard }: { expert: ExpertProfile; inDashboard?: boolean }) {
  const tier = TIER_BADGE[expert.verification_tier] ?? TIER_BADGE[3];
  const TierIcon = tier.icon;
  const hasAdvisory = (expert.session_types ?? []).length > 0;
  const hasProject = true; // all experts accept project requests

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {expert.avatar_url ? (
            <Image src={expert.avatar_url} alt={expert.headline} width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {expert.headline.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{expert.headline}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {(expert.types ?? []).map((t) => (
              <span key={t.id} className="inline-flex items-center rounded-full bg-[#01696f]/10 text-[#01696f] dark:bg-[#4f98a3]/15 dark:text-[#4f98a3] px-2 py-0.5 text-xs font-medium">
                {t.name}
              </span>
            ))}
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', tier.color)}>
              <TierIcon className="h-3 w-3" />
              {tier.label}
            </span>
          </div>
        </div>
        {expert.featured && (
          <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {expert.location && (
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{expert.location}</span>
        )}
        {(expert.languages ?? []).length > 0 && (
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{(expert.languages ?? []).map((l) => l.name).join(', ')}</span>
        )}
        {expert.years_experience > 0 && (
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{expert.years_experience}+ years</span>
        )}
      </div>

      {/* Bio excerpt */}
      <p className="text-sm text-muted-foreground line-clamp-2">{expert.bio}</p>

      {/* Tags */}
      {(expert.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(expert.tags ?? []).slice(0, 4).map((t) => (
            <span key={t.id} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{t.name}</span>
          ))}
          {(expert.tags ?? []).length > 4 && (
            <span className="text-[11px] text-muted-foreground">+{(expert.tags ?? []).length - 4} more</span>
          )}
        </div>
      )}

      {/* Engagement types */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {hasAdvisory && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#01696f]/20 bg-[#01696f]/5 px-2.5 py-0.5 text-[#01696f] dark:text-[#4f98a3]">
            Advisory Calls
          </span>
        )}
        {hasProject && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#01696f]/20 bg-[#01696f]/5 px-2.5 py-0.5 text-[#01696f] dark:text-[#4f98a3]">
            Project-Based
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
          Custom Engagement
        </span>
      </div>

      {/* Footer: CTA */}
      <div className="flex gap-2 pt-2 border-t">
        <Link href={inDashboard ? `/dashboard?tool=expert-profile&slug=${expert.slug}` : `/experts/${expert.slug}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">View Profile</Button>
        </Link>
        <Link href={inDashboard ? `/dashboard?tool=expert-request&slug=${expert.slug}` : `/experts/request/${expert.slug}`} className="flex-1">
          <Button size="sm" className="w-full">Request Consultation</Button>
        </Link>
      </div>

      {/* Compliance footer */}
      <p className="text-[10px] text-muted-foreground/60 leading-tight">
        Mercorama facilitates discovery only — not customs brokerage or legal advice.
      </p>
    </div>
  );
}

function getVisibleCount(tier: string | null): number {
  if (!tier) return 2;
  if (tier === 'team' || tier === 'enterprise') return Infinity;
  return 5; // pro/starter
}

export function ExpertSearchClient({ inDashboard = false }: { inDashboard?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [result, setResult] = useState<ExpertSearchResult | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(searchParams.get('q') ?? '');
  const activeTab = searchParams.get('tab') === 'collections' ? 'collections' : 'experts';

  // Auth + gating state
  const [userTier, setUserTier] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const [collectionFilters, setCollectionFilters] = useState<CollectionFilters>({});

  // Check auth on mount
  useEffect(() => {
    if (inDashboard) {
      // Dashboard users are always authenticated — get tier from API
      fetch('/api/me').then((r) => r.ok ? r.json() : null).then((data) => {
        setUserTier(data?.plan ?? 'pro');
      }).catch(() => setUserTier('pro')).finally(() => setAuthChecked(true));
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Fetch plan from /api/me
        fetch('/api/me').then((r) => r.ok ? r.json() : null).then((data) => {
          setUserTier(data?.plan ?? 'pro');
        }).catch(() => setUserTier('pro'));
      }
    }).finally(() => setAuthChecked(true));
  }, [inDashboard]);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const type = searchParams.get('type');
      const vertical = searchParams.get('vertical');
      const language = searchParams.get('language');
      const sort = searchParams.get('sort');
      const q = searchParams.get('q');
      if (type) params.set('type', type);
      if (vertical) params.set('vertical', vertical);
      if (language) params.set('language', language);
      if (sort) params.set('sort', sort);
      if (q) params.set('q', q);

      const res = await fetch(`/api/experts/search?${params.toString()}`);
      if (res.ok) setResult(await res.json());
    } catch (err) {
      console.error('Expert search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  // Fetch collections
  useEffect(() => {
    if (activeTab === 'collections') {
      fetch('/api/experts/collections')
        .then((r) => r.json())
        .then((data) => setCollections(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [activeTab]);

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/experts/search?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilter('q', searchText || null);
  }

  const types = result?.filters.types ?? [];
  const verticals = result?.filters.verticals ?? [];
  const languages = result?.filters.languages ?? [];
  const activeType = searchParams.get('type');
  const activeVertical = searchParams.get('vertical');
  const activeLanguage = searchParams.get('language');
  const activeSort = searchParams.get('sort') ?? 'featured';

  return (
    <div>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-12 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Find a Trade Expert</h1>
          <p className="text-base sm:text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Connect with verified customs brokers, CITP/FIBP professionals, freight forwarders, and export advisors.
          </p>
          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by name, expertise, or keyword..."
                className="pl-10 bg-white text-foreground"
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setFilter('tab', null)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'experts'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Experts
          </button>
          <button
            onClick={() => setFilter('tab', 'collections')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'collections'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Collections
          </button>
        </div>
      </div>

      {/* Collections tab */}
      {activeTab === 'collections' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          {collections.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-lg font-semibold mb-2">No collections yet</p>
              <p className="text-sm text-muted-foreground">Expert resource guides will appear here once published.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => {
                const expertName = c.expert_profiles?.headline?.split('—')[0]?.trim() ?? 'Expert';
                return (
                  <Link key={c.id} href={`/experts/collections/${c.slug}`} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
                    {c.cover_image && (
                      <div className="aspect-[2/1] bg-muted">
                        <Image src={c.cover_image} alt={c.title} width={400} height={200} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{c.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.summary}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-5 w-5 rounded-full bg-muted overflow-hidden shrink-0">
                          {c.expert_profiles?.avatar_url && (
                            <Image src={c.expert_profiles.avatar_url} alt="" width={20} height={20} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{expertName}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Experts tab: Filters + Results */}
      {activeTab === 'experts' && (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Collections filter bar */}
        <ExpertCollectionsBar
          active={collectionFilters}
          onFilter={setCollectionFilters}
        />

        {/* Filter bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-6">
          {/* Type filter */}
          <div className="relative">
            <select
              value={activeType ?? ''}
              onChange={(e) => setFilter('type', e.target.value || null)}
              className="appearance-none w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm cursor-pointer"
            >
              <option value="">All Expert Types</option>
              {types.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Vertical filter */}
          <div className="relative">
            <select
              value={activeVertical ?? ''}
              onChange={(e) => setFilter('vertical', e.target.value || null)}
              className="appearance-none w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm cursor-pointer"
            >
              <option value="">All Industries</option>
              {verticals.map((v) => <option key={v.id} value={v.slug}>{v.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Language filter */}
          <div className="relative">
            <select
              value={activeLanguage ?? ''}
              onChange={(e) => setFilter('language', e.target.value || null)}
              className="appearance-none w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm cursor-pointer"
            >
              <option value="">All Languages</option>
              {languages.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative sm:ml-auto">
            <select
              value={activeSort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="appearance-none w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Active filter pills */}
        {(activeType || activeVertical || activeLanguage || searchParams.get('q')) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeType && (
              <button onClick={() => setFilter('type', null)} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {types.find((t) => t.slug === activeType)?.name} ✕
              </button>
            )}
            {activeVertical && (
              <button onClick={() => setFilter('vertical', null)} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {verticals.find((v) => v.slug === activeVertical)?.name} ✕
              </button>
            )}
            {activeLanguage && (
              <button onClick={() => setFilter('language', null)} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {activeLanguage} ✕
              </button>
            )}
            {searchParams.get('q') && (
              <button onClick={() => { setSearchText(''); setFilter('q', null); }} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                &ldquo;{searchParams.get('q')}&rdquo; ✕
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {loading ? 'Searching...' : `${result?.total ?? 0} expert${(result?.total ?? 0) !== 1 ? 's' : ''} found`}
          {' · '}
          <Link href="/verification-policy" className="text-primary hover:underline">Verification policy</Link>
        </p>

        {/* Expert grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border p-5 h-60 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : (result?.experts ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-semibold mb-2">No experts found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <GatedExpertGrid
            experts={result?.experts ?? []}
            visibleCount={getVisibleCount(userTier)}
            userTier={userTier}
            inDashboard={inDashboard}
            onLockedClick={() => setGateModalOpen(true)}
          />
        )}
      </div>
      )}

      {/* Gate modal */}
      <ExpertGateModal open={gateModalOpen} onClose={() => setGateModalOpen(false)} />

      {/* Sticky bottom bar for unauthenticated */}
      {authChecked && !userTier && !stickyDismissed && !inDashboard && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] border-t border-white/10 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-white/80 flex-1">
              You&apos;re viewing 2 of our verified experts —{' '}
              <a href={`${BOARD}/auth/signin`} className="text-[#4f98a3] hover:underline font-medium">Sign in</a>
              {' '}or{' '}
              <Link href="/beta" className="text-[#4f98a3] hover:underline font-medium">apply for beta access</Link>
            </p>
            <button onClick={() => setStickyDismissed(true)} className="text-white/40 hover:text-white/70 shrink-0">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gated expert grid ─────────────────────────────────────────────────────────

function GatedExpertGrid({
  experts,
  visibleCount,
  userTier,
  inDashboard,
  onLockedClick,
}: {
  experts: ExpertProfile[];
  visibleCount: number;
  userTier: string | null;
  inDashboard: boolean;
  onLockedClick: () => void;
}) {
  const visible = experts.slice(0, visibleCount);
  const hasLocked = experts.length > visibleCount;
  const ghostExperts = hasLocked ? experts.slice(visibleCount, visibleCount + 3) : [];
  // If not enough real experts for ghost cards, pad with first ones
  while (ghostExperts.length < 3 && experts.length > 0) {
    ghostExperts.push(experts[ghostExperts.length % experts.length]);
  }

  const isUnauthenticated = !userTier;
  const isStarter = userTier === 'pro';

  return (
    <div>
      {/* Visible cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((expert) => (
          <ExpertCardWrapper key={expert.id} expert={expert} inDashboard={inDashboard} />
        ))}
      </div>

      {/* Locked section */}
      {hasLocked && ghostExperts.length > 0 && (
        <div className="relative mt-4">
          {/* Ghost cards (blurred) */}
          <div
            className="grid gap-4 sm:grid-cols-2 select-none"
            style={{ filter: 'blur(6px)', pointerEvents: 'none' }}
            aria-hidden="true"
          >
            {ghostExperts.slice(0, 3).map((expert, i) => (
              <ExpertCardWrapper key={`ghost-${i}`} expert={expert} inDashboard={inDashboard} variant="ghost" />
            ))}
          </div>

          {/* Overlay card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <button
              onClick={onLockedClick}
              className="max-w-md w-full rounded-2xl bg-card border shadow-xl p-6 sm:p-8 text-center space-y-4 cursor-pointer hover:shadow-2xl transition-shadow"
            >
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[#01696f]/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-[#01696f]" />
                </div>
              </div>

              <h3 className="text-lg font-bold">
                {isUnauthenticated ? 'Unlock the Full Expert Directory' : 'Upgrade to Growth'}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {isUnauthenticated
                  ? 'Sign in to access the full directory of customs brokers, CITP advisors, and freight specialists.'
                  : 'Your Starter plan shows 5 expert profiles. Upgrade to Growth for full directory access.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                {isUnauthenticated ? (
                  <>
                    <a href={`${BOARD}/auth/signin`}>
                      <Button size="lg" className="w-full sm:w-auto">Sign In</Button>
                    </a>
                    <Link href="/beta">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto">Apply for Beta</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/beta">
                      <Button size="lg" className="w-full sm:w-auto">Upgrade Plan</Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto">Contact Us</Button>
                    </Link>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
