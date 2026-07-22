// lib/deal-dossier-pdf.tsx
// @react-pdf/renderer v4 — server-side PDF template for Deal Dossier

import {
  Document, Page, Text, View, Image, Link,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Deal } from './deals';
import type { DealItem } from './deal-items';
import type { HsClassificationResult } from '@/app/hscode/_components/hs-classifier';
import type { EnhancedHsResult, IncotermInsight, DealPlaybook } from './types';

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const B = {
  navy:      '#0f172a',
  navyMid:   '#1e293b',
  indigo:    '#4338ca',
  indigoLight: '#e0e7ff',
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
  amberBdr:  '#fde68a',
  red:       '#b91c1c',
  redBg:     '#fef2f2',
  redBdr:    '#fecaca',
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

  // Indigo title band
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

  // Body
  body: { paddingHorizontal: 32, paddingTop: 20 },

  // Section card
  card: {
    borderWidth: 1,
    borderColor: B.border,
    borderStyle: 'solid',
    borderRadius: 6,
    marginBottom: 14,
  },
  cardHead: {
    backgroundColor: B.bg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: B.border,
    borderBottomStyle: 'solid',
  },
  cardHeadText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: B.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: { paddingHorizontal: 14, paddingVertical: 10 },

  // Key-value rows
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
    width: '30%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: B.muted,
  },
  tableVal: {
    width: '70%',
    fontSize: 8,
    color: B.bodySub,
    lineHeight: 1.4,
  },

  // HS code badge
  hsBadge: {
    backgroundColor: B.indigo,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  hsBadgeText: {
    color: B.white,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  hsDesc: {
    fontSize: 9,
    color: B.bodySub,
    lineHeight: 1.45,
    marginBottom: 6,
  },

  // Confidence / risk chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chipGreen: {
    backgroundColor: B.greenBg,
    borderWidth: 1,
    borderColor: B.greenBdr,
    borderStyle: 'solid',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  chipAmber: {
    backgroundColor: B.amberBg,
    borderWidth: 1,
    borderColor: B.amberBdr,
    borderStyle: 'solid',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  chipRed: {
    backgroundColor: B.redBg,
    borderWidth: 1,
    borderColor: B.redBdr,
    borderStyle: 'solid',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  chipNeutral: {
    backgroundColor: '#f1f5f9',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  chipTextGreen: { fontSize: 7, color: B.green },
  chipTextAmber: { fontSize: 7, color: B.amber },
  chipTextRed:   { fontSize: 7, color: B.red },
  chipTextNeutral:{ fontSize: 7, color: B.muted },

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
    fontSize: 8.5,
    color: B.bodySub,
    lineHeight: 1.5,
  },

  // Clause checklist
  clauseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  clauseBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: B.muted,
    borderStyle: 'solid',
    borderRadius: 1,
    marginRight: 7,
    marginTop: 1,
    flexShrink: 0,
  },
  clauseText: {
    fontSize: 8,
    color: B.bodySub,
    flex: 1,
    lineHeight: 1.4,
  },
  clauseNote: {
    fontSize: 7,
    color: B.muted,
    flex: 1,
    lineHeight: 1.4,
    marginTop: 2,
  },

  // Line items table
  lineItemHeader: {
    flexDirection: 'row',
    backgroundColor: B.bg,
    borderBottomWidth: 1,
    borderBottomColor: B.border,
    borderBottomStyle: 'solid',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  lineItemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: B.border,
    borderBottomStyle: 'solid',
    paddingVertical: 4,
  },
  lineItemRowLast: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  colSku:   { width: '18%', fontSize: 7.5, color: B.muted },
  colName:  { width: '38%', fontSize: 7.5, color: B.bodySub },
  colQty:   { width: '14%', fontSize: 7.5, color: B.bodySub, textAlign: 'right' },
  colPrice: { width: '16%', fontSize: 7.5, color: B.bodySub, textAlign: 'right' },
  colTotal: { width: '14%', fontSize: 7.5, color: B.bodySub, textAlign: 'right' },
  colSkuH:  { width: '18%', fontSize: 7, fontFamily: 'Helvetica-Bold', color: B.muted },
  colNameH: { width: '38%', fontSize: 7, fontFamily: 'Helvetica-Bold', color: B.muted },
  colQtyH:  { width: '14%', fontSize: 7, fontFamily: 'Helvetica-Bold', color: B.muted, textAlign: 'right' },
  colPriceH:{ width: '16%', fontSize: 7, fontFamily: 'Helvetica-Bold', color: B.muted, textAlign: 'right' },
  colTotalH:{ width: '14%', fontSize: 7, fontFamily: 'Helvetica-Bold', color: B.muted, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: B.border,
    borderTopStyle: 'solid',
    marginTop: 2,
  },
  totalLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.navy, marginRight: 8 },
  totalVal:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: B.navy },

  // Disclaimer
  disclaimer: {
    backgroundColor: B.amberBg,
    borderWidth: 1,
    borderColor: B.amberBdr,
    borderStyle: 'solid',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: B.amber,
    marginBottom: 3,
  },
  disclaimerText: {
    fontSize: 7.5,
    color: B.amber,
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
    paddingVertical: 14,
    marginBottom: 20,
  },
  promoHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: B.navy,
    marginBottom: 2,
  },
  promoSubheading: {
    fontSize: 7.5,
    color: B.muted,
    marginBottom: 10,
  },
  promoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
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
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: B.navy,
    marginBottom: 2,
  },
  promoCardDesc: {
    fontSize: 7,
    color: B.muted,
    lineHeight: 1.4,
    marginBottom: 3,
  },
  promoCardLink: {
    fontSize: 7,
    color: B.indigo,
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
    title: 'Export Compass',
    desc: 'AI-ranked global market shortlist for your product — export score, FTA access, and demand signals.',
    url: 'https://mercorama.com/dashboard?tool=export-compass',
  },
  {
    title: 'FTA Diversify Wizard',
    desc: 'Discover FTA-backed markets under Canada\'s active trade agreements with market snapshots and PDF reports.',
    url: 'https://mercorama.com/fta-diversify',
  },
  {
    title: 'HS Code Assistant',
    desc: 'GRI-based classification with duty rates, confidence score, and misclassification risk flags.',
    url: 'https://mercorama.com/hscode',
  },
  {
    title: 'Incoterms Analyzer',
    desc: 'Plain-language breakdown of responsibilities, risk transfer points, and cost allocation.',
    url: 'https://mercorama.com/incoterms',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function confidenceChipStyle(level: 'High' | 'Medium' | 'Low') {
  if (level === 'High')   return { chip: S.chipGreen, text: S.chipTextGreen };
  if (level === 'Medium') return { chip: S.chipAmber, text: S.chipTextAmber };
  return { chip: S.chipRed, text: S.chipTextRed };
}

function riskChipStyle(level: 'High' | 'Medium' | 'Low') {
  if (level === 'High') return { chip: S.chipRed,   text: S.chipTextRed };
  if (level === 'Medium') return { chip: S.chipAmber, text: S.chipTextAmber };
  return { chip: S.chipGreen, text: S.chipTextGreen };
}

const KEY_CLAUSES = [
  { label: 'Product specification & quality standards', note: 'Reference HS Code and standardized item description' },
  { label: 'Payment terms & milestone schedule',        note: `Confirm method, currency, and trigger events` },
  { label: 'Delivery obligations & Incoterm allocation',note: 'Specify named place and responsibility split' },
  { label: 'Freight, insurance & risk transfer point',  note: 'Align with chosen Incoterm' },
  { label: 'Customs documentation & export licensing',  note: 'Verify export controls for destination country' },
  { label: 'Inspection rights & acceptance criteria',   note: 'Pre-shipment inspection, sampling, tolerance' },
  { label: 'Dispute resolution & governing law',        note: 'Jurisdiction, arbitration body, language' },
  { label: 'Force majeure clause',                      note: 'Events, notice period, termination rights' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function KVRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={isLast ? S.tableRowLast : S.tableRow}>
      <Text style={S.tableKey}>{label}</Text>
      <Text style={S.tableVal}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children, noWrap }: { title: string; children: React.ReactNode; noWrap?: boolean }) {
  return (
    <View style={S.card} wrap={!noWrap}>
      <View style={S.cardHead}>
        <Text style={S.cardHeadText}>{title}</Text>
      </View>
      <View style={S.cardBody}>{children}</View>
    </View>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────

export function DealDossierPdf({
  logoPath,
  deal,
  items,
  dossier,
}: {
  logoPath: string;
  deal: Deal;
  items: DealItem[];
  dossier: HsClassificationResult | null;
}) {
  const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'long' });

  const metaLine = [
    deal.sellerName,
    deal.buyerName ? `→ ${deal.buyerName}` : null,
    deal.buyerCountry,
  ].filter(Boolean).join(' ');

  const totalValue = items.length > 0
    ? items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    : deal.unitPrice * deal.quantity;

  const confidenceLevel = dossier?.selectedCode?.confidenceLevel ?? null;
  const riskLevel = dossier?.risk?.overallRiskLevel ?? deal.hsRiskLevel ?? null;

  return (
    <Document
      title="Deal Dossier — Mercorama"
      author="Mercorama"
      subject={deal.productDescription.slice(0, 80)}
      creator="Mercorama · mercorama.com"
    >
      <Page size="A4" style={S.page}>
        {/* ── Header ── */}
        <View style={S.header} fixed>
          <View style={{ backgroundColor: '#ffffff', padding: 4, borderRadius: 2 }}>
            <Image style={S.logo} src={logoPath} />
          </View>
          <Text style={S.headerTagline}>mercorama.com</Text>
        </View>

        {/* ── Title band ── */}
        <View style={S.titleBand}>
          <Text style={S.titleText}>Deal Dossier</Text>
          <Text style={S.titleMeta}>
            {metaLine ? `${metaLine}\n` : ''}
            {deal.productDescription.slice(0, 80)}
            {'\n'}Generated {date}
          </Text>
        </View>

        <View style={S.body}>

          {/* ── 1. Deal Snapshot ── */}
          <SectionCard title="Deal Snapshot">
            <KVRow label="Seller"          value={deal.sellerName || '—'} />
            <KVRow label="Buyer"           value={deal.buyerName ? `${deal.buyerName} (${deal.buyerCountry})` : deal.buyerCountry || '—'} />
            <KVRow label="Product"         value={deal.productDescription || '—'} />
            <KVRow label="Payment method"  value={deal.paymentMethod || '—'} />
            <KVRow label="Payment terms"   value={deal.paymentTerms || '—'} />
            <KVRow label="Delivery date"   value={deal.deliveryDate || '—'} />
            <KVRow label="Total value"     value={fmt(totalValue, deal.currency)} isLast={!(deal as Record<string, unknown>).dealIntent} />
            {(deal as Record<string, unknown>).dealIntent && (
              <KVRow label="Deal objective" value={
                (deal as Record<string, unknown>).dealIntent === 'new_market' ? 'Enter a new market' :
                (deal as Record<string, unknown>).dealIntent === 'fulfil_order' ? 'Fulfil a confirmed order' :
                (deal as Record<string, unknown>).dealIntent === 'repeat_deal' ? 'Repeat a previous deal' :
                'Explore options'
              } isLast />
            )}
          </SectionCard>

          {/* ── 2. HS Classification ── */}
          <SectionCard title="HS Code Classification">
            <View style={S.hsBadge}>
              <Text style={S.hsBadgeText}>{deal.hsCode || dossier?.selectedCode?.code || '—'}</Text>
            </View>
            <Text style={S.hsDesc}>
              {deal.hsDescription || dossier?.selectedCode?.description || '—'}
            </Text>

            {dossier?.selectedCode && (
              <>
                <View style={S.chipRow}>
                  {confidenceLevel && (() => {
                    const s = confidenceChipStyle(confidenceLevel);
                    return (
                      <View style={s.chip}>
                        <Text style={s.text}>
                          Confidence: {confidenceLevel} ({Math.round(dossier.selectedCode.confidenceScore * 100)}%)
                        </Text>
                      </View>
                    );
                  })()}
                  {riskLevel && (() => {
                    const s = riskChipStyle(riskLevel as 'High' | 'Medium' | 'Low');
                    return (
                      <View style={s.chip}>
                        <Text style={s.text}>Misclassification risk: {riskLevel}</Text>
                      </View>
                    );
                  })()}
                </View>

                {(dossier.selectedCode.griBasis?.length ?? 0) > 0 && (
                  <>
                    <Text style={S.sectionLabel}>GRI basis</Text>
                    <Text style={S.bodyText}>{dossier.selectedCode.griBasis.join(' · ')}</Text>
                  </>
                )}

                {dossier.selectedCode.mercoramaReasoning && (
                  <>
                    <Text style={S.sectionLabel}>Classification reasoning</Text>
                    <Text style={S.bodyText}>{dossier.selectedCode.mercoramaReasoning}</Text>
                  </>
                )}
              </>
            )}

            {deal.hsDutyNote && (
              <>
                <Text style={S.sectionLabel}>Duty note</Text>
                <Text style={S.bodyText}>{deal.hsDutyNote}</Text>
              </>
            )}

            {(dossier?.risk?.misclassificationRisks?.length ?? 0) > 0 && (
              <>
                <Text style={S.sectionLabel}>Misclassification risks</Text>
                {dossier!.risk.misclassificationRisks.map((r, i) => (
                  <Text key={i} style={S.bodyText}>• {r}</Text>
                ))}
              </>
            )}
          </SectionCard>

          {/* ── 2b. Classification Intelligence (if available) ── */}
          {deal.enhancedHsResult && (() => {
            const ehs = deal.enhancedHsResult as unknown as EnhancedHsResult;
            return (
              <SectionCard title="Classification Intelligence">
                <KVRow label="Confidence" value={`${ehs.confidence ?? '—'}%`} />
                {ehs.explanation && <><Text style={S.sectionLabel}>Analysis</Text><Text style={S.bodyText}>{ehs.explanation}</Text></>}
                {ehs.tradeImplications?.tariffImpact && <KVRow label="Tariff impact" value={ehs.tradeImplications.tariffImpact} />}
                {ehs.tradeImplications?.complianceImpact && <KVRow label="Compliance" value={ehs.tradeImplications.complianceImpact} />}
                {ehs.tradeImplications?.documentationImpact && <KVRow label="Documentation" value={ehs.tradeImplications.documentationImpact} />}
                {(ehs.riskFlags ?? []).length > 0 && (
                  <><Text style={S.sectionLabel}>Risk flags</Text>{ehs.riskFlags!.map((r, i) => <Text key={i} style={S.bodyText}>• {r}</Text>)}</>
                )}
                {(ehs.alternativeCodes ?? []).length > 0 && (
                  <KVRow label="Alternatives" value={ehs.alternativeCodes!.join(', ')} isLast />
                )}
              </SectionCard>
            );
          })()}

          {/* ── 3. Incoterm & Logistics ── */}
          <SectionCard title="Incoterm & Logistics">
            <KVRow label="Incoterm"   value={`${deal.incoterm}${deal.incotermPlace ? ` — ${deal.incotermPlace}` : ''}`} />
            <KVRow label="Freight"    value={`${deal.freightResponsibility} responsibility`} />
            <KVRow label="Insurance"  value={`${deal.insuranceResponsibility} responsibility`} isLast />
          </SectionCard>

          {/* ── 3b. Incoterm Strategy (if available) ── */}
          {deal.incotermInsight && (() => {
            const ins = deal.incotermInsight as unknown as IncotermInsight;
            const riskChip = ins.riskLevel === 'low' ? S.chipGreen : ins.riskLevel === 'high' ? S.chipRed : S.chipAmber;
            const riskText = ins.riskLevel === 'low' ? S.chipTextGreen : ins.riskLevel === 'high' ? S.chipTextRed : S.chipTextAmber;
            return (
              <SectionCard title="Incoterm Strategy">
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.body, marginRight: 8 }}>Recommended: {ins.recommended}</Text>
                  <View style={riskChip}><Text style={riskText}>{ins.riskLevel} risk</Text></View>
                </View>
                <Text style={S.bodyText}>{ins.rationale}</Text>
                {ins.marginImpact && <><Text style={S.sectionLabel}>Margin impact</Text><Text style={S.bodyText}>{ins.marginImpact}</Text></>}
                {ins.responsibilitySplit && (
                  <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={S.sectionLabel}>Seller</Text>
                      {(ins.responsibilitySplit.seller ?? []).map((r, i) => <Text key={i} style={S.bodyText}>• {r}</Text>)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.sectionLabel}>Buyer</Text>
                      {(ins.responsibilitySplit.buyer ?? []).map((r, i) => <Text key={i} style={S.bodyText}>• {r}</Text>)}
                    </View>
                  </View>
                )}
                {ins.warning && (
                  <View style={{ backgroundColor: B.amberBg, borderWidth: 1, borderColor: B.amberBdr, borderStyle: 'solid', borderRadius: 4, padding: 6, marginTop: 6 }}>
                    <Text style={{ fontSize: 7.5, color: B.amber }}>⚠ {ins.warning}</Text>
                  </View>
                )}
              </SectionCard>
            );
          })()}

          {/* ── 4. Line Items ── */}
          {items.length > 0 ? (
            <View style={S.card} wrap={false}>
              <View style={S.cardHead}>
                <Text style={S.cardHeadText}>Line Items</Text>
              </View>
              <View style={S.cardBody}>
                <View style={S.lineItemHeader}>
                  <Text style={S.colSkuH}>SKU</Text>
                  <Text style={S.colNameH}>Description</Text>
                  <Text style={S.colQtyH}>Qty</Text>
                  <Text style={S.colPriceH}>Unit Price</Text>
                  <Text style={S.colTotalH}>Total</Text>
                </View>
                {items.map((item, i) => (
                  <View key={item.id} style={i < items.length - 1 ? S.lineItemRow : S.lineItemRowLast}>
                    <Text style={S.colSku}>{item.sku ?? '—'}</Text>
                    <Text style={S.colName}>{item.name}</Text>
                    <Text style={S.colQty}>{item.quantity}</Text>
                    <Text style={S.colPrice}>{fmt(item.unitPrice, item.currency)}</Text>
                    <Text style={S.colTotal}>{fmt(item.unitPrice * item.quantity, item.currency)}</Text>
                  </View>
                ))}
                <View style={S.totalRow}>
                  <Text style={S.totalLabel}>Total</Text>
                  <Text style={S.totalVal}>{fmt(totalValue, deal.currency)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <SectionCard title="Pricing">
              <KVRow label="Unit price"    value={fmt(deal.unitPrice, deal.currency)} />
              <KVRow label="Quantity"      value={String(deal.quantity)} />
              <KVRow label="Total value"   value={fmt(totalValue, deal.currency)} isLast />
            </SectionCard>
          )}

          {/* ── 4b. Export Execution Playbook (if available) ── */}
          {deal.dealPlaybook && (() => {
            const pb = deal.dealPlaybook as unknown as DealPlaybook;
            return (
              <>
                {/* YOUR NEXT STEPS — primary brand color header */}
                {(pb.nextActions ?? []).length > 0 && (
                  <View style={S.card}>
                    <View style={{ ...S.cardHead, backgroundColor: '#01696f' }}>
                      <Text style={{ ...S.cardHeadText, color: B.white }}>YOUR NEXT STEPS</Text>
                    </View>
                    <View style={S.cardBody}>
                      {(pb.nextActions as unknown as { action?: string; text?: string; priority: string; category: string }[]).map((a, i) => (
                        <View key={i} style={{ ...S.tableRow, alignItems: 'flex-start' }}>
                          <Text style={{ width: '6%', fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#01696f' }}>{i + 1}.</Text>
                          <Text style={{ width: '70%', fontSize: 8, color: B.bodySub, lineHeight: 1.4 }}>{a.text ?? a.action}</Text>
                          <View style={{ width: '24%', flexDirection: 'row', justifyContent: 'flex-end', gap: 3 }}>
                            <View style={a.priority === 'high' ? S.chipRed : a.priority === 'low' ? S.chipGreen : S.chipAmber}>
                              <Text style={a.priority === 'high' ? S.chipTextRed : a.priority === 'low' ? S.chipTextGreen : S.chipTextAmber}>{a.priority}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Compliance */}
                {(pb.compliance ?? []).length > 0 && (
                  <SectionCard title="Compliance Requirements">
                    {pb.compliance.map((c, i) => (
                      <Text key={i} style={{ fontSize: 8, color: B.bodySub, lineHeight: 1.5, paddingLeft: 12, marginBottom: 2 }}>● {c}</Text>
                    ))}
                  </SectionCard>
                )}
                {/* Documentation */}
                {(pb.documentation ?? []).length > 0 && (
                  <SectionCard title="Documentation Checklist">
                    {pb.documentation.map((d, i) => (
                      <Text key={i} style={{ fontSize: 8, color: B.bodySub, lineHeight: 1.5, paddingLeft: 12, marginBottom: 2 }}>● {d}</Text>
                    ))}
                  </SectionCard>
                )}
                {/* Risks — amber border */}
                {(pb.risks ?? []).length > 0 && (
                  <View style={{ ...S.card, borderColor: B.amberBdr }}>
                    <View style={{ ...S.cardHead, backgroundColor: B.amberBg }}>
                      <Text style={{ ...S.cardHeadText, color: B.amber }}>Deal Risks</Text>
                    </View>
                    <View style={S.cardBody}>
                      {pb.risks.map((r, i) => (
                        <View key={i} style={{ borderLeftWidth: 2, borderLeftColor: '#f59e0b', borderLeftStyle: 'solid', paddingLeft: 8, marginBottom: 3 }}>
                          <Text style={{ fontSize: 8, color: B.amber, lineHeight: 1.5 }}>● {r}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            );
          })()}

          {/* ── 5. Suggested Clause Checklist ── */}
          <View style={S.card}>
            <View style={S.cardHead}>
              <Text style={S.cardHeadText}>Suggested Clause Checklist — For Advisor Review</Text>
            </View>
            <View style={S.cardBody}>
              {/* First group */}
              <View wrap={false}>
                {KEY_CLAUSES.slice(0, 4).map((clause, i) => (
                  <View key={i} style={S.clauseItem}>
                    <View style={S.clauseBox} />
                    <View style={{ flex: 1 }}>
                      <Text style={S.clauseText}>{clause.label}</Text>
                      <Text style={S.clauseNote}>{clause.note}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {/* Second group */}
              <View wrap={false}>
                {KEY_CLAUSES.slice(4).map((clause, i) => (
                  <View key={i} style={S.clauseItem}>
                    <View style={S.clauseBox} />
                    <View style={{ flex: 1 }}>
                      <Text style={S.clauseText}>{clause.label}</Text>
                      <Text style={S.clauseNote}>{clause.note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── 6. Disclaimer ── */}
          <View style={S.disclaimer}>
            <Text style={S.disclaimerTitle}>Reference Document Only — Not a Legal Contract</Text>
            <Text style={S.disclaimerText}>
              This Deal Dossier is generated by AI for informational and reference purposes only.
              It does not constitute legal advice, a binding agreement, or a substitute for professional
              trade or legal counsel. All HS Code classifications, duty rates, and Incoterm allocations
              should be verified with a licensed customs broker. Engage a qualified trade lawyer before
              executing any international trade agreement.
            </Text>
          </View>

          {/* ── 7. Slim promo strip ── */}
          <View style={{ backgroundColor: B.bg, borderTopWidth: 1, borderTopColor: B.border, borderTopStyle: 'solid', paddingVertical: 8, paddingHorizontal: 14, marginTop: 12 }}>
            <Text style={{ fontSize: 7, color: B.muted, textAlign: 'center' }}>
              Explore Mercorama tools: Export Compass · FTA Diversify · HS Code Assistant · Incoterms Analyzer — mercorama.com
            </Text>
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
