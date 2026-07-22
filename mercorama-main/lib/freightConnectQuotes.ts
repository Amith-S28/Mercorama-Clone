// lib/freightConnectQuotes.ts
// Quote request state machine, identity reveal, bulk quote support
import 'server-only';

import { createServiceClient } from '@/lib/supabase';
import { calculateLeadFee, canReceiveQuotes } from '@/lib/freightConnect';
import type { ShippingMode } from '@/lib/freightConnect';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuoteRequestState =
  | 'pending'
  | 'sent_to_forwarder'
  | 'responded'
  | 'expired'
  | 'refunded';

export type QuoteLeadTier = 'quote_only' | 'anonymised_profile';

export type EstimatedVolume = '1' | '2-5' | '6-12' | '12+';

export interface QuoteRequest {
  id:                     string;
  sme_user_id:            string;   // NEVER expose to forwarder directly
  forwarder_id:           string;
  state:                  QuoteRequestState;

  // Anonymised payload
  product_category:       string;
  hs_chapter:             string;   // 2-digit only
  origin_province:        string;
  target_market:          string;
  estimated_volume:       EstimatedVolume;
  shipping_mode:          ShippingMode;
  additional_notes:       string | null;

  // Lead billing
  lead_tier:              QuoteLeadTier;
  lead_fee:               number;
  lead_charged:           boolean;
  lead_refunded:          boolean;
  stripe_charge_id:       string | null;

  // Response
  forwarder_response_text: string | null;
  response_deadline:      string;
  responded_at:           string | null;

  // Identity reveal
  user_identity_revealed: boolean;
  user_reveal_at:         string | null;

