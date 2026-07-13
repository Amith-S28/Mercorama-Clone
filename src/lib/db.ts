import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdvisorNote,
  ApiServiceHealth,
  ApiServiceId,
  AssessmentRecord,
  FxRateRecord,
  MarketDataSnapshot,
  OptionKey,
  PillarKey,
  RoadmapBucket,
  RoadmapItem,
  SanctionsScreeningResult,
  SmeRecord,
} from '@/types';

type SmeRow = {
  id: string;
  advisor_id: string;
  name: string;
  province: string;
  industry: SmeRecord['industry'];
  product_description: string;
  hs_code: string;
  export_quantity: number;
  production_cost: number;
  unit_price: number;
  target_profit_margin: number;
  contact_email: string | null;
  primary_contact: string | null;
  website: string | null;
  has_local_agent: boolean;
  employee_range: string | null;
  revenue_range: string | null;
  target_country: string;
  target_country_name: string;
  created_at: string;
};

function mapSme(row: SmeRow): SmeRecord {
  return {
    id: row.id,
    advisorId: row.advisor_id,
    name: row.name,
    province: row.province,
    industry: row.industry,
    productDescription: row.product_description,
    hsCode: row.hs_code,
    exportQuantity: row.export_quantity,
    productionCost: Number(row.production_cost),
    unitPrice: Number(row.unit_price),
    targetProfitMargin: Number(row.target_profit_margin),
    contactEmail: row.contact_email,
    primaryContact: row.primary_contact,
    website: row.website,
    hasLocalAgent: row.has_local_agent,
    employeeRange: row.employee_range,
    revenueRange: row.revenue_range,
    targetCountry: row.target_country,
    targetCountryName: row.target_country_name,
    createdAt: row.created_at,
  };
}

