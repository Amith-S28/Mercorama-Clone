// lib/fundingSync.ts
// Weekly sync: AI-assisted scrape-and-diff for funding_programs

import { createServiceClient } from '@/lib/supabase';
import { callClaudeHaiku, parseClaudeJSON } from '@/lib/claude';
import type { FundingProgram } from './fundMyExport';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedProgram {
  slug: string;
  name: string;
  provider: string;
  program_type: string;
  description: string;
  website_url: string;
  is_active: boolean;
}

interface SyncChange {
  slug: string;
  change_type: 'new' | 'updated' | 'deactivated';
  old_data: Partial<FundingProgram> | null;
  new_data: ScrapedProgram | null;
}

// ─── Scrape via Claude ────────────────────────────────────────────────────────

/**
 * Asks Claude Haiku to verify whether a program is still active and return
 * a lightweight summary. In production, this would be combined with real
 * web-fetch results piped into the prompt.
 */
async function verifyProgram(
  program: FundingProgram
): Promise<ScrapedProgram> {
  const prompt = `You are a Canadian export finance data curator. Based on your training data, provide an updated summary for the following funding program. If you have no reason to believe it has changed, echo the existing data.

Existing data:
Name: ${program.name}
Provider: ${program.provider}
Type: ${program.program_type}
Description: ${program.description}
URL: ${program.website_url}
Active: ${program.is_active}

Respond ONLY with a JSON object matching this exact structure:
{
  "slug": "${program.slug}",
  "name": "...",
  "provider": "...",
  "program_type": "grant|loan|insurance|guarantee|advisory",
  "description": "...",
  "website_url": "...",
  "is_active": true|false
}`;

  try {
    const raw = await callClaudeHaiku(prompt);
    const parsed = parseClaudeJSON<ScrapedProgram>(raw);
    return { ...parsed, slug: program.slug }; // always preserve slug
  } catch {
    // On parse failure, return existing data as-is
    return {
      slug: program.slug,
      name: program.name,
      provider: program.provider,
      program_type: program.program_type,
      description: program.description,
      website_url: program.website_url,
      is_active: program.is_active,
    };
  }
}

// ─── Diff ─────────────────────────────────────────────────────────────────────

function hasChanged(
  existing: FundingProgram,
  scraped: ScrapedProgram
): boolean {
  return (
    existing.name !== scraped.name ||
    existing.provider !== scraped.provider ||
    existing.description !== scraped.description ||
    existing.website_url !== scraped.website_url ||
    existing.is_active !== scraped.is_active
  );
}

// ─── Main sync function ───────────────────────────────────────────────────────

export async function scrapeAndDiff(): Promise<SyncChange[]> {
  const supabase = createServiceClient();

  const { data: programs, error } = await supabase
    .from('funding_programs')
    .select('*');

  if (error) {
    console.error('[mercorama] scrapeAndDiff fetch error:', error.message);
    throw new Error('Failed to load funding programs for sync');
  }

  const rows = (programs ?? []) as FundingProgram[];
  const changes: SyncChange[] = [];

  for (const program of rows) {
    const scraped = await verifyProgram(program);

    if (hasChanged(program, scraped)) {
      changes.push({
        slug: program.slug,
        change_type: scraped.is_active ? 'updated' : 'deactivated',
        old_data: {
          name: program.name,
          provider: program.provider,
          description: program.description,
          website_url: program.website_url,
          is_active: program.is_active,
        },
        new_data: scraped,
      });
    }
  }

  return changes;
}

// ─── Weekly sync orchestrator ─────────────────────────────────────────────────

export async function runWeeklySync(): Promise<{
  changes_found: number;
  sync_log_id: string;
}> {
  const supabase = createServiceClient();

  // Open log entry
  const { data: logEntry, error: logError } = await supabase
    .from('funding_sync_log')
    .insert({ status: 'running', programs_checked: 0, changes_found: 0 })
    .select('id')
    .single();

  if (logError || !logEntry) {
    console.error('[mercorama] Failed to create sync log entry:', logError?.message);
    throw new Error('Could not create sync log entry');
  }

  const syncLogId = logEntry.id as string;

  try {
    const { data: programs } = await supabase
      .from('funding_programs')
      .select('id')
      .eq('is_active', true);

    const programCount = programs?.length ?? 0;
    const changes = await scrapeAndDiff();

    // Write pending change records
    for (const change of changes) {
      const { data: program } = await supabase
        .from('funding_programs')
        .select('id')
        .eq('slug', change.slug)
        .single();

      if (!program) continue;

      await supabase.from('funding_program_changes').insert({
        program_id: program.id,
        change_type: change.change_type,
        old_data: change.old_data,
        new_data: change.new_data,
        approved: false,
      });
    }

    // Update log to success
    await supabase
      .from('funding_sync_log')
      .update({
        finished_at: new Date().toISOString(),
        programs_checked: programCount,
        changes_found: changes.length,
        status: 'success',
      })
      .eq('id', syncLogId);

    return { changes_found: changes.length, sync_log_id: syncLogId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from('funding_sync_log')
      .update({
        finished_at: new Date().toISOString(),
        status: 'failed',
        error_message: message,
      })
      .eq('id', syncLogId);
    throw err;
  }
}

// ─── Admin: approve a pending change ─────────────────────────────────────────

export async function approvePendingChange(
  changeId: string,
  approvedBy: string
): Promise<void> {
  const supabase = createServiceClient();

  // Fetch the pending change
  const { data: change, error: fetchError } = await supabase
    .from('funding_program_changes')
    .select('*')
    .eq('id', changeId)
    .single();

  if (fetchError || !change) {
    throw new Error(`Change ${changeId} not found`);
  }

  const newData = change.new_data as ScrapedProgram | null;
  if (!newData) throw new Error('No new_data on change record');

  // Apply the change to funding_programs
  await supabase
    .from('funding_programs')
    .update({
      name: newData.name,
      provider: newData.provider,
      description: newData.description,
      website_url: newData.website_url,
      is_active: newData.is_active,
    })
    .eq('slug', newData.slug);

  // Mark change as approved
  await supabase
    .from('funding_program_changes')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', changeId);
}
