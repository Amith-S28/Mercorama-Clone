'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { AssessmentRecord, SmeRecord } from '@/types';
import { ReadinessScorecard } from '@/components/report/ReadinessScorecard';
import { ScoreGauge } from '@/components/report/ScoreGauge';
import { SanctionsScreen } from '@/components/report/SanctionsScreen';
import { PillarsMatrix } from '@/components/report/PillarsMatrix';
import { LandedCostSolver } from '@/components/report/LandedCostSolver';
import { MarginValidator } from '@/components/report/MarginValidator';
import { CriticalGapAnalyzer } from '@/components/report/CriticalGapAnalyzer';
import { TradeIntelDashboard } from '@/components/report/TradeIntelDashboard';
import { AdvisorNotesPanel } from '@/components/report/AdvisorNotesPanel';
import { RoadmapTimeline } from '@/components/report/RoadmapTimeline';
import { PdfBriefGenerator } from '@/components/report/PdfBriefGenerator';
import { EdcCountryRiskMap } from '@/components/map/EdcCountryRiskMap';
import { CountryPlaybook } from '@/components/map/CountryPlaybook';
import { QuestionnaireWizard } from '@/components/questionnaire/QuestionnaireWizard';
import { snappy } from '@/lib/animation/presets';

type TabId = 'scorecard' | 'intel' | 'landed';

const TABS: { id: TabId; label: string }[] = [
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'intel', label: 'Trade Intel + Map' },
  { id: 'landed', label: 'Landed Cost' },
];

export function ReportWorkspace() {
  const searchParams = useSearchParams();
  const smeId = searchParams.get('id');

  const [smes, setSmes] = useState<SmeRecord[]>([]);
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('scorecard');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const sme = useMemo(
    () => smes.find((item) => item.id === smeId) ?? null,
    [smes, smeId]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const smeRes = await fetch('/api/sme');
      const smeList = (await smeRes.json()) as SmeRecord[];
      setSmes(smeList);

      if (smeId) {
        const assessRes = await fetch(`/api/assessment?smeId=${encodeURIComponent(smeId)}`);
        if (assessRes.ok) {
          const record = (await assessRes.json()) as AssessmentRecord | null;
          setAssessment(record);
        } else {
          setAssessment(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [smeId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (sme?.targetCountry) {
      setSelectedCountry(sme.targetCountry);
    }
  }, [sme?.targetCountry]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={18} className="animate-spin" />
        Loading report workspace…
      </div>
    );
  }

  if (!smeId || !sme) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--text-secondary)' }}>
          Select an SME from the{' '}
          <Link href="/sandbox/agency" style={{ color: 'var(--accent-premium)' }}>
            portfolio
          </Link>{' '}
          to open a report.
        </p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="page-container">
        <Link
          href="/sandbox/agency"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            marginBottom: '1.5rem',
          }}
        >
          <ArrowLeft size={14} />
          Back to portfolio
        </Link>
        <header style={{ marginBottom: '2rem' }}>
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
            Pending Assessment
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            {sme.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Complete the readiness questionnaire to unlock the report workspace.
          </p>
        </header>
        <div className="bento-card">
          <QuestionnaireWizard
            smeId={sme.id}
            onComplete={(record) => {
              setAssessment(record);
              void loadData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link
        href="/sandbox/agency"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.8125rem',
          marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={14} />
        Back to portfolio
      </Link>

      <header style={{ marginBottom: '1.5rem' }}>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
          Report Workspace
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          {sme.name}
        </h1>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginTop: '0.75rem',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            {sme.targetCountryName} · {sme.industry} · Grade {assessment.grade}
          </p>
          <PdfBriefGenerator assessmentId={assessment.id} />
        </div>
      </header>

      <div className="shipping-lane" style={{ marginBottom: '1.5rem' }} aria-hidden />

      <div className="report-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`report-tab${activeTab === tab.id ? ' report-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scorecard' ? (
        <motion.div key="scorecard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={snappy}>
          <div className="bento-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="bento-card bento-card--span-6">
              <ScoreGauge score={assessment.overallScore} grade={assessment.grade} />
            </div>
            <div className="bento-card bento-card--span-6">
              <SanctionsScreen defaultQuery={sme.name} />
            </div>
          </div>
          <div className="bento-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="bento-card bento-card--span-9">
              <EdcCountryRiskMap
                selectedIso3={selectedCountry}
                onSelectCountry={setSelectedCountry}
              />
            </div>
            <div className="bento-card bento-card--span-3">
              <CountryPlaybook iso3={selectedCountry} />
            </div>
          </div>
          <div className="bento-grid">
            <div className="bento-card bento-card--span-6">
              <PillarsMatrix pillarScores={assessment.pillarScores} />
            </div>
            <div className="bento-card bento-card--span-6">
              <LandedCostSolver sme={sme} />
            </div>
          </div>
          <div className="bento-grid" style={{ marginTop: '1.25rem' }}>
            <div className="bento-card bento-card--span-6">
              <CriticalGapAnalyzer pillarScores={assessment.pillarScores} />
            </div>
            <div className="bento-card bento-card--span-6">
              <MarginValidator sme={sme} />
            </div>
          </div>
          <div className="bento-grid" style={{ marginTop: '1.25rem' }}>
            <div className="bento-card bento-card--span-6">
              <AdvisorNotesPanel assessmentId={assessment.id} />
            </div>
            <div className="bento-card bento-card--span-6">
              <RoadmapTimeline assessmentId={assessment.id} />
            </div>
          </div>
        </motion.div>
      ) : null}

      {activeTab === 'intel' ? (
        <motion.div key="intel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={snappy}>
          <TradeIntelDashboard countryIso3={sme.targetCountry} hsCode={sme.hsCode} />
          <div className="bento-grid" style={{ marginTop: '1.25rem' }}>
            <div className="bento-card bento-card--span-9">
              <EdcCountryRiskMap
                selectedIso3={selectedCountry ?? sme.targetCountry}
                onSelectCountry={setSelectedCountry}
              />
            </div>
            <div className="bento-card bento-card--span-3">
              <CountryPlaybook iso3={selectedCountry ?? sme.targetCountry} />
            </div>
          </div>
        </motion.div>
      ) : null}

      {activeTab === 'landed' ? (
        <motion.div key="landed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={snappy}>
          <div className="bento-grid">
            <div className="bento-card bento-card--span-8">
              <LandedCostSolver sme={sme} />
            </div>
            <div className="bento-card bento-card--span-4">
              <MarginValidator sme={sme} />
            </div>
          </div>
          <div className="bento-card" style={{ marginTop: '1.25rem' }}>
            <ReadinessScorecard assessment={assessment} />
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
