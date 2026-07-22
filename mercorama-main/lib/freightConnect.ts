// lib/freightConnect.ts
// Freight Connect — core types, forwarder queries, search/filter logic
import 'server-only';

import { createServiceClient } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ForwarderState    = 'unclaimed' | 'claimed' | 'verified' | 'featured';
export type ForwarderSubTier  = 'none' | 'verified' | 'featured';
export type ShippingMode      = 'ocean' | 'air' | 'rail' | 'trucking' | 'multimodal';

export interface FreightForwarder {
  id:                           string;
  company_name:                 string;
  ciffa_membership_number:      string | null;
  logo_url:                     string | null;
  website_url:                  string | null;
  description:                  string | null;
  state:                        ForwarderState;
  provinces:                    string[];
  lanes:                        string[];
  hs_chapters:                  string[];   // 2-digit only
  shipping_modes:               ShippingMode[];
  // Contact — only populated once claimed
  primary_contact_name:         string | null;
  primary_contact_email:        string | null;
  // Stripe
  stripe_customer_id:           string | null;
  stripe_payment_method_on_file: boolean;
  // Subscription
  subscription_tier:            ForwarderSubTier;
  subscription_start_date:      string | null;
  subscription_end_date:        string | null;
  // Founding partner
  is_founding_partner:          boolean;
  founding_partner_lock_expiry: string | null;
  // SLA
  response_sla_hours:           number;
  consecutive_missed_responses: number;
  is_suspended:                 boolean;
  // Timestamps
  created_at:  string;
  updated_at:  string;
  claimed_at:  string | null;
  verified_at: string | null;
}

export interface ForwarderTestimonial {
  id:           string;
  forwarder_id: string;
  author_name:  string;
  author_company: string;
  body:         string;
  created_at:   string;
}

export interface ForwarderWithTestimonials extends FreightForwarder {
  testimonials: ForwarderTestimonial[];
}

// ─── Public-safe forwarder (strips PII for unclaimed/anonymous views) ─────────

export type PublicForwarder = Omit<
  FreightForwarder,
  'primary_contact_email' | 'stripe_customer_id' | 'stripe_payment_method_on_file'
>;

// ─── Search / filter params ───────────────────────────────────────────────────

export interface ForwarderSearchParams {
  target_market?:  string;   // matched against lanes array
  shipping_mode?:  ShippingMode;
  hs_chapter?:     string;   // 2-digit
  province?:       string;   // origin province
  states?:         ForwarderState[];  // default: ['claimed','verified','featured']
  include_suspended?: boolean;       // default: false
  limit?:          number;           // default: 20
  offset?:         number;
}

export interface ForwarderSearchResult {
  forwarders: PublicForwarder[];
  total:      number;
}

// ─── Lead fee calculation ────────────────────────────────────────────────────

export function calculateLeadFee(
  state: ForwarderState,
  lead_tier: 'quote_only' | 'anonymised_profile'
): number {
  // Verified and featured get leads for free — their subscription covers it
  if (state === 'verified' || state === 'featured') return 0.00;
  // Claimed: pay-per-lead
  return lead_tier === 'quote_only' ? 99.00 : 149.00;
}

// ─── Forwarder eligibility for receiving quotes ───────────────────────────────

