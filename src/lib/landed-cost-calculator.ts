import type { LandedCostInput, LandedCostResult } from '@/types';

const BROKER_FEE = 0.5;
const INSURANCE_FEE = 0.15;
const DEFAULT_FX_BUFFER = 2;
const STANDARD_RATE_ERROR = 0.01;

/**
 * FX volatility buffer uses rolling 30/90-day annualized variance.
 * Missing currency tables fall back to safe-mode: 1.5 * standard_rate_error * 100.
 */
export function resolveFxBuffer(
  volatility30d?: number | null,
  volatility90d?: number | null
): number {
  if (volatility30d != null && Number.isFinite(volatility30d)) {
    return Math.max(DEFAULT_FX_BUFFER, volatility30d * 100);
  }
  if (volatility90d != null && Number.isFinite(volatility90d)) {
    return Math.max(DEFAULT_FX_BUFFER, volatility90d * 100 * 0.85);
  }
  return 1.5 * STANDARD_RATE_ERROR * 100;
}

export function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const {
    productionCost,
    unitPrice,
    exportQuantity,
    targetProfitMargin,
    containerRateCad,
    tariffRate,
    volatility30d,
    volatility90d,
  } = input;

  const fxBufferUsed = resolveFxBuffer(volatility30d, volatility90d);

  if (exportQuantity <= 0) {
    return {
      unitFreightCost: 0,
      tariffPerUnit: 0,
      brokerFee: BROKER_FEE,
      insuranceFee: INSURANCE_FEE,
      landedCost: productionCost + BROKER_FEE + INSURANCE_FEE,
      actualMargin: 0,
      currencyAdjustedMargin: 0,
      fxBufferUsed,
      insolvent: true,
      meetsTarget: false,
      warning: 'Export quantity must be greater than zero.',
    };
  }

  const unitFreightCost = containerRateCad / exportQuantity;
  const tariffPerUnit = unitPrice * tariffRate;
  const landedCost =
    productionCost + unitFreightCost + BROKER_FEE + INSURANCE_FEE + tariffPerUnit;

  const actualMargin = unitPrice > 0 ? ((unitPrice - landedCost) / unitPrice) * 100 : 0;
  const currencyAdjustedMargin = actualMargin - fxBufferUsed;

  const insolvent = actualMargin < 0;
  const meetsTarget = currencyAdjustedMargin >= targetProfitMargin;

  let warning: string | undefined;
  if (insolvent) {
    warning =
      'INSOLVENT: Expected profit margin is negative. Landed cost exceeds unit sale price.';
  } else if (!meetsTarget) {
    warning = `Margin (${currencyAdjustedMargin.toFixed(1)}%) falls below target (${targetProfitMargin}%) after FX buffer (${fxBufferUsed.toFixed(2)}%).`;
  }

  return {
    unitFreightCost: round2(unitFreightCost),
    tariffPerUnit: round2(tariffPerUnit),
    brokerFee: BROKER_FEE,
    insuranceFee: INSURANCE_FEE,
    landedCost: round2(landedCost),
    actualMargin: round2(actualMargin),
    currencyAdjustedMargin: round2(currencyAdjustedMargin),
    fxBufferUsed: round2(fxBufferUsed),
    insolvent,
    meetsTarget,
    warning,
  };
}

export function generateProfitWarning(result: LandedCostResult): string | null {
  return result.warning ?? null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function applyFinancialBonus(
  pillarScores: Record<string, number>,
  landedResult: LandedCostResult
): Record<string, number> {
  const scores = { ...pillarScores };
  const financial = scores.financial ?? 0;

  if (landedResult.insolvent) {
    scores.financial = Math.min(financial, 10);
  } else if (landedResult.meetsTarget) {
    scores.financial = Math.min(100, financial + 20);
  }

  return scores;
}
