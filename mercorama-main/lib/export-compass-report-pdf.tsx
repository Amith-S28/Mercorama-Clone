// lib/export-compass-report-pdf.tsx
// @react-pdf/renderer v4 — server-side PDF template for Export Compass Reports

import {
  Document, Page, Text, View, Image, Link,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ExportCompassSession, MarketIntelligenceCard } from './export-compass';

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const B = {
  navy:      '#0f172a',
  navyMid:   '#1e293b',
  indigo:    '#4338ca',
  indigoMid: '#6366f1',
  indigoLight: '#e0e7ff',
  teal:      '#0d9488',
  tealLight: '#ccfbf1',
  muted:     '#64748b',
  mutedLight:'#94a3b8',
  border:    '#e2e8f0',
  bg:        '#f8fafc',
  white:     '#ffffff',
  green:     '#15803d',
  greenBg:   '#f0fdf4',
  greenBdr:  '#bbf7d0',
  amber:     '#b45309',
  amberBg:   '#fffbeb',
  red:       '#dc2626',
  redBg:     '#fef2f2',
  body:      '#1e293b',
  bodySub:   '#475569',
};

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: B.white,
    paddingBottom: 52,
  },
  header: {
    backgroundColor: B.navy,
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 130, height: 33 },
  headerTagline: { color: B.mutedLight, fontSize: 8, textAlign: 'right' },

  titleBand: {
    backgroundColor: B.indigo,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  titleText: {
    color: B.white,
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
  },
  titleMeta: {
    color: B.indigoLight,
    fontSize: 9,
    marginTop: 4,
    lineHeight: 1.5,
  },

  body: { paddingHorizontal: 32, paddingTop: 20 },

  // Market card
  card: {
    borderWidth: 1,
    borderColor: B.border,
    borderStyle: 'solid',
    borderRadius: 6,
    marginBottom: 18,
  },
  cardHead: {
    backgroundColor: B.bg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: B.border,
    borderBottomStyle: 'solid',
  },
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  countryName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: B.navy,
    marginRight: 8,
  },
  ftaBadge: {
    backgroundColor: B.teal,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
  },
  ftaBadgeText: {
    color: B.white,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  regionBadge: {
    backgroundColor: B.border,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 4,
  },
  regionText: { color: B.muted, fontSize: 7 },

  // Score badge
  scoreBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    minWidth: 44,
  },
  scoreNum: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  scoreLabel: { fontSize: 6, marginTop: 2 },

  cardBody: { paddingHorizontal: 14, paddingVertical: 12 },

  // Stats grid (4 cells)
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statCell: {
    flex: 1,
    backgroundColor: B.bg,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 4,
  },
  statCellLast: {
    flex: 1,
    backgroundColor: B.bg,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 7,
    color: B.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: B.body,
  },

  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: B.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
    marginTop: 8,
  },
  bodyText: {
    fontSize: 9,
    color: B.bodySub,
    lineHeight: 1.55,
  },

  // Score bars
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  barLabel: { width: 68, fontSize: 7.5, color: B.muted },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: B.border,
    borderRadius: 99,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  barFillGreen:  { height: 4, backgroundColor: '#22c55e', borderRadius: 99 },
  barFillAmber:  { height: 4, backgroundColor: '#f59e0b', borderRadius: 99 },
  barFillRed:    { height: 4, backgroundColor: '#ef4444', borderRadius: 99 },
  barNum: { width: 20, fontSize: 7, textAlign: 'right', color: B.muted },

  // Competitors chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  chip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  chipText: { fontSize: 7, color: B.muted },

  // Disclaimer
  disclaimer: {
    backgroundColor: B.bg,
    borderWidth: 1,
    borderColor: B.border,
    borderStyle: 'solid',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  disclaimerText: { fontSize: 7.5, color: B.muted, lineHeight: 1.5 },

  // Cross-promo
  promoSection: {
    backgroundColor: B.bg,
    borderWidth: 1,
    borderColor: B.border,
    borderStyle: 'solid',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  promoHeading:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: B.navy, marginBottom: 3 },
  promoSubheading: { fontSize: 8,  color: B.muted, marginBottom: 12 },
  promoGrid:       { flexDirection: 'row', flexWrap: 'wrap' },
  promoCard: {
    width: '48%',
    backgroundColor: B.white,
    borderWidth: 1,
    borderColor: B.border,
    borderStyle: 'solid',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: '2%',
    marginBottom: 8,
  },
  promoCardTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.navy, marginBottom: 3 },
  promoCardDesc:  { fontSize: 7.5, color: B.muted, lineHeight: 1.4, marginBottom: 4 },
  promoCardLink:  { fontSize: 7.5, color: B.teal, fontFamily: 'Helvetica-Bold' },

  // Page footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: B.border,
    borderTopStyle: 'solid',
    paddingHorizontal: 32,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: B.white,
  },
  footerLeft:  { fontSize: 7, color: B.muted },
  footerRight: { fontSize: 7, color: B.muted },
});

