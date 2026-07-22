// lib/fta-report-pdf.tsx
// @react-pdf/renderer v4 — server-side PDF template for FTA Diversification Reports

import {
  Document, Page, Text, View, Image, Link,
  StyleSheet, Font,
} from '@react-pdf/renderer';
import type { FtaDiversifySession, FtaMarketSummary } from './fta-diversify';

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const B = {
  navy:      '#0f172a',
  navyMid:   '#1e293b',
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
  body:      '#1e293b',
  bodySub:   '#475569',
};

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: B.white,
    paddingBottom: 52,
  },

  // Header band
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

  // Teal title band
  titleBand: {
    backgroundColor: B.teal,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  titleText: {
    color: B.white,
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
  },
  titleMeta: {
    color: B.tealLight,
    fontSize: 9,
    marginTop: 4,
    lineHeight: 1.5,
  },

  // Body
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
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center' },
  countryName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: B.navy,
    marginRight: 8,
  },
  ftaBadge: {
    backgroundColor: B.teal,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ftaBadgeText: {
    color: B.white,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  regionBadge: {
    backgroundColor: B.border,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  regionText: {
    color: B.muted,
    fontSize: 7,
  },
  cardBody: { paddingHorizontal: 14, paddingVertical: 12 },

  // Tariff box
  tariffBox: {
    backgroundColor: B.greenBg,
    borderWidth: 1,
    borderColor: B.greenBdr,
    borderStyle: 'solid',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tariffLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: B.green,
    marginRight: 4,
  },
  tariffText: {
    fontSize: 8,
    color: B.green,
    flex: 1,
    lineHeight: 1.4,
  },

  // Rationale
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

  // Snapshot table
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: B.border,
    borderBottomStyle: 'solid',
    paddingVertical: 4,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableKey: {
    width: '28%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: B.muted,
  },
  tableVal: {
    width: '72%',
    fontSize: 8,
    color: B.bodySub,
    lineHeight: 1.4,
  },

  // Segments
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  chipText: { fontSize: 7, color: B.muted },
  riskChip: {
    backgroundColor: B.amberBg,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  riskChipText: { fontSize: 7, color: B.amber },

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
  disclaimerText: {
    fontSize: 7.5,
    color: B.muted,
    lineHeight: 1.5,
  },

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
  promoHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: B.navy,
    marginBottom: 3,
  },
  promoSubheading: {
    fontSize: 8,
    color: B.muted,
    marginBottom: 12,
  },
  promoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
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
  promoCardTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: B.navy,
    marginBottom: 3,
  },
  promoCardDesc: {
    fontSize: 7.5,
    color: B.muted,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  promoCardLink: {
    fontSize: 7.5,
    color: B.teal,
    fontFamily: 'Helvetica-Bold',
  },

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
  footerLeft: { fontSize: 7, color: B.muted },
  footerRight: { fontSize: 7, color: B.muted },
});

// ─── Cross-promo data ──────────────────────────────────────────────────────────

const PROMO_TOOLS = [
  {
    title: 'HS Code Assistant',
    desc: 'Classify any product to a precise HS Code with GRI-based reasoning, duty rates, and misclassification risk flags.',
    url: 'https://mercorama.com/hscode',
  },
  {
    title: 'Incoterms Analyzer',
    desc: 'Get a plain-language breakdown of responsibilities, risk transfer points, and cost allocation for any Incoterm.',
    url: 'https://mercorama.com/incoterms',
  },
  {
    title: 'Deal Wizard',
    desc: 'Build your export plan end-to-end — from HS code through Incoterm to an export-ready deal summary in one guided workflow.',
    url: 'https://mercorama.com/deal',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function MarketSection({ market, isLast }: { market: FtaMarketSummary; isLast: boolean }) {
  const snap = market.marketSnapshot;
  const tableRows = [
    { k: 'Market size',     v: snap?.marketSizeNote },
    { k: 'Demographics',    v: snap?.demographicsNote },
    { k: 'Spending trends', v: snap?.spendingNote },
    { k: 'Outlook',         v: snap?.outlookNote },
  ].filter((r) => r.v);

  return (
    <View style={S.card} wrap={false}>
      {/* Card header */}
      <View style={S.cardHead}>
        <View style={S.cardHeadLeft}>
          <Text style={S.countryName}>{market.country}</Text>
          <View style={S.ftaBadge}>
            <Text style={S.ftaBadgeText}>{market.ftaName}</Text>
          </View>
          {market.regionCode && market.regionCode !== market.ftaName && (
            <View style={S.regionBadge}>
              <Text style={S.regionText}>{market.regionCode}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Card body */}
      <View style={S.cardBody}>
        {/* Tariff advantage */}
        {market.tariffNote ? (
          <View style={S.tariffBox}>
            <Text style={S.tariffLabel}>Tariff advantage:</Text>
            <Text style={S.tariffText}>{market.tariffNote}</Text>
          </View>
        ) : null}

        {/* Rationale */}
        {market.rationale ? (
          <>
            <Text style={S.sectionLabel}>Why this market</Text>
            <Text style={S.bodyText}>{market.rationale}</Text>
          </>
        ) : null}

        {/* Market snapshot table */}
        {tableRows.length > 0 ? (
          <>
            <Text style={S.sectionLabel}>Market snapshot</Text>
            <View>
              {tableRows.map((row, i) => (
                <View key={i} style={i < tableRows.length - 1 ? S.tableRow : S.tableRowLast}>
                  <Text style={S.tableKey}>{row.k}</Text>
                  <Text style={S.tableVal}>{row.v}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Key segments */}
        {(snap?.keySegments?.length ?? 0) > 0 ? (
          <>
            <Text style={S.sectionLabel}>Key segments</Text>
            <View style={S.chipRow}>
              {snap!.keySegments.map((seg, i) => (
                <View key={i} style={S.chip}>
                  <Text style={S.chipText}>{seg}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Risk flags */}
        {(market.riskFlags?.length ?? 0) > 0 ? (
          <>
            <Text style={S.sectionLabel}>Risk flags</Text>
            <View style={S.chipRow}>
              {market.riskFlags!.map((flag, i) => (
                <View key={i} style={S.riskChip}>
                  <Text style={S.riskChipText}>⚠ {flag}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────

export function FtaReportPdf({
  logoPath,
  session,
  markets,
}: {
  logoPath: string;
  session: FtaDiversifySession;
  markets: FtaMarketSummary[];
}) {
  const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'long' });
  const productLabel = session.productDescription.slice(0, 80);
  const metaLine = [
    session.companyName,
    session.province,
    session.sector,
    session.hsCode ? `HS ${session.hsCode}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Document
      title="FTA Diversification Report — Mercorama"
      author="Mercorama"
      subject={productLabel}
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
          <Text style={S.titleText}>FTA Diversification Report</Text>
          <Text style={S.titleMeta}>
            {metaLine ? `${metaLine}\n` : ''}
            {productLabel}
            {'\n'}Generated {date}
          </Text>
        </View>

        {/* ── Market sections ── */}
        <View style={S.body}>
          {markets.map((m, i) => (
            <MarketSection key={i} market={m} isLast={i === markets.length - 1} />
          ))}

          {/* ── Disclaimer ── */}
          <View style={S.disclaimer}>
            <Text style={S.disclaimerText}>
              This report is generated by AI for informational purposes only and does not constitute
              legal, financial, or professional trade advice. Tariff rates and market conditions
              change frequently — verify all information with a licensed customs broker and official
              government sources before making business decisions.
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
