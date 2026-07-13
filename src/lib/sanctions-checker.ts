import type { SanctionsScreeningResult } from '@/types';

const CSL_FALLBACK_ENTRIES: { name: string; source: string; aliases: string[] }[] = [
  { name: 'ROSNEFT OIL COMPANY', source: 'SEMA/CSL', aliases: ['ROSNEFT', 'ROSNEFT OIL'] },
  { name: 'ISLAMIC REVOLUTIONARY GUARD CORPS', source: 'SEMA/CSL', aliases: ['IRGC', 'REVOLUTIONARY GUARD'] },
  { name: 'NORTH KOREA MINING DEVELOPMENT TRADING', source: 'SEMA/CSL', aliases: ['KOMID', 'MINING DEVELOPMENT TRADING'] },
  { name: 'SYRIAN PETROLEUM COMPANY', source: 'SEMA/CSL', aliases: ['SPC', 'SYRIAN PETROLEUM'] },
  { name: 'MYANMAR ECONOMIC HOLDINGS LIMITED', source: 'SEMA/CSL', aliases: ['MEHL', 'MYANMAR ECONOMIC HOLDINGS'] },
];

const SOURCE_VERSION = 'csl-fallback-v1';
let cachedList: typeof CSL_FALLBACK_ENTRIES | null = null;

export function normalizeQuery(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCachedList(): typeof CSL_FALLBACK_ENTRIES {
  if (!cachedList) {
    cachedList = CSL_FALLBACK_ENTRIES;
  }
  return cachedList;
}

function matchesEntry(normalized: string, entry: (typeof CSL_FALLBACK_ENTRIES)[number]): boolean {
  const candidates = [entry.name, ...entry.aliases].map(normalizeQuery);
  return candidates.some(
    (candidate) =>
      normalized === candidate ||
      normalized.includes(candidate) ||
      candidate.includes(normalized)
  );
}

export function checkSanctions(
  inputQuery: string,
  dataOrigin: 'live' | 'mock-fallback' = 'mock-fallback'
): SanctionsScreeningResult {
  const normalizedQuery = normalizeQuery(inputQuery);
  const list = getCachedList();

  if (!normalizedQuery) {
    return {
      inputQuery,
      normalizedQuery,
      match: false,
      matchedEntries: [],
      source: 'CSL fallback cache',
      sourceVersion: SOURCE_VERSION,
      screenedAt: new Date().toISOString(),
      dataOrigin,
    };
  }

  const matchedEntries = list
    .filter((entry) => matchesEntry(normalizedQuery, entry))
    .map(({ name, source }) => ({ name, source }));

  return {
    inputQuery,
    normalizedQuery,
    match: matchedEntries.length > 0,
    matchedEntries,
    source: 'CSL fallback cache',
    sourceVersion: SOURCE_VERSION,
    screenedAt: new Date().toISOString(),
    dataOrigin,
  };
}