  // Bulk
  is_bulk:                boolean;
  bulk_group_id:          string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface QuoteResponse {
  id:               string;
  quote_request_id: string;
  forwarder_id:     string;
  rate_estimate:    string | null;
  transit_time:     string | null;
  notes:            string | null;
  created_at:       string;
}

// ─── Anonymised payload — what forwarders actually see ───────────────────────
// CRITICAL: sme_user_id, user email, user company NEVER included here.

export interface AnonymisedQuotePayload {
  product_category:  string;
  hs_chapter:        string;   // 2-digit only
  origin_province:   string;
  target_market:     string;
  estimated_volume:  EstimatedVolume;
  shipping_mode:     ShippingMode;
  additional_notes:  string | null;
}

export function toAnonymisedPayload(q: QuoteRequest): AnonymisedQuotePayload {
  return {
    product_category: q.product_category,
    hs_chapter:       q.hs_chapter,
    origin_province:  q.origin_province,
    target_market:    q.target_market,
    estimated_volume: q.estimated_volume,
    shipping_mode:    q.shipping_mode,
    additional_notes: q.additional_notes,
  };
}

// ─── Create quote request ─────────────────────────────────────────────────────

export interface CreateQuoteInput {
  sme_user_id:      string;
  forwarder_id:     string;
  product_category: string;
  hs_chapter:       string;   // caller must ensure 2-digit only
  origin_province:  string;
  target_market:    string;
  estimated_volume: EstimatedVolume;
  shipping_mode:    ShippingMode;
  additional_notes?: string;
  lead_tier:        QuoteLeadTier;
  is_bulk?:         boolean;
  bulk_group_id?:   string;
}

export async function createQuoteRequest(input: CreateQuoteInput): Promise<QuoteRequest> {
  const db = createServiceClient();

  // Enforce: forwarder must be claimable
  const { data: ff, error: ffErr } = await db
    .from('freight_forwarders')
    .select('state, is_suspended')
    .eq('id', input.forwarder_id)
    .single();

  if (ffErr || !ff) throw new Error('Forwarder not found');

  if (!canReceiveQuotes(ff as { state: 'unclaimed' | 'claimed' | 'verified' | 'featured'; is_suspended: boolean })) {
    throw new Error(
      ff.is_suspended
        ? 'This forwarder is currently suspended and cannot receive quote requests.'
        : 'This forwarder is not yet registered on Freight Connect.'
    );
  }

  const lead_fee = calculateLeadFee(
    ff.state as 'unclaimed' | 'claimed' | 'verified' | 'featured',
    input.lead_tier
  );

  // response_deadline is auto-set by DB trigger (created_at + forwarder SLA hours)
  const { data, error } = await db
    .from('quote_requests')
    .insert({
      sme_user_id:      input.sme_user_id,
      forwarder_id:     input.forwarder_id,
      state:            'pending',
      product_category: input.product_category,
      hs_chapter:       input.hs_chapter.slice(0, 2),  // enforce 2-digit
      origin_province:  input.origin_province,
      target_market:    input.target_market,
      estimated_volume: input.estimated_volume,
      shipping_mode:    input.shipping_mode,
      additional_notes: input.additional_notes ?? null,
      lead_tier:        input.lead_tier,
      lead_fee,
      lead_charged:     false,
      lead_refunded:    false,
      user_identity_revealed: false,
      is_bulk:          input.is_bulk ?? false,
      bulk_group_id:    input.bulk_group_id ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[FreightConnect] createQuoteRequest error:', error);
    throw error ?? new Error('Failed to create quote request');
  }

  return data as QuoteRequest;
}

// ─── Bulk quote (Growth plan) — one form → up to 3 forwarders ────────────────

export async function createBulkQuoteRequests(
  input: Omit<CreateQuoteInput, 'forwarder_id' | 'is_bulk' | 'bulk_group_id'>,
  forwarder_ids: string[]
): Promise<QuoteRequest[]> {
  if (forwarder_ids.length > 3) {
    throw new Error('Bulk quotes are limited to 3 forwarders simultaneously.');
  }

  const bulk_group_id = crypto.randomUUID();

  const results = await Promise.all(
    forwarder_ids.map((forwarder_id) =>
      createQuoteRequest({
        ...input,
        forwarder_id,
        is_bulk: true,
        bulk_group_id,
      })
    )
  );

  return results;
}

// ─── Mark quote as sent to forwarder ─────────────────────────────────────────

export async function markQuoteSentToForwarder(quoteId: string): Promise<void> {
  const db = createServiceClient();
  const { error } = await db
    .from('quote_requests')
    .update({ state: 'sent_to_forwarder' })
    .eq('id', quoteId)
    .eq('state', 'pending');
  if (error) throw error;
}

// ─── Forwarder responds to a quote ───────────────────────────────────────────

export interface ForwarderResponseInput {
  quote_request_id: string;
  forwarder_id:     string;
  response_text:    string;
  rate_estimate?:   string;
  transit_time?:    string;
  notes?:           string;
}

export async function submitForwarderResponse(input: ForwarderResponseInput): Promise<void> {
  const db = createServiceClient();
  const now = new Date().toISOString();

  // Update quote request
  const { error: qErr } = await db
    .from('quote_requests')
    .update({
      state:                   'responded',
      forwarder_response_text: input.response_text,
      responded_at:            now,
    })
    .eq('id', input.quote_request_id)
    .eq('forwarder_id', input.forwarder_id)
    .in('state', ['pending', 'sent_to_forwarder']);  // can't respond to expired

  if (qErr) {
    console.error('[FreightConnect] submitForwarderResponse quote update error:', qErr);
    throw qErr;
  }

  // Insert structured response record
  const { error: rErr } = await db
    .from('quote_responses')
    .insert({
      quote_request_id: input.quote_request_id,
      forwarder_id:     input.forwarder_id,
      rate_estimate:    input.rate_estimate ?? null,
      transit_time:     input.transit_time ?? null,
      notes:            input.notes ?? null,
    });

  if (rErr) {
    // Non-fatal — quote is already marked responded
    console.error('[FreightConnect] submitForwarderResponse response insert error:', rErr);
  }

  // Reset consecutive_missed_responses on any successful response
  await db
    .from('freight_forwarders')
    .update({ consecutive_missed_responses: 0 })
    .eq('id', input.forwarder_id);
}

// ─── SME reveals identity to forwarder ───────────────────────────────────────
// PRIVACY: this is the ONLY code path that marks user identity as revealed.
// Call only after explicit user consent.

export async function revealSmeIdentity(
  quoteRequestId: string,
  smeUserId: string
): Promise<void> {
  const db = createServiceClient();

  const { error } = await db
    .from('quote_requests')
    .update({
      user_identity_revealed: true,
      user_reveal_at:         new Date().toISOString(),
    })
    .eq('id', quoteRequestId)
    .eq('sme_user_id', smeUserId)         // guard: only the owning SME
    .eq('user_identity_revealed', false);  // idempotent

  if (error) {
    console.error('[FreightConnect] revealSmeIdentity error:', error);
    throw error;
  }
}

// ─── SME quote inbox ──────────────────────────────────────────────────────────

export async function getSmeQuotes(smeUserId: string): Promise<QuoteRequest[]> {
  const db = createServiceClient();

  const { data, error } = await db
    .from('quote_requests')
    .select('*')
    .eq('sme_user_id', smeUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as QuoteRequest[];
}

// ─── Forwarder dashboard: incoming quotes ────────────────────────────────────
// Returns ANONYMISED payload only — never includes sme_user_id unless revealed.

export async function getForwarderQuotes(forwarderId: string): Promise<AnonymisedQuotePayload[]> {
  const db = createServiceClient();

  const { data, error } = await db
    .from('quote_requests')
    .select('*')
    .eq('forwarder_id', forwarderId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => toAnonymisedPayload(row as QuoteRequest));
}

// ─── Forwarder dashboard: quotes with identity (if revealed) ─────────────────

export interface ForwarderQuoteView extends AnonymisedQuotePayload {
  quote_id:               string;
  state:                  QuoteRequestState;
  lead_tier:              QuoteLeadTier;
  response_deadline:      string;
  responded_at:           string | null;
  forwarder_response_text: string | null;
  user_identity_revealed: boolean;
  // Only populated when user_identity_revealed = true
  sme_user_id:            string | null;
}

export async function getForwarderQuoteViews(forwarderId: string): Promise<ForwarderQuoteView[]> {
  const db = createServiceClient();

  const { data, error } = await db
    .from('quote_requests')
    .select('*')
    .eq('forwarder_id', forwarderId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const q = row as QuoteRequest;
    return {
      ...toAnonymisedPayload(q),
      quote_id:                q.id,
      state:                   q.state,
      lead_tier:               q.lead_tier,
      response_deadline:       q.response_deadline,
      responded_at:            q.responded_at,
      forwarder_response_text: q.forwarder_response_text,
      user_identity_revealed:  q.user_identity_revealed,
      // PRIVACY: only include sme_user_id when explicitly revealed
      sme_user_id: q.user_identity_revealed ? q.sme_user_id : null,
    };
  });
}

// ─── Growth plan: lane analytics ─────────────────────────────────────────────

export interface LaneAnalyticsSummary {
  target_market:  string;
  shipping_mode:  ShippingMode;
  quote_count:    number;
  responded:      number;
  response_rate:  number;  // 0–1
}

export async function getSmeAnalytics(smeUserId: string): Promise<LaneAnalyticsSummary[]> {
  const db = createServiceClient();

  const { data, error } = await db
    .from('quote_requests')
    .select('target_market, shipping_mode, state')
    .eq('sme_user_id', smeUserId);

  if (error) throw error;

  // Aggregate client-side — small result sets expected
  const map = new Map<string, { total: number; responded: number }>();

  for (const row of (data ?? [])) {
    const key = `${row.target_market}||${row.shipping_mode}`;
    const existing = map.get(key) ?? { total: 0, responded: 0 };
    map.set(key, {
      total:     existing.total + 1,
      responded: existing.responded + (row.state === 'responded' ? 1 : 0),
    });
  }

  return Array.from(map.entries()).map(([key, val]) => {
    const [target_market, shipping_mode] = key.split('||');
    return {
      target_market,
      shipping_mode: shipping_mode as ShippingMode,
      quote_count:   val.total,
      responded:     val.responded,
      response_rate: val.total > 0 ? val.responded / val.total : 0,
    };
  }).sort((a, b) => b.quote_count - a.quote_count);
}
