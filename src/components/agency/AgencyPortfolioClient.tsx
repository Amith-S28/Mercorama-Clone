'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardList, Loader2 } from '@/components/ui/icons';
import type { AssessmentRecord, SmeRecord } from '@/types';
import { gradeColor, gradeLabel } from '@/lib/scoring-engine';
import { useGsapStagger, useGsapCounter } from '@/hooks';
import { VantaNetBackground } from '@/components/ambient/VantaNetBackground';
import { QuestionnaireWizard } from '@/components/questionnaire/QuestionnaireWizard';

export function AgencyPortfolioClient() {
  const [smes, setSmes] = useState<SmeRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardSmeId, setWizardSmeId] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const [smeRes, assessRes] = await Promise.all([
        fetch('/api/sme'),
        fetch('/api/assessment'),
      ]);
      setSmes((await smeRes.json()) as SmeRecord[]);
      setAssessments((await assessRes.json()) as AssessmentRecord[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  const assessmentBySme = useMemo(() => {
    const map = new Map<string, AssessmentRecord>();
    assessments.forEach((a) => {
      if (!map.has(a.smeId)) map.set(a.smeId, a);
    });
    return map;
  }, [assessments]);

  const avgScore = useMemo(() => {
    const scored = assessments.filter((a) => a.overallScore > 0);
    if (scored.length === 0) return null;
    return scored.reduce((sum, a) => sum + a.overallScore, 0) / scored.length;
  }, [assessments]);

  const cardsRef = useGsapStagger<HTMLDivElement>({
    staggerEach: 0.08,
    delay: 0.1,
    direction: 'up',
    distance: 24,
    triggerValue: smes.length,
  });

  const { ref: activeClientsRef, value: activeClientsValue } = useGsapCounter<HTMLParagraphElement>({ end: smes.length });
  const { ref: avgScoreRef, value: avgScoreValue } = useGsapCounter<HTMLParagraphElement>({ 
    end: avgScore || 0, 
    decimals: 1 
  });

  return (
    <div className="page-container">
          <header style={{ 
            marginBottom: '2rem', 
            position: 'relative', 
            padding: '2.5rem', 
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            background: 'linear-gradient(to right, var(--success-muted), var(--surface-muted))',
            boxShadow: '0 4px 20px -2px rgba(1, 105, 111, 0.05)',
          }}>
            <VantaNetBackground />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                Sandbox
              </p>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                Portfolio
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '36rem' }}>
                Manage SME export readiness assessments and track market intelligence across your
                advisory portfolio.
              </p>
            </div>
          </header>

          <div className="shipping-lane" style={{ marginBottom: '2rem' }} aria-hidden />

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <Loader2 size={18} className="animate-spin" />
              Loading portfolio…
            </div>
          ) : (
            <>
              <div className="bento-grid" style={{ marginBottom: '2rem' }}>
                <div className="bento-card bento-card--span-6">
                  <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                    Active Clients
                  </p>
                  <p ref={activeClientsRef} style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>
                    {activeClientsValue}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    {assessments.length} completed assessment{assessments.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="bento-card bento-card--span-6">
                  <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                    Avg. Readiness
                  </p>
                  <p ref={avgScoreRef} style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>
                    {avgScore !== null ? avgScoreValue : '—'}
                  </p>
                  <div className="progress-track" style={{ marginTop: '1rem' }}>
                    <div
                      className="progress-fill"
                      style={{ width: avgScore !== null ? `${Math.min(100, avgScore)}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>

              <div className="bento-grid" ref={cardsRef}>
                {smes.map((sme) => {
                  const assessment = assessmentBySme.get(sme.id);
                  const pending = !assessment;

                  return (
                    <div
                      key={sme.id}
                      className="bento-card bento-card--span-6 opacity-0"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                            {sme.province}
                          </p>
                          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{sme.name}</h2>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {sme.industry} · {sme.targetCountryName}
                          </p>
                        </div>
                        {assessment ? (
                          <div style={{ textAlign: 'right' }}>
                            <span
                              className="mono-label"
                              style={{
                                fontSize: '1.25rem',
                                color: gradeColor(assessment.grade),
                              }}
                            >
                              {assessment.grade}
                            </span>
                            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              {assessment.overallScore.toFixed(1)}
                            </p>
                          </div>
                        ) : (
                          <span
                            className="mono-label"
                            style={{
                              fontSize: '0.625rem',
                              color: '#F59E0B',
                              border: '1px solid #F59E0B',
                              borderRadius: '9999px',
                              padding: '0.25rem 0.5rem',
                              alignSelf: 'flex-start',
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </div>

                      {pending ? (
                        <div style={{ marginTop: '0.5rem' }}>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            Assessment required before report generation.
                          </p>
                          {wizardSmeId === sme.id ? (
                            <QuestionnaireWizard
                              smeId={sme.id}
                              onComplete={() => {
                                setWizardSmeId(null);
                                void loadPortfolio();
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setWizardSmeId(sme.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 0.875rem',
                                borderRadius: '9999px',
                                border: '1px solid var(--border-low-contrast)',
                                background: 'var(--accent-muted)',
                                color: 'var(--accent-premium)',
                                fontFamily: 'var(--font-outfit)',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <ClipboardList size={14} />
                              Start questionnaire
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            {gradeLabel(assessment.grade)} · HS {sme.hsCode}
                          </p>
                          <Link
                            href={`/sandbox/agency/report?id=${sme.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.5rem 0.875rem',
                              borderRadius: '9999px',
                              border: '1px solid var(--border-low-contrast)',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                            }}
                          >
                            Open report
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
    </div>
  );
}
