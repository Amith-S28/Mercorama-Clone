// lib/buildFundingContext.ts
// Utility functions to extract FundingContext from existing tool result shapes

import type { FundingContext } from './fundMyExport';

// ─── Export Compass → FundingContext ─────────────────────────────────────────

interface ExportCompassResult {
  productCategory?: string;
  productDescription?: string;
  hsCode?: string | null;
  topMarkets?: Array<{ country: string }>;
  recommendedMarkets?: Array<{ country: string }>;
  province?: string;
}

export function exportCompassResultToFundingContext(
  result: ExportCompassResult,
  province?: string
): FundingContext {
  const targetMarket =
    result.topMarkets?.[0]?.country ??
    result.recommendedMarkets?.[0]?.country ??
    '';

  const hsCode = result.hsCode ?? '';
  const hsChapter = hsCode.length >= 2 ? hsCode.slice(0, 2) : '';

  return {
    sector: result.productCategory ?? '',
    hsChapter,
    targetMarket,
    province: province ?? result.province ?? '',
    productDescription: result.productDescription ?? '',
  };
}

// ─── FTA Diversify → FundingContext ──────────────────────────────────────────

interface FtaDiversifyResult {
  sector?: string;
  selectedMarket?: string;
  productDescription?: string;
  province?: string;
}

export function ftaDiversifyResultToFundingContext(
  result: FtaDiversifyResult,
  province?: string
): FundingContext {
  return {
    sector: result.sector ?? '',
    targetMarket: result.selectedMarket ?? '',
    province: province ?? result.province ?? '',
    productDescription: result.productDescription ?? '',
  };
}

// ─── Deal Summary → FundingContext ───────────────────────────────────────────

interface DealSummaryResult {
  dealValue?: number;
  contractValue?: number;
  buyerType?: string;
  buyerCountry?: string;
  productCategory?: string;
  productDescription?: string;
}

export function dealSummaryToFundingContext(result: DealSummaryResult): FundingContext {
  const rawBuyerType = result.buyerType?.toLowerCase() ?? '';
  const buyerType = rawBuyerType.includes('gov') ? 'government' : 'private';

  return {
    dealValue: result.dealValue ?? result.contractValue,
    buyerType,
    targetMarket: result.buyerCountry ?? '',
    sector: result.productCategory ?? '',
    productDescription: result.productDescription ?? '',
  };
}