// ─── Cross-promo tools ────────────────────────────────────────────────────────

const PROMO_TOOLS = [
  {
    title: 'FTA Diversify Wizard',
    desc: 'Discover FTA-backed export markets with AI market snapshots, tariff advantages, and branded PDF reports.',
    url: 'https://mercorama.com/fta-diversify',
  },
  {
    title: 'HS Code Assistant',
    desc: 'Classify any product to a precise HS Code with GRI-based reasoning, duty rates, and misclassification risk flags.',
    url: 'https://mercorama.com/hscode',
  },
  {
    title: 'Deal Wizard',
    desc: 'Build your export plan end-to-end — from HS code through Incoterm to an export-ready deal summary in one guided workflow.',
    url: 'https://mercorama.com/deal',
  },
];

// ─── Score bar fill style ──────────────────────────────────────────────────────

function barFill(score: number) {
  if (score >= 70) return S.barFillGreen;
  if (score >= 50) return S.barFillAmber;
  return S.barFillRed;
}

// ─── Score badge style ────────────────────────────────────────────────────────

function scoreBadgeStyle(score: number) {
  if (score >= 70) return { backgroundColor: B.greenBg, color: B.green };
  if (score >= 50) return { backgroundColor: B.amberBg, color: B.amber };
  return { backgroundColor: B.redBg, color: B.red };
}

// ─── Score meta ───────────────────────────────────────────────────────────────

const SCORE_META = [
  { key: 'demand',          label: 'Demand' },
  { key: 'growth',          label: 'Growth' },
  { key: 'canadaAdvantage', label: 'Canada Adv.' },
  { key: 'marketAccess',    label: 'Market Access' },
  { key: 'logistics',       label: 'Logistics' },
  { key: 'risk',            label: 'Risk' },
] as const;

// ─── Market section ───────────────────────────────────────────────────────────

