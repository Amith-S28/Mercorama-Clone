// app/api/freight-connect/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase';
import { createQuoteRequest, createBulkQuoteRequests } from '@/lib/freightConnectQuotes';
import type { CreateQuoteInput } from '@/lib/freightConnectQuotes';
import { BULK_QUOTE_MAX } from '@/lib/freightConnectConstants';
import { chargeLeadFee } from '@/lib/freightConnectBilling';
import { sendNewLeadQuoteOnly, sendNewLeadAnonymisedProfile } from '@/lib/freightConnectEmails';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      forwarder_ids: string[];
      is_bulk: boolean;
      product_category: string;
      hs_chapter: string;
      origin_province: string;
      target_market: string;
      estimated_volume: string;
      shipping_mode: string;
      additional_notes?: string;
      lead_tier: 'quote_only' | 'anonymised_profile';
      user_plan: string;
    };

    const {
      forwarder_ids,
      is_bulk,
      product_category,
      hs_chapter,
      origin_province,
      target_market,
      estimated_volume,
      shipping_mode,
      additional_notes,
      lead_tier,
      user_plan,
    } = body;

    if (!forwarder_ids?.length) {
      return NextResponse.json({ error: 'At least one forwarder required' }, { status: 400 });
    }

    const isGrowth = user_plan === 'team' || user_plan === 'enterprise';

    if (is_bulk && !isGrowth) {
      return NextResponse.json({ error: 'bulk_quote_requires_growth' }, { status: 403 });
    }

    if (forwarder_ids.length > BULK_QUOTE_MAX) {
      return NextResponse.json(
        { error: `Bulk quotes are limited to ${BULK_QUOTE_MAX} forwarders per request.` },
        { status: 400 }
      );
    }

    const baseInput: Omit<CreateQuoteInput, 'forwarder_id'> = {
      sme_user_id:      user.id,
      product_category,
      hs_chapter:       hs_chapter.slice(0, 2),
      origin_province,
      target_market,
      estimated_volume:  estimated_volume as '1' | '2-5' | '6-12' | '12+',
      shipping_mode:     shipping_mode as CreateQuoteInput['shipping_mode'],
      additional_notes,
      lead_tier,
    };

    let quotes: Awaited<ReturnType<typeof createQuoteRequest>>[];
    let isBulkResult = false;

    if (is_bulk && forwarder_ids.length > 1) {
      quotes = await createBulkQuoteRequests(baseInput, forwarder_ids);
      isBulkResult = true;
    } else {
      const q = await createQuoteRequest({ ...baseInput, forwarder_id: forwarder_ids[0] });
      quotes = [q];
    }

    // ── Fire-and-forget: lead charges + forwarder email notifications ────────
    const db = createServiceClient();

    for (const quote of quotes) {
      void (async () => {
        try {
          const { data: ff } = await db
            .from('freight_forwarders')
            .select('state, primary_contact_email, company_name')
            .eq('id', quote.forwarder_id)
            .single();

          if (!ff) return;

          if (ff.state === 'claimed') {
            await chargeLeadFee(
              quote.forwarder_id,
              quote.id,
              ff.state,
              lead_tier
            ).catch((e: unknown) => console.error(`[FC quote] lead charge failed for ${quote.id}:`, e));
          }

          if (!ff.primary_contact_email) return;

          const emailBase = {
            toEmail:          ff.primary_contact_email,
            companyName:      ff.company_name,
            quoteRequestId:   quote.id,
            productCategory:  product_category,
            targetMarket:     target_market,
            shippingMode:     shipping_mode,
            estimatedVolume:  estimated_volume,
            responseDeadline: quote.response_deadline,
          };

          if (lead_tier === 'anonymised_profile') {
            await sendNewLeadAnonymisedProfile({
              ...emailBase,
              hsChapter:       hs_chapter.slice(0, 2),
              originProvince:  origin_province,
              additionalNotes: additional_notes,
            });
          } else {
            await sendNewLeadQuoteOnly(emailBase);
          }
        } catch (e) {
          console.error(`[FC quote] post-processing failed for ${quote.forwarder_id}:`, e);
        }
      })();
    }

    if (isBulkResult) {
      return NextResponse.json({ quotes, bulk: true });
    }
    return NextResponse.json({ quote: quotes[0], bulk: false });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Quote creation failed';
    console.error('[FC quote] error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
