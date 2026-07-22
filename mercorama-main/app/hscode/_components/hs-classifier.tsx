// app/hscode/_components/hs-classifier.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search,
  PackageSearch,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FileCheck,
  Layers,
  ShieldAlert,
  Landmark,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HsClassificationResult {
  selectedCode: {
    code: string;
    description: string;
    confidenceScore: number;
    confidenceLevel: 'High' | 'Medium' | 'Low';
    griBasis: string[];
    mercoramaReasoning: string;
    // Layer 1: HS code validation against WCO HS 2022
    codeVerified?: boolean;
    codeSource?: string;
    codeWarning?: string;
    nearestValidCodes?: { code: string; description: string }[];
  };
  references: {
    supportingRulings: { id: string; url: string; jurisdiction: string }[];
    notesCited: string[];
  };
  attestation: {
    standardizedItemDescription: string;
    descriptionQuality: 'High' | 'Medium' | 'Low';
    descriptionComments: string[];
  };
  indentAnalysis: {
    level: number;
    heading: string;
    title: string;
    analysis: string;
  }[];
  risk: {
    overallRiskLevel: 'High' | 'Medium' | 'Low';
    misclassificationRisks: string[];
    recommendedEvidence: string[];
  };
  duty: {
    destinationCountry: string | null;
    estimatedRate: string | null;
    basis: string | null;
    notes: string | null;
    // Layer 2: tariff verification
    rateVerified?: boolean;
    rateSource?: string;
  };
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const CONFIDENCE_STYLE: Record<string, string> = {
  High:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Low:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const RISK_STYLE: Record<string, string> = {
  High:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Low:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const RISK_DOT_STYLE: Record<string, string> = {
  High:   'bg-red-500',
  Medium: 'bg-amber-500',
  Low:    'bg-green-500',
};

// ─── Primitive helpers ─────────────────────────────────────────────────────────

function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', style)}>
      {label}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground italic">None noted.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="text-foreground/80 leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Confidence label badges (Layer 5) ────────────────────────────────────────

function TariffBadge({ verified, source }: { verified?: boolean; source?: string }) {
  if (verified === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
        Verified · {source ?? 'National schedule'}
      </span>
    );
  }
  if (verified === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
        Estimated · verify before quoting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
      Unknown · consult customs broker
    </span>
  );
}

function HsCodeBadge({ verified, warning }: { verified?: boolean; warning?: string }) {
  if (verified === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
        WCO HS 2022 verified
      </span>
    );
  }
  return (
    <span title={warning} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
      {warning ?? 'Code unverified — check before filing'}
    </span>
  );
}

function getDutyHeadline(duty: HsClassificationResult['duty']): string {
  if (duty.estimatedRate && duty.destinationCountry) {
    return `Est. ${duty.estimatedRate} MFN to ${duty.destinationCountry}`;
  }
  if (duty.estimatedRate) return `Est. ${duty.estimatedRate} MFN duty`;
  if (duty.destinationCountry) return `Verify rate to ${duty.destinationCountry}`;
  return 'Verify duty rate with broker';
}

// ─── HsSummaryBanner ──────────────────────────────────────────────────────────
// Exported so Deal Wizard and other features can reuse it.

export function HsSummaryBanner({
  result,
  dealNote,
}: {
  result: HsClassificationResult;
  dealNote?: string;
}) {
  const { selectedCode, risk, duty } = result;
  const dutyHeadline = getDutyHeadline(duty);

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Left: code + description (spans 2 cols) */}
        <div className="sm:col-span-2 min-w-0">
          <p className="font-mono text-3xl font-bold tracking-widest text-primary leading-none">
            {selectedCode.code}
          </p>
          <p className="mt-2 text-sm leading-snug text-foreground/80 line-clamp-2">
            {selectedCode.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedCode.griBasis.map((gri, i) => (
              <span
                key={i}
                className="rounded border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-xs text-primary"
              >
                {gri}
              </span>
            ))}
            <HsCodeBadge verified={selectedCode.codeVerified} warning={selectedCode.codeWarning} />
          </div>
          {selectedCode.codeVerified === false && selectedCode.nearestValidCodes?.length ? (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Nearest valid codes: {selectedCode.nearestValidCodes.slice(0, 3).map(c => c.code).join(', ')}
            </p>
          ) : null}
          {dealNote && (
            <p className="mt-2.5 text-xs text-muted-foreground border-t pt-2">
              {dealNote}
            </p>
          )}
        </div>

        {/* Right: badge stack */}
        <div className="flex flex-row flex-wrap sm:flex-col sm:items-end items-center gap-2">
          <Badge
            label={`${selectedCode.confidenceLevel} confidence`}
            style={CONFIDENCE_STYLE[selectedCode.confidenceLevel]}
          />
          <Badge
            label={`${risk.overallRiskLevel} risk`}
            style={RISK_STYLE[risk.overallRiskLevel]}
          />
          <span className="text-xs text-muted-foreground sm:text-right">{dutyHeadline}</span>
          <span className="text-xs tabular-nums text-muted-foreground/70 sm:text-right">
            {(selectedCode.confidenceScore * 100).toFixed(0)}% match
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── HsBreadcrumbPath ─────────────────────────────────────────────────────────
// Exported for reuse.

export function HsBreadcrumbPath({
  code,
  indentAnalysis,
}: {
  code: string;
  indentAnalysis: HsClassificationResult['indentAnalysis'];
}) {
  // Build: Chapter → indent headings → final code (de-duped)
  const chapter = code.replace(/\D/g, '').slice(0, 2);
  const allCrumbs = [
    { code: `Ch. ${chapter}`, title: `Chapter ${chapter}`, isFinal: false },
    ...indentAnalysis.map((e) => ({ code: e.heading, title: e.title, isFinal: false })),
    { code, title: 'Selected code', isFinal: true },
  ];

  // Deduplicate by code value
  const seen = new Set<string>();
  const crumbs = allCrumbs.filter((c) => {
    if (seen.has(c.code)) return false;
    seen.add(c.code);
    return true;
  });

  return (
    <div className="flex flex-wrap items-center gap-1">
      {crumbs.map((crumb, i) => (
        <span key={crumb.code} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
          <span
            className={cn(
              'font-mono text-xs rounded px-1.5 py-0.5 transition-colors',
              crumb.isFinal
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted text-muted-foreground'
            )}
            title={crumb.title}
          >
            {crumb.code}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── HsAccordionSection ───────────────────────────────────────────────────────

function HsAccordionSection({
  title,
  icon,
  hint,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary shrink-0">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
          {!open && hint && (
            <span className="text-xs text-muted-foreground truncate">· {hint}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Section IDs ──────────────────────────────────────────────────────────────

const ALL_SECTION_IDS = ['code', 'path', 'attestation', 'legal', 'risk', 'duty'] as const;
type SectionId = typeof ALL_SECTION_IDS[number];

// ─── HsDossier ────────────────────────────────────────────────────────────────
// Full accordion dossier. Exported for Deal Wizard and other consumers.

export function HsDossier({
  result,
  dealNote,
  expandAll: defaultExpandAll = false,
}: {
  result: HsClassificationResult;
  dealNote?: string;
  expandAll?: boolean;
}) {
  const { selectedCode, references, attestation, indentAnalysis, risk, duty } = result;
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    defaultExpandAll ? new Set<SectionId>(ALL_SECTION_IDS) : new Set(['code'])
  );

  function toggle(id: SectionId) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allExpanded = ALL_SECTION_IDS.every((id) => openSections.has(id));

  function toggleAll() {
    setOpenSections(
      allExpanded ? new Set<SectionId>(['code']) : new Set<SectionId>(ALL_SECTION_IDS)
    );
  }

  // Hints for collapsed sections
  const pathHint = `${indentAnalysis.length} levels`;
  const attHint = `${attestation.descriptionQuality} quality`;
  const legalHint = [
    references.supportingRulings.length && `${references.supportingRulings.length} rulings`,
    references.notesCited.length && `${references.notesCited.length} notes`,
  ]
    .filter(Boolean)
    .join(' · ') || 'No references';
  const riskHint = `${risk.overallRiskLevel} risk · ${risk.misclassificationRisks.length} factors`;
  const dutyHint = duty.estimatedRate
    ? `Est. ${duty.estimatedRate}`
    : duty.destinationCountry
    ? `To ${duty.destinationCountry}`
    : 'Rate unknown';

  return (
    <div className="space-y-3">
      {/* Summary banner — sticky context at a glance */}
      <HsSummaryBanner result={result} dealNote={dealNote} />

      {/* Expand / Collapse control */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* ── Code & Reasoning ── */}
      <HsAccordionSection
        title="Code & Reasoning"
        icon={<CheckCircle2 className="h-4 w-4" />}
        open={openSections.has('code')}
        onToggle={() => toggle('code')}
      >
        <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
          {selectedCode.griBasis.map((gri, i) => (
            <span
              key={i}
              className="rounded border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-xs text-primary"
            >
              {gri}
            </span>
          ))}
        </div>
        <div className="rounded-md border-l-2 border-primary/40 bg-muted/30 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Mercorama Reasoning
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {selectedCode.mercoramaReasoning}
          </p>
        </div>
      </HsAccordionSection>

      {/* ── Classification Path ── */}
      <HsAccordionSection
        title="Classification Path"
        icon={<Layers className="h-4 w-4" />}
        hint={pathHint}
        open={openSections.has('path')}
        onToggle={() => toggle('path')}
      >
        <div className="mt-3 mb-4">
          <HsBreadcrumbPath code={selectedCode.code} indentAnalysis={indentAnalysis} />
        </div>
        {indentAnalysis.length > 0 && (
          <div className="space-y-3">
            {indentAnalysis.map((entry, i) => (
              <div
                key={i}
                className="relative pl-3 border-l-2 border-primary/20"
                style={{ marginLeft: `${(entry.level - 1) * 12}px` }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                    {entry.heading}
                  </span>
                  <span className="text-xs text-muted-foreground">Level {entry.level}</span>
                </div>
                <p className="text-xs font-medium text-foreground/90 mb-0.5">{entry.title}</p>
                <p className="text-xs text-muted-foreground leading-snug">{entry.analysis}</p>
              </div>
            ))}
          </div>
        )}
      </HsAccordionSection>

      {/* ── Attestation ── */}
      <HsAccordionSection
        title="Customs Description"
        icon={<FileCheck className="h-4 w-4" />}
        hint={attHint}
        open={openSections.has('attestation')}
        onToggle={() => toggle('attestation')}
      >
        <div className="flex items-center justify-between mt-3 mb-3">
          <p className="text-xs text-muted-foreground">Description quality</p>
          <Badge
            label={attestation.descriptionQuality}
            style={CONFIDENCE_STYLE[attestation.descriptionQuality]}
          />
        </div>
        <div className="rounded-md border bg-muted/20 px-3 py-2.5 mb-3">
          <p className="text-sm leading-relaxed italic text-foreground/80">
            &ldquo;{attestation.standardizedItemDescription}&rdquo;
          </p>
        </div>
        {attestation.descriptionComments.length > 0 && (
          <BulletList items={attestation.descriptionComments} />
        )}
      </HsAccordionSection>

      {/* ── Legal References ── */}
      <HsAccordionSection
        title="Legal References"
        icon={<BookOpen className="h-4 w-4" />}
        hint={legalHint}
        open={openSections.has('legal')}
        onToggle={() => toggle('legal')}
      >
        {references.supportingRulings.length === 0 && references.notesCited.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground italic">No legal references cited.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {references.supportingRulings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Supporting Rulings</p>
                <ul className="space-y-1.5">
                  {references.supportingRulings.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Landmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-mono text-xs text-foreground/80">{r.id}</span>
                      <span className="text-xs text-muted-foreground">— {r.jurisdiction}</span>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-primary hover:underline shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {references.notesCited.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Notes Cited</p>
                <BulletList items={references.notesCited} />
              </div>
            )}
          </div>
        )}
      </HsAccordionSection>

      {/* ── Risk & Compliance ── */}
      <HsAccordionSection
        title="Risk & Compliance"
        icon={<ShieldAlert className="h-4 w-4" />}
        hint={riskHint}
        open={openSections.has('risk')}
        onToggle={() => toggle('risk')}
      >
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-4">
            <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', RISK_DOT_STYLE[risk.overallRiskLevel])} />
            <span className="text-sm font-semibold">
              {risk.overallRiskLevel} misclassification risk
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Risks if misclassified
              </p>
              <BulletList items={risk.misclassificationRisks} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5" /> Evidence to keep on file
              </p>
              <BulletList items={risk.recommendedEvidence} />
            </div>
          </div>
        </div>
      </HsAccordionSection>

      {/* ── Duty Snapshot ── */}
      <HsAccordionSection
        title="Duty Snapshot"
        icon={<Landmark className="h-4 w-4" />}
        hint={dutyHint}
        open={openSections.has('duty')}
        onToggle={() => toggle('duty')}
      >
        <div className="mt-3">
          {!duty.destinationCountry && !duty.estimatedRate ? (
            <p className="text-sm text-muted-foreground italic">
              Provide a destination country to see estimated duty rates.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Left: key figures */}
              <div className="space-y-2 text-sm">
                {duty.destinationCountry && (
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-medium">{duty.destinationCountry}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-b pb-2 gap-2">
                  <span className="text-muted-foreground shrink-0">Est. MFN rate</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-semibold text-primary">
                      {duty.estimatedRate ?? '—'}
                    </span>
                    <TariffBadge verified={duty.rateVerified} source={duty.rateSource} />
                  </div>
                </div>
                {duty.basis && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Basis</span>
                    <span className="text-right text-xs">{duty.basis}</span>
                  </div>
                )}
              </div>
              {/* Right: explanatory note */}
              {duty.notes && (
                <div className="text-xs text-muted-foreground leading-relaxed italic sm:border-l sm:pl-3 sm:pt-0 pt-2 border-t sm:border-t-0">
                  {duty.notes}
                </div>
              )}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground/60 leading-snug">
            Estimates are indicative only. Verify with official national tariff schedule and a licensed customs broker before filing.
          </p>
        </div>
      </HsAccordionSection>

      {/* ── Source attribution ── */}
      <p className="text-[11px] text-muted-foreground/50 leading-snug pt-1">
        Classification based on the{' '}
        <a
          href="https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/hs-nomenclature-2022-edition.aspx"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-muted-foreground"
        >
          WCO Harmonized System 2022 (HS 2022) nomenclature
        </a>
        , as published by the World Customs Organization. AI-generated — always verify with a licensed customs broker before filing.
      </p>
    </div>
  );
}

// ─── Form schema ─────────────────────────────────────────────────────────────

const formSchema = z.object({
  description: z.string().min(10, 'Please provide at least 10 characters'),
  originCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
});

// ─── Main component ───────────────────────────────────────────────────────────

export function HsClassifier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HsClassificationResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: '', originCountry: '', destinationCountry: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/hscode/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: values.description,
          originCountry: values.originCountry || null,
          destinationCountry: values.destinationCountry || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Classification failed');
      }

      setResult(data.result as HsClassificationResult);
      toast.success('Classification complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--trade-buyer))]/10 px-3 py-1.5">
          <Search className="h-4 w-4 text-[hsl(var(--trade-buyer))]" />
          <span className="text-sm font-medium">Harmonized System</span>
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-balance">
          HS Code Assistant
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground text-pretty">
          Get accurate HS Code classifications with AI-powered analysis. Understand duty implications,
          misclassification risks, and applicable trade agreements for your products.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left panel — form (sticky on tall screens) */}
        <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Wireless Bluetooth headphones with noise cancellation, plastic and metal housing, rechargeable lithium battery"
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific: materials, function, and key features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin Country (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., China" {...field} />
                        </FormControl>
                        <FormDescription>
                          Helps identify applicable trade agreements
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destinationCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Country (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., United States" {...field} />
                        </FormControl>
                        <FormDescription>
                          Required for duty rate calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Classifying…
                      </>
                    ) : (
                      'Classify Product'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-6 border-[hsl(var(--trade-buyer))]/20 bg-[hsl(var(--trade-buyer))]/5">
            <CardHeader>
              <CardTitle className="text-base">What is an HS Code?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              <p className="mb-3">
                The Harmonized System (HS) is a standardized numerical method of classifying
                traded products used by customs authorities worldwide.
              </p>
              <p>
                Accurate classification is critical for determining duty rates, trade statistics,
                and regulatory compliance. Always verify classifications with your customs broker.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right panel — dossier (scrollable) */}
        <div className="lg:col-span-3">
          {loading && (
            <Card>
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h3 className="mb-1 text-lg font-semibold">Classifying product…</h3>
                  <p className="text-sm text-muted-foreground">
                    Applying GRI rules and building your classification dossier.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && error && (
            <Card className="border-destructive/50">
              <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <p className="font-medium text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground">Please revise your description and try again.</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && !result && (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12 text-center">
                <PackageSearch className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Ready to Classify</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Describe your product to receive a full HS classification dossier — code,
                    GRI analysis, legal references, risk assessment, and duty snapshot.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && result && (
            <>
              <HsDossier result={result} />
              {/* ── Use this HS code in other tools ── */}
              <div className="mt-4 rounded-lg border bg-muted/30 px-4 py-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Use HS {result.selectedCode.code} in other tools
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <a
                    href={`/dashboard?tool=export-compass&hsCode=${encodeURIComponent(result.selectedCode.code)}&product=${encodeURIComponent(form.getValues('description'))}`}
                    className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-sm font-semibold">Export Compass</span>
                    <span className="text-xs text-muted-foreground">Find global markets for this product</span>
                  </a>
                  <a
                    href={`/fta-diversify?hsCode=${encodeURIComponent(result.selectedCode.code)}&productDescription=${encodeURIComponent(form.getValues('description'))}`}
                    className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-sm font-semibold">FTA Diversifier</span>
                    <span className="text-xs text-muted-foreground">Check free trade agreement coverage</span>
                  </a>
                  <a
                    href={`/dashboard?tool=deal&hsCode=${encodeURIComponent(result.selectedCode.code)}&product=${encodeURIComponent(form.getValues('description'))}`}
                    className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-sm font-semibold">Deal Wizard</span>
                    <span className="text-xs text-muted-foreground">Structure a trade deal for this product</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
