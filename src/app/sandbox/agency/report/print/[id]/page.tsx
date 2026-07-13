import { notFound } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/env';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  getInMemoryAssessmentById,
  getInMemoryAssessmentBySmeId,
  getInMemorySmeById,
} from '@/lib/in-memory-store';
import { calculateLandedCost } from '@/lib/landed-cost-calculator';
import { getCountryFallback } from '@/lib/mock-fallback-data';
import { PILLAR_LABELS, gradeColor, gradeLabel } from '@/lib/scoring-engine';
import { mapDbAssessmentToRecord, mapDbSmeToRecord } from '@/lib/sme-db';
import type { CSSProperties } from 'react';
import type { AssessmentRecord, PillarKey, SmeRecord } from '@/types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PrintReportPageProps {
  params: Promise<{ id: string }>;
}

async function resolveReportData(id: string): Promise<{
  assessment: AssessmentRecord;
  sme: SmeRecord;
} | null> {
  if (!UUID_RE.test(id)) return null;

  if (!isSupabaseConfigured()) {
    const assessment =
      getInMemoryAssessmentById(id) ?? getInMemoryAssessmentBySmeId(id);
    if (!assessment) return null;
    const sme = getInMemorySmeById(assessment.smeId);
    if (!sme) return null;
    return { assessment, sme };
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: assessmentRow } = await supabase
      .from('client_readiness_assessments')
      .select('*')
      .or(`id.eq.${id},sme_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentRow) {
      const assessment = mapDbAssessmentToRecord(assessmentRow);
      const { data: smeRow } = await supabase
        .from('client_smes')
        .select('*')
        .eq('id', assessment.smeId)
        .maybeSingle();
      if (smeRow) {
        return { assessment, sme: mapDbSmeToRecord(smeRow) };
      }
    }

    const { data: smeOnly } = await supabase
      .from('client_smes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (smeOnly) {
      const sme = mapDbSmeToRecord(smeOnly);
      const assessment = getInMemoryAssessmentBySmeId(sme.id);
      if (assessment) return { assessment, sme };
    }
  } catch {
    // fall through to in-memory
  }

  const assessment =
    getInMemoryAssessmentById(id) ?? getInMemoryAssessmentBySmeId(id);
  if (!assessment) return null;
  const sme = getInMemorySmeById(assessment.smeId);
  if (!sme) return null;
  return { assessment, sme };
}

export default async function PrintReportPage({ params }: PrintReportPageProps) {
  const { id } = await params;
  const data = await resolveReportData(id);
  if (!data) notFound();

  const { assessment, sme } = data;
  const country = getCountryFallback(sme.targetCountry);
  const landed = calculateLandedCost({
    productionCost: sme.productionCost,
    unitPrice: sme.unitPrice,
    exportQuantity: sme.exportQuantity,
    targetProfitMargin: sme.targetProfitMargin,
    containerRateCad: country.freightRateCadPerFeu,
    tariffRate: country.tariffRateDefault,
    volatility30d: country.volatility30d,
    volatility90d: country.volatility90d,
  });

  const pillars = Object.keys(PILLAR_LABELS) as PillarKey[];
  const roadmapItems =
    assessment.aiReport?.actions.map((a) => a.task) ?? [
      'Validate landed cost assumptions with target market freight quotes',
      'Complete sanctions screening for distributor shortlist',
      'Register with Trade Commissioner Service market entry program',
      'Document export SOPs and assign cross-trained backup owner',
    ];

  return (
    <>
      <style>{`
        @media print {
          aside,
          nav,
          .app-shell > :first-child,
          .agency-sidebar {
            display: none !important;
          }
          .main-content,
          .print-report-shell {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          .print-report-page {
            box-shadow: none !important;
            margin: 0 !important;
          }
        }

        .print-report-shell {
          background: var(--paper-white, #fff);
          min-height: 100vh;
        }

        .print-report-page {
          --print-ink: var(--obsidian, #0a0a0a);
          --print-muted: rgba(10, 10, 10, 0.55);
          --print-border: var(--border-light, #e5e5e5);
          --print-accent: var(--accent, #2563eb);
          color: var(--print-ink);
          font-family: var(--font-outfit, system-ui, sans-serif);
          max-width: 210mm;
          margin: 0 auto;
          padding: 12mm 14mm;
          background: var(--paper-white, #fff);
        }

        .print-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10mm;
        }

        .print-card {
          border: 1px solid var(--print-border);
          border-radius: 8px;
          padding: 5mm;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
        }

        .print-table th,
        .print-table td {
          border-bottom: 1px solid var(--print-border);
          padding: 2.5mm 2mm;
          text-align: left;
        }

        .print-table th {
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--print-muted);
        }

        .sanctions-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3mm 4mm;
          border-radius: 999px;
          font-size: 9pt;
          font-weight: 600;
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }

        .score-ring {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid var(--grade-color);
          font-weight: 700;
        }

        @media (max-width: 720px) {
          .print-columns {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <article className="print-report-page">
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--print-border)',
            paddingBottom: '6mm',
            marginBottom: '8mm',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '8pt',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--print-muted)',
              }}
            >
              Export Readiness Assessment
            </p>
            <h1 style={{ margin: '2mm 0 0', fontSize: '18pt', fontWeight: 700 }}>
              {sme.name}
            </h1>
            <p style={{ margin: '2mm 0 0', fontSize: '10pt', color: 'var(--print-muted)' }}>
              {sme.province} · {sme.industry} · HS {sme.hsCode}
            </p>
            <p style={{ margin: '1mm 0 0', fontSize: '10pt', color: 'var(--print-muted)' }}>
              Target market: {sme.targetCountryName} ({sme.targetCountry})
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: 'var(--print-muted)' }}>
            <div>Assessment ID</div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {assessment.id.slice(0, 8)}…
            </div>
            <div style={{ marginTop: '2mm' }}>
              {new Date(assessment.createdAt).toLocaleDateString('en-CA')}
            </div>
          </div>
        </header>

        <section
          style={{
            display: 'flex',
            gap: '8mm',
            alignItems: 'center',
            marginBottom: '8mm',
          }}
        >
          <div
            className="score-ring"
            style={{ '--grade-color': gradeColor(assessment.grade) } as CSSProperties}
          >
            <span style={{ fontSize: '20pt', lineHeight: 1 }}>{assessment.grade}</span>
            <span style={{ fontSize: '7pt', color: 'var(--print-muted)' }}>
              {gradeLabel(assessment.grade)}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '28pt', fontWeight: 700, lineHeight: 1 }}>
              {assessment.overallScore.toFixed(1)}
              <span style={{ fontSize: '12pt', color: 'var(--print-muted)' }}>%</span>
            </div>
            <p style={{ margin: '2mm 0 0', fontSize: '10pt', color: 'var(--print-muted)' }}>
              Overall export readiness score (weighted across 9 pillars)
            </p>
            {assessment.aiReport?.summary ? (
              <p style={{ margin: '3mm 0 0', fontSize: '9pt', maxWidth: '120mm' }}>
                {assessment.aiReport.summary}
              </p>
            ) : null}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className="sanctions-badge">
              {country.sanctionsClear ? '✓ Sanctions Clear' : '⚠ Review Required'}
            </span>
          </div>
        </section>

        <div className="print-columns">
          <section className="print-card">
            <h2 style={{ margin: '0 0 4mm', fontSize: '11pt' }}>Pillar Scorecard</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Pillar</th>
                  <th style={{ textAlign: 'right' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {pillars.map((pillar) => (
                  <tr key={pillar}>
                    <td>{PILLAR_LABELS[pillar]}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {assessment.pillarScores[pillar].toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="print-card">
            <h2 style={{ margin: '0 0 4mm', fontSize: '11pt' }}>Landed Cost Summary</h2>
            <table className="print-table">
              <tbody>
                <tr>
                  <td>Unit production cost</td>
                  <td style={{ textAlign: 'right' }}>${sme.productionCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Unit freight (allocated)</td>
                  <td style={{ textAlign: 'right' }}>${landed.unitFreightCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Broker fee</td>
                  <td style={{ textAlign: 'right' }}>${landed.brokerFee.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Insurance fee</td>
                  <td style={{ textAlign: 'right' }}>${landed.insuranceFee.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Tariff per unit</td>
                  <td style={{ textAlign: 'right' }}>${landed.tariffPerUnit.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Landed cost / unit</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ${landed.landedCost.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>Actual margin</td>
                  <td style={{ textAlign: 'right' }}>{landed.actualMargin.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>FX buffer applied</td>
                  <td style={{ textAlign: 'right' }}>{landed.fxBufferUsed.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td>Currency-adjusted margin</td>
                  <td style={{ textAlign: 'right' }}>{landed.currencyAdjustedMargin.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
            {landed.warning ? (
              <p
                style={{
                  margin: '3mm 0 0',
                  fontSize: '8pt',
                  color: landed.insolvent ? '#b91c1c' : '#b45309',
                }}
              >
                {landed.warning}
              </p>
            ) : null}
          </section>
        </div>

        <section className="print-card" style={{ marginTop: '8mm' }}>
          <h2 style={{ margin: '0 0 4mm', fontSize: '11pt' }}>90-Day Roadmap</h2>
          <ul style={{ margin: 0, paddingLeft: '5mm', fontSize: '9pt', lineHeight: 1.5 }}>
            {roadmapItems.map((task) => (
              <li key={task} style={{ marginBottom: '2mm' }}>
                {task}
              </li>
            ))}
          </ul>
        </section>

        <footer
          style={{
            marginTop: '10mm',
            paddingTop: '4mm',
            borderTop: '1px solid var(--print-border)',
            fontSize: '7pt',
            color: 'var(--print-muted)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Trade Agency Sandbox · Confidential advisory brief</span>
          <span>Generated {new Date().toLocaleString('en-CA')}</span>
        </footer>
      </article>
    </>
  );
}
