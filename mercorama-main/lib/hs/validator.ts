// lib/hs/validator.ts
// Validates AI-generated HS codes against WCO HS 2022 reference data.

import { readFileSync } from 'fs';
import path from 'path';

interface HsEntry {
  id: string;
  text: string;
  aggrlevel: number;
  isLeaf: string;
}

interface HsReference {
  results: HsEntry[];
}

type HsLookup = Map<string, string>; // code → description

let _lookup: HsLookup | null = null;

function getLookup(): HsLookup {
  if (_lookup) return _lookup;

  const filePath = path.join(process.cwd(), 'data', 'hs6-reference.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data: HsReference = JSON.parse(raw);

  _lookup = new Map();
  for (const entry of data.results) {
    if (entry.aggrlevel === 6 && entry.isLeaf === '1') {
      _lookup.set(entry.id, entry.text);
    }
  }

  return _lookup;
}

export type ValidationStatus = 'verified' | 'invalid' | 'format_error';

export interface HsValidationResult {
  status: ValidationStatus;
  normalizedCode: string;
  description?: string;
  nearest?: { code: string; description: string }[];
}

// Strip dots/spaces and take first 6 digits
function normalize(code: string): string {
  return code.replace(/[\s.]/g, '').slice(0, 6);
}

function findNearest(lookup: HsLookup, sixDigit: string): { code: string; description: string }[] {
  const chapter = sixDigit.slice(0, 2);
  const heading = sixDigit.slice(0, 4);
  const results: { code: string; description: string }[] = [];

  for (const [code, description] of lookup) {
    if (code.startsWith(heading)) {
      results.push({ code, description });
      if (results.length >= 5) break;
    }
  }

  if (results.length === 0) {
    for (const [code, description] of lookup) {
      if (code.startsWith(chapter)) {
        results.push({ code, description });
        if (results.length >= 5) break;
      }
    }
  }

  return results;
}

export function validateHsCode(rawCode: string): HsValidationResult {
  if (!rawCode || typeof rawCode !== 'string') {
    return { status: 'format_error', normalizedCode: '' };
  }

  const normalized = normalize(rawCode);

  if (!/^\d{6}$/.test(normalized)) {
    return { status: 'format_error', normalizedCode: normalized };
  }

  const lookup = getLookup();
  const description = lookup.get(normalized);

  if (description) {
    return { status: 'verified', normalizedCode: normalized, description };
  }

  const nearest = findNearest(lookup, normalized);
  return { status: 'invalid', normalizedCode: normalized, nearest };
}
