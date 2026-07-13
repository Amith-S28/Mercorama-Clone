import type { AssessmentRecord, SmeRecord } from '@/types';

export interface DbSmeRow {
  id: string;
  advisor_id: string;
  name: string;
  province: string;
  industry: string;
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
}

export interface DbAssessmentRow {
  id: string;
  sme_id: string;
  overall_score: number;
  grade: string;
  pillar_scores: Record<string, number>;
  answers: Record<string, string>;
  selected_questions: string[];
  ai_report: unknown | null;
  created_at: string;
}

export function mapDbSmeToRecord(row: DbSmeRow): SmeRecord {
  return {
    id: row.id,
    advisorId: row.advisor_id,
    name: row.name,
    province: row.province,
    industry: row.industry as SmeRecord['industry'],
    productDescription: row.product_description,
    hsCode: row.hs_code,
    exportQuantity: Number(row.export_quantity),
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

export function mapSmeToDbInsert(
  input: Omit<SmeRecord, 'createdAt'>
): Omit<DbSmeRow, 'created_at'> {
  return {
    id: input.id,
    advisor_id: input.advisorId,
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
  };
}

export function mapDbAssessmentToRecord(row: DbAssessmentRow): AssessmentRecord {
  return {
    id: row.id,
    smeId: row.sme_id,
    overallScore: Number(row.overall_score),
    grade: row.grade as AssessmentRecord['grade'],
    pillarScores: row.pillar_scores as AssessmentRecord['pillarScores'],
    answers: row.answers as AssessmentRecord['answers'],
    selectedQuestions: row.selected_questions,
    aiReport: (row.ai_report as AssessmentRecord['aiReport']) ?? null,
    createdAt: row.created_at,
  };
}
