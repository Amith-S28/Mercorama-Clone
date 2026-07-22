// app/data-sources/page.tsx
// DT-6 — Public data sources & methodology page.
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Data Sources & Methodology – Mercorama',
  description: 'How Mercorama sources, updates, and rates the freshness of trade intelligence data including tariff rates, market signals, and export volumes.',
};

const SOURCES = [
  {
    name:      'ICC — International Chamber of Commerce',
    dataType:  'Incoterms® 2020 rules',
    updateFreq: 'Per ICC revision cycle (last: 2020)',
    coverage:  '11 Incoterms® 2020 rules',
    url:       'https://iccwbo.org/business-solutions/incoterms-rules',
  },
  {
    name:      'WCO — World Customs Organization',
    dataType:  'Harmonized System (HS) nomenclature',
    updateFreq: 'Every 5–6 years (current: HS 2022)',
    coverage:  'HS 2022 — 5,224 subheadings',
    url:       'https://www.wcoomd.org/en/topics/nomenclature/overview/what-is-the-harmonized-system.aspx',
  },
  {
    name:      'Global Affairs Canada',
    dataType:  'Canadian FTA tariff schedules',
    updateFreq: 'Annual + on amendments',
    coverage:  '15 FTAs · 51 partner countries',
    url:       'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux',
  },
  {
    name:      'Statistics Canada',
    dataType:  'Canadian export volumes by HS chapter',
    updateFreq: 'Monthly',
    coverage:  'All HS chapters · Canada',
    url:       'https://www.statcan.gc.ca',
  },
  {
    name:      'UN Comtrade',
    dataType:  'Global import demand by HS code',
    updateFreq: 'Monthly',
    coverage:  '200+ countries',
    url:       'https://comtrade.un.org',
  },
  {
    name:      'USITC',
    dataType:  'US import tariff rates (HTS)',
    updateFreq: 'Nightly',
    coverage:  '35,733 HTS codes',
    url:       'https://hts.usitc.gov',
  },
  {
    name:      'CBSA',
    dataType:  'Canadian import tariff rates',
    updateFreq: 'Annual + retaliatory updates',
    coverage:  '22,461 Canadian tariff codes',
    url:       'https://www.cbsa-asfc.gc.ca',
  },
  {
    name:      'EDC — Export Development Canada',
    dataType:  'Export financing & credit insurance programs',
    updateFreq: 'Quarterly',
    coverage:  'Canadian exporters · global markets',
    url:       'https://www.edc.ca',
  },
  {
    name:      'BDC — Business Development Bank of Canada',
    dataType:  'Export-linked financing for SMEs',
    updateFreq: 'Quarterly',
    coverage:  'Canadian SMEs',
    url:       'https://www.bdc.ca',
  },
  {
    name:      'CIFFA',
    dataType:  'Verified freight forwarder registry',
    updateFreq: 'Annual',
    coverage:  'CIFFA-certified forwarders · Canada',
    url:       'https://ciffa.com',
  },
  {
    name:      'World Bank',
    dataType:  'Market risk & logistics performance indicators',
    updateFreq: 'Annual',
    coverage:  '190+ countries',
    url:       'https://www.worldbank.org',
  },
];

const FRESHNESS_LEVELS = [
  { dot: '🟢', label: 'Live',      threshold: '0–7 days',   description: 'Data was verified against the source within the past 7 days.' },
  { dot: '🔵', label: 'Current',   threshold: '8–30 days',  description: 'Data was verified within the past month and is still reliable for most use cases.' },
  { dot: '🟡', label: 'Aging',     threshold: '31–60 days', description: 'Data is over a month old. Verify against the original source for time-sensitive decisions.' },
  { dot: '🟠', label: 'Stale',     threshold: '61–90 days', description: 'Data is significantly out of date. Treat with caution and cross-reference independently.' },
  { dot: '⚪', label: 'Estimated', threshold: 'No source',  description: 'This value has not been verified against a live government or institutional source.' },
];

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 md:py-24 space-y-16">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Data Sources &amp; Methodology</h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Mercorama sources trade intelligence from government databases, international trade organisations,
            and statistical agencies. This page explains where our data comes from, how frequently it is
            updated, and how we rate its freshness.
          </p>
        </div>

        {/* 1. Our Data Sources */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Our Data Sources</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOURCES.map((s) => (
              <div key={s.name} className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold text-sm leading-snug">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.dataType}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span><span className="font-medium text-foreground">Updated:</span> {s.updateFreq}</span>
                  <span><span className="font-medium text-foreground">Coverage:</span> {s.coverage}</span>
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs block truncate"
                >
                  {s.url.replace('https://', '')}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Data pipeline status and last ingestion timestamps are monitored internally and updated weekly.
          </p>
        </section>

        {/* 2. How We Rate Data Freshness */}
        <section>
          <h2 className="text-xl font-semibold mb-2">How We Rate Data Freshness</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Every data point in Mercorama carries a freshness badge indicating how recently it was verified
            against its source. The badge appears as a small coloured pill next to the data value.
          </p>
          <div className="space-y-3">
            {FRESHNESS_LEVELS.map((f) => (
              <div key={f.label} className="flex items-start gap-4 rounded-lg border p-4">
                <span className="text-xl shrink-0">{f.dot}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{f.label}</span>
                    <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">{f.threshold}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. What "Estimated" Means */}
        <section className="rounded-xl border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold mb-3">What &ldquo;Estimated&rdquo; Means</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Some values displayed in Mercorama — particularly in the Export Compass market intelligence
            results — are generated by AI based on publicly available trade knowledge and patterns.
            These values carry an <strong>⚪ Estimated</strong> badge.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Estimated values have <strong>not been verified against a live government or institutional
            data source</strong> and should be treated as directional guidance only. They may not reflect
            the most current tariff schedules, trade flows, or market conditions.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We are actively building data pipelines to replace estimated values with verified data
            from Statistics Canada, UN Comtrade, USITC, and CBSA. As each pipeline goes live,
            affected data points will be automatically re-tagged with their verified source and
            freshness level.
          </p>
        </section>

        {/* 4. Reporting an Issue */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Reporting a Data Issue</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you spot a data discrepancy — an incorrect tariff rate, an outdated market figure, or
            a source that appears wrong — use the{' '}
            <span className="font-semibold text-foreground">⚑ flag icon</span>{' '}
            next to any data point to report it directly to our team.
            No account is required to submit a flag.
            We review all flagged data points and notify affected users when a correction is made.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
