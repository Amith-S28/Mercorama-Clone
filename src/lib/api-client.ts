type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreaker {
  failures: number;
  state: CircuitState;
  openedAt: number;
}

const circuits = new Map<string, CircuitBreaker>();

const FAILURE_THRESHOLD = 3;
const RESET_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 3;

function getCircuit(key: string): CircuitBreaker {
  const existing = circuits.get(key);
  if (existing) return existing;
  const created: CircuitBreaker = { failures: 0, state: 'closed', openedAt: 0 };
  circuits.set(key, created);
  return created;
}

function recordSuccess(key: string) {
  const circuit = getCircuit(key);
  circuit.failures = 0;
  circuit.state = 'closed';
}

function recordFailure(key: string) {
  const circuit = getCircuit(key);
  circuit.failures += 1;
  if (circuit.failures >= FAILURE_THRESHOLD) {
    circuit.state = 'open';
    circuit.openedAt = Date.now();
  }
}

function canAttempt(key: string): boolean {
  const circuit = getCircuit(key);
  if (circuit.state === 'closed') return true;
  if (circuit.state === 'open' && Date.now() - circuit.openedAt >= RESET_MS) {
    circuit.state = 'half-open';
    return true;
  }
  return circuit.state === 'half-open';
}

export interface FetchWithRetryOptions {
  circuitKey: string;
  timeoutMs?: number;
  maxRetries?: number;
  init?: RequestInit;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions
): Promise<Response> {
  const {
    circuitKey,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = MAX_RETRIES,
    init,
  } = options;

  if (!canAttempt(circuitKey)) {
    throw new Error(`Circuit open for ${circuitKey}`);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status === 429 || response.status >= 500) {
        recordFailure(circuitKey);
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < maxRetries) {
          await sleep(backoffMs(attempt));
          continue;
        }
        throw lastError;
      }

      recordSuccess(circuitKey);
      return response;
    } catch (error) {
      clearTimeout(timer);
      recordFailure(circuitKey);
      lastError = error;
      if (attempt < maxRetries) {
        await sleep(backoffMs(attempt));
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('fetchWithRetry failed');
}

export async function withMockFallback<T>(
  circuitKey: string,
  live: () => Promise<T>,
  fallback: () => T,
  isConfigured: boolean
): Promise<{ data: T; origin: 'live' | 'mock-fallback' }> {
  if (!isConfigured) {
    return { data: fallback(), origin: 'mock-fallback' };
  }

  try {
    if (!canAttempt(circuitKey)) {
      return { data: fallback(), origin: 'mock-fallback' };
    }
    const data = await live();
    recordSuccess(circuitKey);
    return { data, origin: 'live' };
  } catch {
    recordFailure(circuitKey);
    return { data: fallback(), origin: 'mock-fallback' };
  }
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000) + Math.floor(Math.random() * 200);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getCircuitSnapshot(key: string): CircuitBreaker {
  return { ...getCircuit(key) };
}

export function resetCircuits(): void {
  circuits.clear();
}
