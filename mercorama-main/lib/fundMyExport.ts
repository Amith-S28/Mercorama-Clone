// lib/fundMyExport.ts
// Core types and eligibility matching engine for Fund My Export

import { supabase } from '@/lib/supabase';
import { callClaudeHaiku, parseClaudeJSON } from '@/lib/claude';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FundingContext {
  sector?: string;
  hsChapter?: string;
  targetMarket?: string;
  province?: string;
  dealValue?: number;
  buyerType?: string;
  productDescription?: string;
}

export interface FundingProgram {
  id: string;
  slug: string;
  name: string;
  provider: string;
  program_type: 'grant' | 'loan' | 'insurance' | 'guarantee' | 'advisory';
  description: string;
  eligible_sectors: string[];
  eligible_countries: string[];
  min_revenue_cad: number | null;
  max_revenue_cad: number | null;
  min_employees: number | null;
  max_employees: number | null;
  min_export_value: number | null;
  max_export_value: number | null;
  is_sme_only: boolean;
  requires_fta: boolean;
  fta_countries: string[];
  website_url: string;
  is_active: boolean;
}

export interface FundingMatch {
  program: FundingProgram;
  match_score: number;       // 0–100
  match_reasons: string[];
  ai_snippet: string;        // 2-sentence AI explanation tailored to the user's context
}

export interface FundingQuery {
  sector: string;
  destination_country: string;
  revenue_cad: number | null;
  employees: number | null;
  export_value_usd: number | null;
  product_description: string;
  has_fta: boolean;
}

export interface FundingMatchResult {
  matches: FundingMatch[];
  total_found: number;
  query_summary: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().trim();
}

function sectorOverlap(programSectors: string[], querySector: string): boolean {
  if (programSectors.length === 0) return true;
  const q = normalise(querySector);
  return programSectors.some(
    (s) => normalise(s).includes(q) || q.includes(normalise(s))
  );
}

function countryOverlap(
  programCountries: string[],
  queryCountry: string
): boolean {
  if (programCountries.length === 0) return true;
  const q = normalise(queryCountry);
  return programCountries.some(
    (c) => normalise(c).includes(q) || q.includes(normalise(c))
  );
}

function scoreProgram(program: FundingProgram, query: FundingQuery): number {
  let score = 40; // base score for an active match

  // Sector match
  if (sectorOverlap(program.eligible_sectors, query.sector)) score += 20;
  else if (program.eligible_sectors.length > 0) return 0; // hard exclusion

  // Country match
  if (countryOverlap(program.eligible_countries, query.destination_country))
    score += 15;
  // countries is empty = any country — no penalty

  // Revenue range
  if (query.revenue_cad !== null) {
    const aboveMin =
      program.min_revenue_cad === null ||
      query.revenue_cad >= program.min_revenue_cad;
    const belowMax =
      program.max_revenue_cad === null ||
      query.revenue_cad <= program.max_revenue_cad;
    if (!aboveMin || !belowMax) return 0; // hard exclusion
    score += 10;
  }

  // Employee range
  if (query.employees !== null) {
    const aboveMin =
      program.min_employees === null || query.employees >= program.min_employees;
    const belowMax =
      program.max_employees === null || query.employees <= program.max_employees;
    if (!aboveMin || !belowMax) return 0; // hard exclusion
    score += 5;
  }

  // Export value range
  if (query.export_value_usd !== null) {
    const exportCad = query.export_value_usd * 1.35; // rough USD→CAD
    const aboveMin =
      program.min_export_value === null ||
      exportCad >= program.min_export_value;
    const belowMax =
      program.max_export_value === null ||
      exportCad <= program.max_export_value;
    if (!aboveMin || !belowMax) score -= 10;
    else score += 5;
  }

  // FTA bonus
  if (program.requires_fta && query.has_fta) score += 5;
  if (program.requires_fta && !query.has_fta) return 0; // hard exclusion

  return Math.min(100, Math.max(0, score));
}

function buildMatchReasons(
  program: FundingProgram,
  query: FundingQuery
): string[] {
  const reasons: string[] = [];
  if (sectorOverlap(program.eligible_sectors, query.sector))
    reasons.push(`Covers the ${query.sector} sector`);
  if (countryOverlap(program.eligible_countries, query.destination_country))
    reasons.push(`Available for exports to ${query.destination_country}`);
  if (program.program_type === 'grant') reasons.push('Non-repayable grant');
  if (program.program_type === 'insurance')
    reasons.push('Protects against non-payment risk');
  if (program.requires_fta && query.has_fta)
    reasons.push(`Leverages your FTA with ${query.destination_country}`);
  if (program.is_sme_only) reasons.push('Designed for SMEs');
  return reasons;
}

// ─── AI snippet generation ────────────────────────────────────────────────────

async function generateSnippet(
  program: FundingProgram,
  query: FundingQuery
): Promise<string> {
  const prompt = `You are a Canadian export finance advisor. Write exactly 2 concise sentences explaining why the following funding program is relevant for this exporter. Be specific to their context.

Program: ${program.name} (${program.provider})
Description: ${program.description}

Exporter context:
- Sector: ${query.sector}
- Destination: ${query.destination_country}
- Product: ${query.product_description}
- Employees: ${query.employees ?? 'unknown'}
- Revenue (CAD): ${query.revenue_cad ? `$${query.revenue_cad.toLocaleString()}` : 'unknown'}

Respond with a JSON object: {"snippet": "<two sentences>"}`;

  try {
    const raw = await callClaudeHaiku(prompt);
    const parsed = parseClaudeJSON<{ snippet: string }>(raw);
    return parsed.snippet ?? program.description.slice(0, 160);
  } catch {
    return program.description.slice(0, 160);
  }
}

// ─── Main eligibility function ────────────────────────────────────────────────

export async function getFundingMatches(
  query: FundingQuery
): Promise<FundingMatchResult> {
  // Load active programs from Supabase
  const { data: programs, error } = await supabase
    .from('funding_programs')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[mercorama] getFundingMatches DB error:', error.message);
    throw new Error('Failed to load funding programs');
  }

  const rows = (programs ?? []) as FundingProgram[];

  // Score and filter
  const scored: Array<{ program: FundingProgram; score: number }> = rows
    .map((p) => ({ program: p, score: scoreProgram(p, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // cap at 10 results

  // Generate AI snippets (sequential to avoid rate-limits on Haiku)
  const matches: FundingMatch[] = [];
  for (const { program, score } of scored) {
    const snippet = await generateSnippet(program, query);
    matches.push({
      program,
      match_score: score,
      match_reasons: buildMatchReasons(program, query),
      ai_snippet: snippet,
    });
  }

  return {
    matches,
    total_found: scored.length,
    query_summary: `${query.sector} export to ${query.destination_country}`,
  };
}
