import { describe, it, expect } from 'vitest';
import {
  calculateLandedCost,
  resolveFxBuffer,
} from '@/lib/landed-cost-calculator';

const baseInput = {
  productionCost: 5,
  unitPrice: 12,
  exportQuantity: 10000,
  targetProfitMargin: 15,
  containerRateCad: 6000,
  tariffRate: 0.12,
};

describe('landed-cost-calculator', () => {
  it('landed cost includes production + freight + broker + insurance + tariff', () => {
    const result = calculateLandedCost(baseInput);
    const expectedFreight = 6000 / 10000;
    const expectedTariff = 12 * 0.12;
    const expectedLanded = 5 + expectedFreight + 0.5 + 0.15 + expectedTariff;
    expect(result.landedCost).toBeCloseTo(expectedLanded, 2);
    expect(result.brokerFee).toBe(0.5);
  });

  it('zero tariff rate (FTA market) reduces landed cost correctly', () => {
    const withTariff = calculateLandedCost(baseInput);
    const fta = calculateLandedCost({ ...baseInput, tariffRate: 0 });
    expect(fta.landedCost).toBeLessThan(withTariff.landedCost);
    expect(fta.tariffPerUnit).toBe(0);
  });

  it('negative margin correctly triggers INSOLVENT flag', () => {
    const result = calculateLandedCost({
      ...baseInput,
      productionCost: 20,
      unitPrice: 10,
    });
    expect(result.insolvent).toBe(true);
    expect(result.actualMargin).toBeLessThan(0);
    expect(result.warning).toContain('INSOLVENT');
  });

  it('division by zero is handled when export quantity = 0', () => {
    const result = calculateLandedCost({ ...baseInput, exportQuantity: 0 });
    expect(result.warning).toContain('greater than zero');
    expect(result.insolvent).toBe(true);
    expect(result.unitFreightCost).toBe(0);
  });

  it('uses fallback FX buffer when volatility30d and volatility90d are null', () => {
    const buffer = resolveFxBuffer(null, null);
    expect(buffer).toBeCloseTo(1.5, 10);

    const result = calculateLandedCost({
      ...baseInput,
      volatility30d: null,
      volatility90d: null,
    });
    expect(result.fxBufferUsed).toBe(1.5);
    expect(result.currencyAdjustedMargin).toBeCloseTo(result.actualMargin - 1.5, 2);
  });

  it('uses volatility30d when provided', () => {
    const volatility30d = 0.025;
    const buffer = resolveFxBuffer(volatility30d, null);
    expect(buffer).toBeCloseTo(Math.max(2, volatility30d * 100), 10);

    const result = calculateLandedCost({
      ...baseInput,
      volatility30d,
      volatility90d: null,
    });
    expect(result.fxBufferUsed).toBe(2.5);
  });
});
