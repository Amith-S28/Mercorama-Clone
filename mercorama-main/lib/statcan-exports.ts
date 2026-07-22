// lib/statcan-exports.ts
// Province-level StatCan export data connector.
// Reads from statcan_exports table (populated by backfillProvinceTrade script).
// Does NOT call StatCan API directly in the user request path.
import 'server-only';
import { createServiceClient } from '@/lib/supabase';

const CAD_TO_USD = 0.74; // approximate — update periodically

export interface StatcanExportResult {
  hs6Code:         string;
  provinceCode:    string;
  partnerIso3:     string;
  year:            number;
  exportValueCAD:  number;
  exportValueUSD:  number;
  sharePercent:    number | null;
  source:          string;
  lastSyncedAt:    string | null;
}

/**
 * Read province-level export data from statcan_exports table.
 * Returns null if not yet backfilled — caller should treat as Estimated.
 */
export async function getStatcanProvinceExport(
  hs6Code:      string,
  provinceCode: string,
  partnerIso3:  string,
  year?:        number
): Promise<StatcanExportResult | null> {
  const db  = createServiceClient();
  const hs6 = hs6Code.replace(/\./g, '').slice(0, 6);

  let q = db
    .from('statcan_exports')
    .select('hs6_code, province_code, partner_iso3, year, export_value_cad, source, last_synced_at')
    .eq('hs6_code', hs6)
    .eq('province_code', provinceCode)
    .eq('partner_iso3', partnerIso3)
    .order('year', { ascending: false })
    .limit(1);

  if (year) q = q.eq('year', year);

  const { data } = await q.maybeSingle();
  if (!data) return null;

  const exportValueCAD = Number(data.export_value_cad ?? 0);

  return {
    hs6Code:        hs6,
    provinceCode:   data.province_code,
    partnerIso3:    data.partner_iso3,
    year:           data.year,
    exportValueCAD,
    exportValueUSD: Math.round(exportValueCAD * CAD_TO_USD),
    sharePercent:   null, // computed separately when total import value is known
    source:         data.source ?? 'Statistics Canada',
    lastSyncedAt:   data.last_synced_at ?? null,
  };
}

/**
 * Read national (all-Canada) export data from statcan_exports.
 * province_code = 'CA' rows are written by the backfill when no province filter is applied.
 */
export async function getStatcanNationalExport(
  hs6Code:     string,
  partnerIso3: string
): Promise<StatcanExportResult | null> {
  return getStatcanProvinceExport(hs6Code, 'CA', partnerIso3);
}

/**
 * Upsert a row into statcan_exports.
 * Called by backfillProvinceTrade or any future StatCan ingest job.
 */
export async function upsertStatcanExport(row: {
  hs6Code:         string;
  provinceCode:    string;
  partnerIso3:     string;
  year:            number;
  exportValueCAD:  number;
  exportQty?:      number;
}): Promise<void> {
  const db  = createServiceClient();
  const now = new Date().toISOString();

  await db.from('statcan_exports').upsert({
    hs6_code:         row.hs6Code.replace(/\./g, '').slice(0, 6),
    province_code:    row.provinceCode,
    partner_iso3:     row.partnerIso3,
    year:             row.year,
    export_value_cad: row.exportValueCAD,
    export_qty:       row.exportQty ?? null,
    source:           'Statistics Canada',
    last_synced_at:   now,
  }, { onConflict: 'hs6_code,province_code,partner_iso3,year' });
}
