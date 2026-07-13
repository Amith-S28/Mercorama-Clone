import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchWithRetry,
  getCircuitSnapshot,
  resetCircuits,
  withMockFallback,
} from '@/lib/api-client';

describe('api-client', () => {
  beforeEach(() => {
    resetCircuits();
    vi.restoreAllMocks();
  });

  it('withMockFallback returns mock when not configured', async () => {
    const result = await withMockFallback(
      'comtrade',
      async () => ({ live: true }),
      () => ({ live: false }),
      false
    );

    expect(result.origin).toBe('mock-fallback');
    expect(result.data).toEqual({ live: false });
  });

  it('withMockFallback returns live data when configured and live succeeds', async () => {
    const result = await withMockFallback(
      'exchange_rate',
      async () => ({ rate: 1.23 }),
      () => ({ rate: 0 }),
      true
    );

    expect(result.origin).toBe('live');
    expect(result.data).toEqual({ rate: 1.23 });
  });

  it('withMockFallback falls back after live failure and opens circuit', async () => {
    const key = 'searates-test';

    await withMockFallback(
      key,
      async () => {
        throw new Error('upstream down');
      },
      () => ({ ok: false }),
      true
    );

    const snapshot = getCircuitSnapshot(key);
    expect(snapshot.failures).toBe(1);
    expect(snapshot.state).toBe('closed');

    await withMockFallback(
      key,
      async () => {
        throw new Error('upstream down');
      },
      () => ({ ok: false }),
      true
    );
    await withMockFallback(
      key,
      async () => {
        throw new Error('upstream down');
      },
      () => ({ ok: false }),
      true
    );

    const openSnapshot = getCircuitSnapshot(key);
    expect(openSnapshot.failures).toBeGreaterThanOrEqual(3);
    expect(openSnapshot.state).toBe('open');

    const fallbackResult = await withMockFallback(
      key,
      async () => ({ ok: true }),
      () => ({ ok: false }),
      true
    );

    expect(fallbackResult.origin).toBe('mock-fallback');
    expect(fallbackResult.data).toEqual({ ok: false });
  });

  it('resetCircuits clears failure state', async () => {
    const key = 'csl-reset';

    await withMockFallback(
      key,
      async () => {
        throw new Error('fail');
      },
      () => 'fallback',
      true
    );

    resetCircuits();
    const snapshot = getCircuitSnapshot(key);
    expect(snapshot.failures).toBe(0);
    expect(snapshot.state).toBe('closed');
  });

  it('fetchWithRetry opens circuit after repeated server errors', async () => {
    const key = 'wto-fetch';
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response('error', { status: 500 }));
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      fetchWithRetry('https://example.com/api', {
        circuitKey: key,
        maxRetries: 0,
        timeoutMs: 1000,
      })
    ).rejects.toThrow();

    await expect(
      fetchWithRetry('https://example.com/api', {
        circuitKey: key,
        maxRetries: 0,
        timeoutMs: 1000,
      })
    ).rejects.toThrow();

    await expect(
      fetchWithRetry('https://example.com/api', {
        circuitKey: key,
        maxRetries: 0,
        timeoutMs: 1000,
      })
    ).rejects.toThrow();

    const snapshot = getCircuitSnapshot(key);
    expect(snapshot.state).toBe('open');

    await expect(
      fetchWithRetry('https://example.com/api', {
        circuitKey: key,
        maxRetries: 0,
        timeoutMs: 1000,
      })
    ).rejects.toThrow(/Circuit open/);
  });
});
