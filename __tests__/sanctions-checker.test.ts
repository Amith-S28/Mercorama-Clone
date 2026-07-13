import { describe, it, expect } from 'vitest';
import { checkSanctions, normalizeQuery } from '@/lib/sanctions-checker';

describe('normalizeQuery', () => {
  it('strips punctuation and uppercases input', () => {
    expect(normalizeQuery('  rosneft-oil, co.  ')).toBe('ROSNEFT OIL CO');
    expect(normalizeQuery('Islamic Revolutionary Guard Corps.')).toBe(
      'ISLAMIC REVOLUTIONARY GUARD CORPS'
    );
  });

  it('collapses repeated whitespace', () => {
    expect(normalizeQuery('ROSNEFT    OIL')).toBe('ROSNEFT OIL');
  });
});

describe('checkSanctions', () => {
  it('matches known sanctioned entity names', () => {
    const result = checkSanctions('ROSNEFT OIL COMPANY');
    expect(result.match).toBe(true);
    expect(result.matchedEntries.length).toBeGreaterThan(0);
    expect(result.normalizedQuery).toBe('ROSNEFT OIL COMPANY');
  });

  it('matches aliases after normalization', () => {
    const result = checkSanctions('irgc');
    expect(result.match).toBe(true);
    expect(result.matchedEntries[0]?.name).toContain('REVOLUTIONARY GUARD');
  });

  it('returns no match for clean entity names', () => {
    const result = checkSanctions('Maple Grove Foods Inc.');
    expect(result.match).toBe(false);
    expect(result.matchedEntries).toHaveLength(0);
    expect(result.normalizedQuery).toBe('MAPLE GROVE FOODS INC');
  });

  it('handles empty query safely', () => {
    const result = checkSanctions('   ');
    expect(result.match).toBe(false);
    expect(result.normalizedQuery).toBe('');
  });
});