function MarketSection({ market }: { market: MarketIntelligenceCard }) {
  const { backgroundColor: bgColor, color: textColor } = scoreBadgeStyle(market.exportScore);

  return (
    <View style={S.card} wrap={false}>
      {/* Card header */}
      <View style={S.cardHead}>
        <View style={S.cardHeadLeft}>
          <Text style={S.countryName}>{market.country}</Text>
          {market.ftaAvailable && market.ftaName && (
            <View style={S.ftaBadge}>
              <Text style={S.ftaBadgeText}>{market.ftaName}</Text>
            </View>
          )}
          {market.regionCode && (
            <View style={S.regionBadge}>
              <Text style={S.regionText}>{market.regionCode}</Text>
            </View>
          )}
        </View>
        {/* Export score badge */}
        <View style={[S.scoreBadge, { backgroundColor: bgColor }]}>
          <Text style={[S.scoreNum, { color: textColor }]}>{market.exportScore}</Text>
          <Text style={[S.scoreLabel, { color: textColor }]}>Export Score</Text>
        </View>
      </View>

      {/* Card body */}
      <View style={S.cardBody}>
        {/* Trade stats */}
        <View style={S.statsGrid}>
          <View style={S.statCell}>
            <Text style={S.statLabel}>Market size</Text>
            <Text style={S.statValue}>{market.importValueUSD}</Text>
          </View>
          <View style={S.statCell}>
            <Text style={S.statLabel}>5Y growth</Text>
            <Text style={S.statValue}>{market.importGrowth5y}</Text>
          </View>
          <View style={S.statCell}>
            <Text style={S.statLabel}>Canada share</Text>
            <Text style={S.statValue}>{market.canadaExportShare}</Text>
          </View>
          <View style={S.statCellLast}>
            <Text style={S.statLabel}>Tariff rate</Text>
            <Text style={S.statValue}>{market.tariffRate}</Text>
          </View>
        </View>

        {/* AI insight */}
        {market.insight ? (
          <>
            <Text style={S.sectionLabel}>Market insight</Text>
            <Text style={S.bodyText}>{market.insight}</Text>
          </>
        ) : null}

        {/* Competitors */}
        {market.topCompetitors.length > 0 ? (
          <>
            <Text style={S.sectionLabel}>Top competitors</Text>
            <View style={S.chipRow}>
              {market.topCompetitors.map((c, i) => (
                <View key={i} style={S.chip}>
                  <Text style={S.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Score breakdown */}
        <Text style={S.sectionLabel}>Score breakdown</Text>
        {SCORE_META.map(({ key, label }) => (
          <View key={key} style={S.barRow}>
            <Text style={S.barLabel}>{label}</Text>
            <View style={S.barTrack}>
              <View style={[barFill(market.scores[key]), { width: `${market.scores[key]}%` }]} />
            </View>
            <Text style={S.barNum}>{market.scores[key]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────

export function ExportCompassReportPdf({
  logoPath,
  session,
}: {
  logoPath: string;
  session: ExportCompassSession;
}) {
  const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'long' });
  const markets = session.recommendedMarkets;

  return (
    <Document
      title="Export Compass Report — Mercorama"
      author="Mercorama"
      subject={session.productLabel}
      creator="Mercorama · mercorama.com"
    >
      <Page size="A4" style={S.page}>
        {/* ── Header ── */}
        <View style={S.header} fixed>
          <Image style={S.logo} src={logoPath} />
          <Text style={S.headerTagline}>mercorama.com</Text>
        </View>

        {/* ── Title band ── */}
        <View style={S.titleBand}>
          <Text style={S.titleText}>Export Compass Report</Text>
          <Text style={S.titleMeta}>
            {session.productLabel}
            {session.hsCode ? ` · HS ${session.hsCode}` : ''}
            {'\n'}
            {session.originCountry} · Top {markets.length} global markets · Generated {date}
          </Text>
        </View>

        {/* ── Market sections ── */}
        <View style={S.body}>
          {markets.map((m, i) => (
            <MarketSection key={i} market={m} />
          ))}

          {/* ── Disclaimer ── */}
          <View style={S.disclaimer}>
            <Text style={S.disclaimerText}>
              Export scores are AI-generated estimates based on publicly known trade patterns and
              FTA schedules. This report is for informational purposes only and does not constitute
              legal, financial, or professional trade advice. Verify tariff rates, market data,
              and regulatory requirements with a licensed customs broker and your local Trade
              Commissioner Service before making business decisions.
            </Text>
          </View>

          {/* ── Cross-promo ── */}
          <View style={S.promoSection}>
            <Text style={S.promoHeading}>Explore more Mercorama tools</Text>
            <Text style={S.promoSubheading}>
              Everything you need to classify, negotiate, and close export deals.
            </Text>
            <View style={S.promoGrid}>
              {PROMO_TOOLS.map((tool) => (
                <View key={tool.title} style={S.promoCard}>
                  <Text style={S.promoCardTitle}>{tool.title}</Text>
                  <Text style={S.promoCardDesc}>{tool.desc}</Text>
                  <Link src={tool.url} style={S.promoCardLink}>
                    Try it →
                  </Link>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Page footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>
            © 2026 MERCORAMA powered by MightyIQ Inc. · All rights reserved · Made for export driven SMEs worldwide
          </Text>
          <Text
            style={S.footerRight}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
