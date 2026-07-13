import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface HsSearchResult {
  code: string;
  description: string;
}

const CACHE_KEY = '__holygrail_hs_nomenclature_cache__';

function parseCSVLine(line: string) {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function getNomenclature(): HsSearchResult[] {
  const globalCache = globalThis as typeof globalThis & {
    [CACHE_KEY]?: HsSearchResult[];
  };
  if (!globalCache[CACHE_KEY]) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'hs_codes.csv');
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      const entries: HsSearchResult[] = [];
      for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (fields.length < 2) continue;
        entries.push({ code: fields[0], description: fields[1] });
      }
      globalCache[CACHE_KEY] = entries;
    } catch (err) {
      console.error('Failed to load hs_codes.csv:', err);
      globalCache[CACHE_KEY] = [];
    }
  }
  return globalCache[CACHE_KEY]!;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';
  const entries = getNomenclature();

  if (!q) {
    return NextResponse.json(entries);
  }

  const normalizedCode = q.replace(/[\s.]/g, '');
  const isCodeQuery = /^\d+$/.test(normalizedCode);
  const tokens = q.split(/\s+/).filter(Boolean);

  const prefixMatches: HsSearchResult[] = [];
  const otherMatches: HsSearchResult[] = [];

  for (const entry of entries) {
    if (isCodeQuery) {
      if (entry.code.startsWith(normalizedCode)) {
        prefixMatches.push(entry);
      } else if (entry.code.includes(normalizedCode)) {
        otherMatches.push(entry);
      }
    } else {
      const desc = entry.description.toLowerCase();
      const descMatch = tokens.every((t) => {
        const stem = t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t;
        return desc.includes(stem);
      });
      if (descMatch) {
        otherMatches.push(entry);
      }
    }
  }

  const results = [...prefixMatches, ...otherMatches];
  return NextResponse.json(results);
}