export async function createSme(
  client: SupabaseClient,
  advisorId: string,
  input: Omit<SmeRecord, 'id' | 'advisorId' | 'createdAt'>
): Promise<SmeRecord> {
  const { data, error } = await client
    .from('client_smes')
    .insert({
      advisor_id: advisorId,
      name: input.name,
      province: input.province,
      industry: input.industry,
      product_description: input.productDescription,
      hs_code: input.hsCode,
      export_quantity: input.exportQuantity,
      production_cost: input.productionCost,
      unit_price: input.unitPrice,
      target_profit_margin: input.targetProfitMargin,
      contact_email: input.contactEmail,
      primary_contact: input.primaryContact,
      website: input.website,
      has_local_agent: input.hasLocalAgent,
      employee_range: input.employeeRange,
      revenue_range: input.revenueRange,
      target_country: input.targetCountry,
      target_country_name: input.targetCountryName,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapSme(data as SmeRow);
}

export async function getSmeById(
  client: SupabaseClient,
  id: string
): Promise<SmeRecord | null> {
  const { data, error } = await client.from('client_smes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSme(data as SmeRow) : null;
}

export async function listSmesForAdvisor(
  client: SupabaseClient,
  advisorId: string
): Promise<SmeRecord[]> {
  const { data, error } = await client
    .from('client_smes')
    .select('*')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as SmeRow[]).map(mapSme);
}

export async function createAssessment(
  client: SupabaseClient,
  input: {
    smeId: string;
    overallScore: number;
    grade: AssessmentRecord['grade'];
    pillarScores: Record<PillarKey, number>;
    answers: Record<string, OptionKey>;
    selectedQuestions: string[];
    aiReport?: AssessmentRecord['aiReport'];
  }
): Promise<AssessmentRecord> {
  const { data, error } = await client
    .from('client_readiness_assessments')
    .insert({
      sme_id: input.smeId,
      overall_score: input.overallScore,
      grade: input.grade,
      pillar_scores: input.pillarScores,
      answers: input.answers,
      selected_questions: input.selectedQuestions,
      ai_report: input.aiReport ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  const row = data as {
    id: string;
    sme_id: string;
    overall_score: number;
    grade: AssessmentRecord['grade'];
    pillar_scores: Record<PillarKey, number>;
    answers: Record<string, OptionKey>;
    selected_questions: string[];
    ai_report: AssessmentRecord['aiReport'];
    created_at: string;
  };
  return {
    id: row.id,
    smeId: row.sme_id,
    overallScore: Number(row.overall_score),
    grade: row.grade,
    pillarScores: row.pillar_scores,
    answers: row.answers,
    selectedQuestions: row.selected_questions,
    aiReport: row.ai_report,
    createdAt: row.created_at,
  };
}

export async function getAssessmentBySmeId(
  client: SupabaseClient,
  smeId: string
): Promise<AssessmentRecord | null> {
  const { data, error } = await client
    .from('client_readiness_assessments')
    .select('*')
    .eq('sme_id', smeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as {
    id: string;
    sme_id: string;
    overall_score: number;
    grade: AssessmentRecord['grade'];
    pillar_scores: Record<PillarKey, number>;
    answers: Record<string, OptionKey>;
    selected_questions: string[];
    ai_report: AssessmentRecord['aiReport'];
    created_at: string;
  };
  return {
    id: row.id,
    smeId: row.sme_id,
    overallScore: Number(row.overall_score),
    grade: row.grade,
    pillarScores: row.pillar_scores,
    answers: row.answers,
    selectedQuestions: row.selected_questions,
    aiReport: row.ai_report,
    createdAt: row.created_at,
  };
}

export async function upsertMarketDataCache(
  client: SupabaseClient,
  snapshot: Omit<MarketDataSnapshot, 'dataOrigin'>
): Promise<void> {
  const { error } = await client.from('market_data_cache').upsert({
    hs_code: snapshot.hsCode,
    country: snapshot.country,
    source: snapshot.source,
    payload: snapshot.payload,
    last_synced_at: snapshot.lastSyncedAt,
    ttl_seconds: snapshot.ttlSeconds,
  });
  if (error) throw error;
}

export async function getMarketDataCache(
  client: SupabaseClient,
  hsCode: string,
  country: string,
  source: string
): Promise<MarketDataSnapshot | null> {
  const { data, error } = await client
    .from('market_data_cache')
    .select('*')
    .eq('hs_code', hsCode)
    .eq('country', country)
    .eq('source', source)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as {
    hs_code: string;
    country: string;
    source: string;
    payload: Record<string, unknown>;
    last_synced_at: string;
    ttl_seconds: number;
  };
  return {
    hsCode: row.hs_code,
    country: row.country,
    source: row.source,
    payload: row.payload,
    lastSyncedAt: row.last_synced_at,
    ttlSeconds: row.ttl_seconds,
    dataOrigin: 'cache',
  };
}

export async function logSanctionsScreening(
  client: SupabaseClient,
  advisorId: string,
  result: SanctionsScreeningResult
): Promise<void> {
  const { error } = await client.from('sanctions_screening_log').insert({
    advisor_id: advisorId,
    input_query: result.inputQuery,
    matched_entries: result.matchedEntries,
    source: result.source,
    source_version: result.sourceVersion,
    screened_at: result.screenedAt,
  });
  if (error) throw error;
}

export async function upsertFxRate(
  client: SupabaseClient,
  record: FxRateRecord
): Promise<void> {
  const { error } = await client.from('fx_rate_cache').upsert({
    base_currency: record.baseCurrency,
    target_currency: record.targetCurrency,
    rate: record.rate,
    volatility_30d: record.volatility30d,
    volatility_90d: record.volatility90d,
    fetched_at: record.fetchedAt,
  });
  if (error) throw error;
}

export async function getFxRate(
  client: SupabaseClient,
  base: string,
  target: string
): Promise<FxRateRecord | null> {
  const { data, error } = await client
    .from('fx_rate_cache')
    .select('*')
    .eq('base_currency', base)
    .eq('target_currency', target)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as {
    base_currency: string;
    target_currency: string;
    rate: number;
    volatility_30d: number | null;
    volatility_90d: number | null;
    fetched_at: string;
  };
  return {
    baseCurrency: row.base_currency,
    targetCurrency: row.target_currency,
    rate: Number(row.rate),
    volatility30d: row.volatility_30d,
    volatility90d: row.volatility_90d,
    fetchedAt: row.fetched_at,
  };
}

export async function createAdvisorNote(
  client: SupabaseClient,
  note: Omit<AdvisorNote, 'id' | 'updatedAt'>
): Promise<AdvisorNote> {
  const { data, error } = await client
    .from('advisor_notes')
    .upsert({
      assessment_id: note.assessmentId,
      advisor_id: note.advisorId,
      pillar: note.pillar,
      content: note.content,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  const row = data as {
    id: string;
    assessment_id: string;
    advisor_id: string;
    pillar: string;
    content: string;
    updated_at: string;
  };
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    advisorId: row.advisor_id,
    pillar: row.pillar,
    content: row.content,
    updatedAt: row.updated_at,
  };
}

export async function getNotesForAssessment(
  client: SupabaseClient,
  assessmentId: string
): Promise<AdvisorNote[]> {
  const { data, error } = await client
    .from('advisor_notes')
    .select('*')
    .eq('assessment_id', assessmentId);
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    assessment_id: string;
    advisor_id: string;
    pillar: string;
    content: string;
    updated_at: string;
  }>).map((row) => ({
    id: row.id,
    assessmentId: row.assessment_id,
    advisorId: row.advisor_id,
    pillar: row.pillar,
    content: row.content,
    updatedAt: row.updated_at,
  }));
}

export async function createRoadmapItem(
  client: SupabaseClient,
  item: Omit<RoadmapItem, 'id' | 'createdAt'>
): Promise<RoadmapItem> {
  const { data, error } = await client
    .from('roadmap_items')
    .insert({
      assessment_id: item.assessmentId,
      advisor_id: item.advisorId,
      task: item.task,
      bucket: item.bucket,
      sort_order: item.sortOrder,
      completed: item.completed,
    })
    .select('*')
    .single();
  if (error) throw error;
  const row = data as {
    id: string;
    assessment_id: string;
    advisor_id: string;
    task: string;
    bucket: RoadmapBucket;
    sort_order: number;
    completed: boolean;
    created_at: string;
  };
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    advisorId: row.advisor_id,
    task: row.task,
    bucket: row.bucket,
    sortOrder: row.sort_order,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

export async function updateRoadmapItem(
  client: SupabaseClient,
  id: string,
  patch: Partial<Pick<RoadmapItem, 'task' | 'bucket' | 'sortOrder' | 'completed'>>
): Promise<RoadmapItem> {
  const { data, error } = await client
    .from('roadmap_items')
    .update({
      ...(patch.task !== undefined ? { task: patch.task } : {}),
      ...(patch.bucket !== undefined ? { bucket: patch.bucket } : {}),
      ...(patch.sortOrder !== undefined ? { sort_order: patch.sortOrder } : {}),
      ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  const row = data as {
    id: string;
    assessment_id: string;
    advisor_id: string;
    task: string;
    bucket: RoadmapBucket;
    sort_order: number;
    completed: boolean;
    created_at: string;
  };
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    advisorId: row.advisor_id,
    task: row.task,
    bucket: row.bucket,
    sortOrder: row.sort_order,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

export async function getRoadmapItems(
  client: SupabaseClient,
  assessmentId: string
): Promise<RoadmapItem[]> {
  const { data, error } = await client
    .from('roadmap_items')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    assessment_id: string;
    advisor_id: string;
    task: string;
    bucket: RoadmapBucket;
    sort_order: number;
    completed: boolean;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    assessmentId: row.assessment_id,
    advisorId: row.advisor_id,
    task: row.task,
    bucket: row.bucket,
    sortOrder: row.sort_order,
    completed: row.completed,
    createdAt: row.created_at,
  }));
}

export async function getApiHealthStatuses(
  client: SupabaseClient
): Promise<ApiServiceHealth[]> {
  const { data, error } = await client.from('api_health_status').select('*');
  if (error) throw error;
  return ((data ?? []) as Array<{
    service_id: ApiServiceId;
    status: ApiServiceHealth['status'];
    last_checked_at: string | null;
    last_success_at: string | null;
    latency_ms: number | null;
    error: string | null;
    is_key_configured: boolean;
  }>).map((row) => ({
    serviceId: row.service_id,
    status: row.status,
    lastCheckedAt: row.last_checked_at,
    lastSuccessAt: row.last_success_at,
    latencyMs: row.latency_ms,
    error: row.error,
    isKeyConfigured: row.is_key_configured,
  }));
}

export async function upsertApiHealthStatus(
  client: SupabaseClient,
  status: ApiServiceHealth
): Promise<void> {
  const { error } = await client.from('api_health_status').upsert({
    service_id: status.serviceId,
    status: status.status,
    last_checked_at: status.lastCheckedAt,
    last_success_at: status.lastSuccessAt,
    latency_ms: status.latencyMs,
    error: status.error,
    is_key_configured: status.isKeyConfigured,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