export function canReceiveQuotes(forwarder: Pick<FreightForwarder, 'state' | 'is_suspended'>): boolean {
  if (forwarder.is_suspended) return false;
  return forwarder.state === 'claimed' ||
         forwarder.state === 'verified' ||
         forwarder.state === 'featured';
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchForwarders(
  params: ForwarderSearchParams
): Promise<ForwarderSearchResult> {
  const db = createServiceClient();
  const {
    target_market,
    shipping_mode,
    hs_chapter,
    province,
    states = ['claimed', 'verified', 'featured'],
    include_suspended = false,
    limit = 20,
    offset = 0,
  } = params;

  let query = db
    .from('freight_forwarders')
    .select('*', { count: 'exact' })
    .in('state', states);

  if (!include_suspended) {
    query = query.eq('is_suspended', false);
  }

  if (shipping_mode) {
    query = query.contains('shipping_modes', [shipping_mode]);
  }

  if (hs_chapter) {
    query = query.contains('hs_chapters', [hs_chapter]);
  }

  if (province) {
    query = query.contains('provinces', [province]);
  }

  if (target_market) {
    // Match lane strings that contain the target market name (case-insensitive partial match)
    // Supabase doesn't support ILIKE on array elements directly — use a text search filter
    query = query.filter('lanes', 'cs', `{${target_market}}`);
  }

  // Featured and verified appear first; within tier, sort by missed responses ascending
  query = query
    .order('subscription_tier', { ascending: false })
    .order('consecutive_missed_responses', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[FreightConnect] searchForwarders error:', error);
    throw error;
  }

  // Strip internal fields from public response
  const forwarders: PublicForwarder[] = (data ?? []).map(stripPrivateFields);

  return { forwarders, total: count ?? 0 };
}

// ─── Single forwarder ─────────────────────────────────────────────────────────

export async function getForwarder(id: string): Promise<ForwarderWithTestimonials | null> {
  const db = createServiceClient();

  const [ffRes, testRes] = await Promise.all([
    db.from('freight_forwarders').select('*').eq('id', id).single(),
    db.from('forwarder_testimonials').select('*').eq('forwarder_id', id).order('created_at'),
  ]);

  if (ffRes.error || !ffRes.data) return null;

  return {
    ...(ffRes.data as FreightForwarder),
    testimonials: (testRes.data ?? []) as ForwarderTestimonial[],
  };
}

// ─── Admin: get full forwarder (includes PII) ─────────────────────────────────

export async function getForwarderAdmin(id: string): Promise<ForwarderWithTestimonials | null> {
  return getForwarder(id); // service client already bypasses RLS
}

// ─── State transitions ────────────────────────────────────────────────────────

export async function claimForwarder(
  id: string,
  contactName: string,
  contactEmail: string,
  stripeCustomerId: string
): Promise<FreightForwarder> {
  const db = createServiceClient();

  const { data, error } = await db
    .from('freight_forwarders')
    .update({
      state:                        'claimed',
      primary_contact_name:         contactName,
      primary_contact_email:        contactEmail,
      stripe_customer_id:           stripeCustomerId,
      stripe_payment_method_on_file: false,
      claimed_at:                   new Date().toISOString(),
    })
    .eq('id', id)
    .eq('state', 'unclaimed')  // guard: can only claim unclaimed
    .select()
    .single();

  if (error || !data) {
    console.error('[FreightConnect] claimForwarder error:', error);
    throw error ?? new Error('Forwarder not found or already claimed');
  }

  return data as FreightForwarder;
}

export async function verifyForwarder(
  id: string,
  subscriptionTier: 'verified' | 'featured'
): Promise<FreightForwarder> {
  const db = createServiceClient();

  const newState: ForwarderState = subscriptionTier === 'featured' ? 'featured' : 'verified';

  const { data, error } = await db
    .from('freight_forwarders')
    .update({
      state:                   newState,
      subscription_tier:       subscriptionTier,
      verified_at:             new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('[FreightConnect] verifyForwarder error:', error);
    throw error ?? new Error('Forwarder not found');
  }

  return data as FreightForwarder;
}

export async function suspendForwarder(id: string): Promise<void> {
  const db = createServiceClient();
  const { error } = await db
    .from('freight_forwarders')
    .update({ is_suspended: true })
    .eq('id', id);
  if (error) {
    console.error('[FreightConnect] suspendForwarder error:', error);
    throw error;
  }
}

export async function reinstateForwarder(id: string): Promise<void> {
  const db = createServiceClient();
  const { error } = await db
    .from('freight_forwarders')
    .update({ is_suspended: false, consecutive_missed_responses: 0 })
    .eq('id', id);
  if (error) throw error;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripPrivateFields(row: FreightForwarder): PublicForwarder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { primary_contact_email, stripe_customer_id, stripe_payment_method_on_file, ...pub } = row;
  return pub;
}
