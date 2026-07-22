// lib/experts.ts
// Data access for the Trade Experts Marketplace.

import { createServiceClient } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExpertType { id: string; name: string; slug: string; sort_order: number }
export interface ExpertVertical { id: string; name: string; slug: string }
export interface ExpertTag { id: string; name: string }
export interface ExpertLanguage { id: string; name: string }

export interface ExpertSessionType {
  id: string;
  expert_id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface ExpertProfile {
  id: string;
  user_id: string | null;
  slug: string;
  headline: string;
  bio: string;
  location: string;
  timezone: string;
  years_experience: number;
  featured: boolean;
  linkedin_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  license_number: string | null;
  license_body: string | null;
  verification_tier: number;
  cal_username: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  // Joined data
  types?: ExpertType[];
  verticals?: ExpertVertical[];
  tags?: ExpertTag[];
  languages?: ExpertLanguage[];
  session_types?: ExpertSessionType[];
}

export interface ExpertSearchFilters {
  type?: string;       // expert_type slug
  vertical?: string;   // vertical slug
  language?: string;    // language name
  sort?: 'featured' | 'newest' | 'price_asc' | 'price_desc';
  q?: string;          // free-text search
}

export interface ExpertSearchResult {
  experts: ExpertProfile[];
  total: number;
  filters: {
    types: ExpertType[];
    verticals: ExpertVertical[];
    languages: ExpertLanguage[];
  };
}

// ── Lookups ───────────────────────────────────────────────────────────────────

export async function getExpertTypes(): Promise<ExpertType[]> {
  const db = createServiceClient();
  const { data } = await db.from('expert_types').select('*').order('sort_order');
  return data ?? [];
}

export async function getExpertVerticals(): Promise<ExpertVertical[]> {
  const db = createServiceClient();
  const { data } = await db.from('expert_verticals').select('*').order('name');
  return data ?? [];
}

export async function getExpertLanguages(): Promise<ExpertLanguage[]> {
  const db = createServiceClient();
  const { data } = await db.from('expert_languages').select('*').order('name');
  return data ?? [];
}

// ── Enrich profile with joined data ───────────────────────────────────────────

async function enrichProfile(db: ReturnType<typeof createServiceClient>, profile: ExpertProfile): Promise<ExpertProfile> {
  const [typesRes, verticalsRes, tagsRes, langsRes, sessionsRes] = await Promise.all([
    db.from('expert_profile_types')
      .select('type_id, expert_types(id, name, slug, sort_order)')
      .eq('expert_id', profile.id),
    db.from('expert_profile_verticals')
      .select('vertical_id, expert_verticals(id, name, slug)')
      .eq('expert_id', profile.id),
    db.from('expert_profile_tags')
      .select('tag_id, expert_tags(id, name)')
      .eq('expert_id', profile.id),
    db.from('expert_profile_languages')
      .select('language_id, expert_languages(id, name)')
      .eq('expert_id', profile.id),
    db.from('expert_session_types')
      .select('*')
      .eq('expert_id', profile.id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  return {
    ...profile,
    types: (typesRes.data ?? []).map((r: Record<string, unknown>) => r.expert_types as unknown as ExpertType),
    verticals: (verticalsRes.data ?? []).map((r: Record<string, unknown>) => r.expert_verticals as unknown as ExpertVertical),
    tags: (tagsRes.data ?? []).map((r: Record<string, unknown>) => r.expert_tags as unknown as ExpertTag),
    languages: (langsRes.data ?? []).map((r: Record<string, unknown>) => r.expert_languages as unknown as ExpertLanguage),
    session_types: sessionsRes.data ?? [],
  };
}

// ── Get single profile by slug ────────────────────────────────────────────────

export async function getExpertBySlug(slug: string): Promise<ExpertProfile | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('expert_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return null;
  return enrichProfile(db, data as ExpertProfile);
}

// ── Search / list experts ─────────────────────────────────────────────────────

export async function searchExperts(filters: ExpertSearchFilters): Promise<ExpertSearchResult> {
  const db = createServiceClient();

  // Start with base query
  let query = db
    .from('expert_profiles')
    .select('*', { count: 'exact' })
    .eq('is_approved', true)
    .eq('is_active', true);

  // Free-text search on headline + bio
  if (filters.q) {
    query = query.or(`headline.ilike.%${filters.q}%,bio.ilike.%${filters.q}%`);
  }

  // Filter by expert type (requires join table lookup)
  if (filters.type) {
    const { data: typeRow } = await db.from('expert_types').select('id').eq('slug', filters.type).maybeSingle();
    if (typeRow) {
      const { data: expertIds } = await db.from('expert_profile_types').select('expert_id').eq('type_id', typeRow.id);
      const ids = (expertIds ?? []).map((r) => r.expert_id);
      if (ids.length === 0) return { experts: [], total: 0, filters: await getFilterOptions() };
      query = query.in('id', ids);
    }
  }

  // Filter by vertical
  if (filters.vertical) {
    const { data: vertRow } = await db.from('expert_verticals').select('id').eq('slug', filters.vertical).maybeSingle();
    if (vertRow) {
      const { data: expertIds } = await db.from('expert_profile_verticals').select('expert_id').eq('vertical_id', vertRow.id);
      const ids = (expertIds ?? []).map((r) => r.expert_id);
      if (ids.length === 0) return { experts: [], total: 0, filters: await getFilterOptions() };
      query = query.in('id', ids);
    }
  }

  // Filter by language
  if (filters.language) {
    const { data: langRow } = await db.from('expert_languages').select('id').eq('name', filters.language).maybeSingle();
    if (langRow) {
      const { data: expertIds } = await db.from('expert_profile_languages').select('expert_id').eq('language_id', langRow.id);
      const ids = (expertIds ?? []).map((r) => r.expert_id);
      if (ids.length === 0) return { experts: [], total: 0, filters: await getFilterOptions() };
      query = query.in('id', ids);
    }
  }

  // Sort
  switch (filters.sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'featured':
    default:
      query = query.order('featured', { ascending: false }).order('verification_tier').order('years_experience', { ascending: false });
      break;
  }

  const { data, count } = await query.limit(50);
  const profiles = data ?? [];

  // Enrich each profile with types/verticals/tags/languages/sessions
  const enriched = await Promise.all(
    profiles.map((p) => enrichProfile(db, p as ExpertProfile)),
  );

  // For price sorting (need session_types loaded first)
  if (filters.sort === 'price_asc' || filters.sort === 'price_desc') {
    enriched.sort((a, b) => {
      const aMin = Math.min(...(a.session_types ?? []).map((s) => s.price_cents), Infinity);
      const bMin = Math.min(...(b.session_types ?? []).map((s) => s.price_cents), Infinity);
      return filters.sort === 'price_asc' ? aMin - bMin : bMin - aMin;
    });
  }

  return {
    experts: enriched,
    total: count ?? enriched.length,
    filters: await getFilterOptions(),
  };
}

async function getFilterOptions() {
  const [types, verticals, languages] = await Promise.all([
    getExpertTypes(),
    getExpertVerticals(),
    getExpertLanguages(),
  ]);
  return { types, verticals, languages };
}
