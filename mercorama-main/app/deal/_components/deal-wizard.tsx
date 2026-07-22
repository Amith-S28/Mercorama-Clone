// app/deal/_components/deal-wizard.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  CheckCircle2, ChevronRight, AlertTriangle, Loader2,
  PackageSearch, ArrowLeft, Download, FolderOpen, Mail, FileDown, Ship,
  Globe, Package, RefreshCw, Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createDeal, updateDeal, type Deal } from '@/lib/deals';
import { createDealDocument, listDealDocuments, type DealDocument } from '@/lib/deal-documents';
import { createDealItem, listDealItems, type DealItem } from '@/lib/deal-items';
import { INCOTERMS_2020 } from '@/lib/incoterms-data';
import { KEY_PORTS } from '@/lib/ports';
import {
  LineItemsEditor,
  PricingTable,
  emptyDraftItem,
  filledDraftItems,
  validateDraftItems,
  type DraftItem,
} from '@/app/deal/_components/line-items-editor';
import {
  HsDossier,
  HsSummaryBanner,
  type HsClassificationResult,
} from '@/app/hscode/_components/hs-classifier';
import { HsEnhancementPanel, IncotermInsightPanel, DealPlaybookPanel } from './playbook-enhancements';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'SGD', 'AED'];

const INCOTERM_OPTIONS = Object.values(INCOTERMS_2020).map((i) => ({
  value: i.code,
  label: `${i.code} — ${i.name}`,
}));

// Freight and insurance defaults per Incoterm (used to auto-set Step 3 radio buttons)
const INCOTERM_DEFAULTS: Record<string, { freight: 'Seller' | 'Buyer'; insurance: 'Seller' | 'Buyer' }> = {
  EXW: { freight: 'Buyer',  insurance: 'Buyer'  },
  FCA: { freight: 'Buyer',  insurance: 'Buyer'  },
  CPT: { freight: 'Seller', insurance: 'Buyer'  },
  CIP: { freight: 'Seller', insurance: 'Seller' },
  DAP: { freight: 'Seller', insurance: 'Buyer'  },
  DPU: { freight: 'Seller', insurance: 'Buyer'  },
  DDP: { freight: 'Seller', insurance: 'Seller' },
  FOB: { freight: 'Buyer',  insurance: 'Buyer'  },
  CFR: { freight: 'Seller', insurance: 'Buyer'  },
  CIF: { freight: 'Seller', insurance: 'Seller' },
};

const STEPS = [
  { n: 1, label: 'Product & Buyer' },
  { n: 2, label: 'HS Dossier' },
  { n: 3, label: 'Incoterm & Pricing' },
  { n: 4, label: 'Deal Dossier' },
] as const;

// ─── Shared badge / risk helpers ──────────────────────────────────────────────

const RISK_STYLE: Record<string, string> = {
  High:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Low:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};


function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', style)}>
      {label}
    </span>
  );
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

function Stepper({ current, onNavigate }: { current: number; onNavigate?: (n: 1 | 2 | 3 | 4) => void }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, idx) => {
        const isCompleted = current > s.n;
        const isClickable = isCompleted && s.n >= 2 && onNavigate;
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? () => onNavigate(s.n as 1 | 2 | 3 | 4) : undefined}
                onKeyDown={isClickable ? (e) => e.key === 'Enter' && onNavigate(s.n as 1 | 2 | 3 | 4) : undefined}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors',
                  current === s.n
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isCompleted
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-muted text-muted-foreground border-border',
                  isClickable && 'cursor-pointer hover:bg-primary/30',
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  current === s.n ? 'text-foreground' : 'text-muted-foreground',
                  isClickable && 'cursor-pointer hover:text-foreground',
                )}
                onClick={isClickable ? () => onNavigate(s.n as 1 | 2 | 3 | 4) : undefined}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2', isCompleted ? 'bg-primary/40' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Deal summary sidebar card ────────────────────────────────────────────────

function DealSummaryCard({
  deal,
  documentCount,
  items,
}: {
  deal: Partial<Deal>;
  documentCount?: number;
  items?: DealItem[];
}) {
  const itemsSubtotal =
    items && items.length > 0
      ? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      : null;
  const total = itemsSubtotal ?? (deal.unitPrice ?? 0) * (deal.quantity ?? 1);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Deal Summary
          </CardTitle>
          {documentCount !== undefined && documentCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <FolderOpen className="h-3 w-3" />
              {documentCount === 1 ? '1 Document' : `${documentCount} Documents`}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {deal.sellerName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seller</span>
            <span className="font-medium">{deal.sellerName}</span>
          </div>
        )}
        {deal.buyerName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Buyer</span>
            <span className="font-medium">{deal.buyerName}</span>
          </div>
        )}
        {deal.buyerCountry && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Destination</span>
            <span className="font-medium">{deal.buyerCountry}</span>
          </div>
        )}
        {deal.productDescription && (
          <div className="border-t pt-2">
            <p className="text-muted-foreground mb-0.5">Product</p>
            <p className="font-medium line-clamp-2">{deal.productDescription}</p>
          </div>
        )}
        {deal.hsCode && (
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">HS Code</span>
            <span className="font-mono font-semibold text-primary">{deal.hsCode}</span>
          </div>
        )}
        {deal.hsRiskLevel && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">HS Risk</span>
            <Badge label={deal.hsRiskLevel} style={RISK_STYLE[deal.hsRiskLevel]} />
          </div>
        )}
        {deal.hsDutyNote && (
          <p className="text-xs text-muted-foreground italic border-t pt-2">{deal.hsDutyNote}</p>
        )}
        {deal.incoterm && (
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Incoterm</span>
            <span className="font-semibold">{deal.incoterm}</span>
          </div>
        )}
        {deal.incotermPlace && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Named Place</span>
            <span className="font-medium text-right max-w-[55%]">{deal.incotermPlace}</span>
          </div>
        )}
        {items && items.length > 0 ? (
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Line Items</span>
              <span className="font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1 mt-1">
              <span>Subtotal</span>
              <span className="text-primary">
                {deal.currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ) : deal.unitPrice !== undefined && deal.unitPrice > 0 ? (
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Price</span>
              <span>{deal.currency} {deal.unitPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span>{deal.quantity?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1 mt-1">
              <span>Total</span>
              <span className="text-primary">{deal.currency} {total.toLocaleString()}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// MiniHsDossier replaced by the shared HsDossier accordion component (imported above).

// ─── Step 1 form schema & component ──────────────────────────────────────────

const step1Schema = z.object({
  productDescription: z.string().min(10, 'Please describe the product in at least 10 characters'),
  sellerName: z.string().min(1, 'Required'),
  buyerName: z.string().min(1, 'Required'),
  buyerCountry: z.string().min(2, 'Required'),
  currency: z.string().min(1, 'Required'),
  unitPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().min(1),
});

type Step1Values = z.infer<typeof step1Schema>;

function Step1({
  onSuccess,
}: {
  onSuccess: (deal: Deal, dossier: HsClassificationResult) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyDraftItem()]);

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      productDescription: '',
      sellerName: 'Mercorama Export Co.',
      buyerName: '',
      buyerCountry: '',
      currency: 'CAD',
      unitPrice: 0,
      quantity: 1,
    },
  });

  // ── Sync: line items → unitPrice (total value) + quantity (total qty) ────────
  const lineItemsSyncing = useRef(false);

  useEffect(() => {
    const filled = filledDraftItems(draftItems);
    if (filled.length === 0) return;
    const totalQty = filled.reduce((s, i) => s + i.quantity, 0);
    const totalValue = filled.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    lineItemsSyncing.current = true;
    form.setValue('quantity', totalQty, { shouldValidate: false });
    form.setValue('unitPrice', parseFloat(totalValue.toFixed(2)), { shouldValidate: false });
    lineItemsSyncing.current = false;
  }, [draftItems]);

  const hasFilledItems = filledDraftItems(draftItems).length > 0;

  // ── Sync: unitPrice / quantity → first line item (when no items filled yet) ──
  const watchedUnitPrice = form.watch('unitPrice');
  const watchedQuantity = form.watch('quantity');

  useEffect(() => {
    if (lineItemsSyncing.current) return;
    const filled = filledDraftItems(draftItems);
    if (filled.length > 0) return; // line items take precedence
    if (!watchedUnitPrice && !watchedQuantity) return;
    setDraftItems((prev) => {
      const first = prev[0];
      if (!first) return prev;
      return [
        { ...first, unitPrice: watchedUnitPrice || first.unitPrice, quantity: watchedQuantity || first.quantity },
        ...prev.slice(1),
      ];
    });
  }, [watchedUnitPrice, watchedQuantity]);

  async function onSubmit(values: Step1Values) {
    // Validate line items before the async work
    const itemValidationError = validateDraftItems(draftItems);
    if (itemValidationError) {
      setItemsError(itemValidationError);
      return;
    }
    setItemsError(null);
    setLoading(true);
    setError(null);

    try {
      // 1 — classify with HS API
      const hsRes = await fetch('/api/hscode/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: values.productDescription,
          originCountry: 'Canada',
          destinationCountry: values.buyerCountry,
        }),
      });
      const hsData = await hsRes.json();
      if (!hsRes.ok) throw new Error(hsData.error ?? 'HS classification failed');
      const dossier = hsData.result as HsClassificationResult;

      // 2 — map HS fields
      const hsCode = dossier.selectedCode.code;
      const hsDescription = dossier.selectedCode.description;
      const hsRiskLevel = dossier.risk.overallRiskLevel;
      const hsDutyNote =
        dossier.duty.notes ??
        (dossier.duty.estimatedRate
          ? `Estimated MFN duty rate: ${dossier.duty.estimatedRate}. Verify with customs broker.`
          : 'Verify applicable duty rates with a licensed customs broker.');

      // 3 — persist deal (keep unitPrice/quantity on Deal for backward compat)
      const filled = filledDraftItems(draftItems);
      const aggregateQty = filled.length > 0 ? filled.reduce((s, i) => s + i.quantity, 0) : values.quantity;
      const impliedUnitPrice =
        filled.length > 0
          ? filled.reduce((s, i) => s + i.unitPrice * i.quantity, 0) / aggregateQty
          : values.unitPrice;

      const deal = await createDeal({
        status: 'draft',
        sellerName: values.sellerName,
        buyerName: values.buyerName,
        buyerCountry: values.buyerCountry,
        currency: values.currency,
        unitPrice: impliedUnitPrice,
        quantity: aggregateQty,
        productDescription: values.productDescription,
        hsCode,
        hsDescription,
        hsRiskLevel,
        hsDutyNote,
      });

      // 4 — persist line items (if any filled rows)
      if (filled.length > 0) {
        await Promise.all(
          filled.map((item) =>
            createDealItem({
              dealId: deal.id,
              sku: item.sku || undefined,
              name: item.name,
              hsCode,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              currency: values.currency,
            })
          )
        );
      }

      onSuccess(deal, dossier);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Product &amp; Buyer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="productDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Cold-pressed canola oil in 1-litre PET bottles, food-grade, for retail consumption"
                          className="min-h-[110px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific — materials, function, state. The HS code is derived from this.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sellerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Name *</FormLabel>
                        <FormControl><Input placeholder="Your company name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buyer Name *</FormLabel>
                        <FormControl><Input placeholder="Buyer company name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="buyerCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer Country *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., United States, Germany, Japan" {...field} />
                      </FormControl>
                      <FormDescription>Used to look up duty rates for the destination.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            readOnly={hasFilledItems}
                            className={cn(hasFilledItems && 'bg-muted text-muted-foreground cursor-default')}
                            {...field}
                          />
                        </FormControl>
                        {hasFilledItems && (
                          <p className="text-xs text-primary flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Calculated from line items
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="1"
                            readOnly={hasFilledItems}
                            className={cn(hasFilledItems && 'bg-muted text-muted-foreground cursor-default')}
                            {...field}
                          />
                        </FormControl>
                        {hasFilledItems && (
                          <p className="text-xs text-primary flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Calculated from line items
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ─ Line Items ─ */}
                <div className="border-t pt-5">
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Line Items</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define the specific products or variants in this deal. Add multiple SKUs if needed.
                    </p>
                  </div>
                  <LineItemsEditor
                    items={draftItems}
                    currency={form.watch('currency') || 'CAD'}
                    onChange={setDraftItems}
                  />
                  {itemsError && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive mt-2">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {itemsError}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Classifying with HS Code…
                    </>
                  ) : (
                    <>
                      Continue — Classify with HS Code
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="border-dashed">
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 py-8 text-center">
            <PackageSearch className="h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium">HS Classification</p>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Your HS dossier will appear here after Step 1 is submitted.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Step 2: HS Dossier confirm ───────────────────────────────────────────────

function Step2({
  deal,
  dossier,
  items,
  onConfirm,
  onBack,
  onGenerateDossier,
  dossierGenerating,
  hasExistingDossier,
  documentCount,
}: {
  deal: Deal;
  dossier: HsClassificationResult;
  items: DealItem[];
  onConfirm: () => void;
  onBack: () => void;
  onGenerateDossier: () => Promise<void>;
  dossierGenerating: boolean;
  hasExistingDossier: boolean;
  documentCount: number;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Left: deal summary */}
      <div className="lg:col-span-2 space-y-4">
        <DealSummaryCard deal={deal} documentCount={documentCount} items={items} />

        {/* Line items preview */}
        {items.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Line items
              </p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id} className="text-xs text-foreground/80 flex justify-between gap-2">
                    <span>
                      {item.sku && <span className="font-mono text-muted-foreground mr-1">[{item.sku}]</span>}
                      {item.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground shrink-0">
                      {item.quantity} × {item.currency} {item.unitPrice.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-2">
                All items inherit HS{' '}
                <span className="font-mono font-semibold text-primary">{dossier.selectedCode.code}</span>
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 text-sm space-y-2">
            <p className="font-semibold text-primary">Review your HS classification</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Confirm the HS code before proceeding — it will be embedded in your contract
              and customs documents. If the product description was inaccurate, go back and revise it.
            </p>
            <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Code:</span> {dossier.selectedCode.code}</p>
              <p><span className="font-medium text-foreground">Risk:</span> {dossier.risk.overallRiskLevel}</p>
              {(dossier.duty.estimatedRate || dossier.duty.destinationCountry) && (
                <p className="flex items-center flex-wrap gap-1.5">
                  <span className="font-medium text-foreground">Duty:</span>{' '}
                  {dossier.duty.estimatedRate
                    ? `Est. ${dossier.duty.estimatedRate}${dossier.duty.destinationCountry ? ` to ${dossier.duty.destinationCountry}` : ''}`
                    : `Verify rate to ${dossier.duty.destinationCountry}`}
                  {dossier.duty.rateVerified === true && (
                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Verified
                    </span>
                  )}
                  {dossier.duty.rateVerified === false && (
                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Estimated
                    </span>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Button onClick={onConfirm} className="w-full">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm HS Code for this Deal
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onGenerateDossier}
            disabled={dossierGenerating || hasExistingDossier}
          >
            {dossierGenerating ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating Dossier…</>
            ) : hasExistingDossier ? (
              <><CheckCircle2 className="mr-2 h-3.5 w-3.5 text-green-600" />Dossier Generated</>
            ) : (
              <><FileDown className="mr-2 h-3.5 w-3.5" />Generate HS Dossier PDF</>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-full">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Edit product description
          </Button>
        </div>
      </div>

      {/* Right: full dossier — uses shared HsDossier accordion */}
      <div className="lg:col-span-3">
        <HsDossier result={dossier} dealNote={`Used in deal · HS ${dossier.selectedCode.code}`} expandAll />

        {/* AI-enhanced classification insights */}
        <HsEnhancementPanel
          hsCode={dossier.selectedCode.code}
          hsDescription={dossier.selectedCode.description}
          productDescription={deal.productDescription}
          destinationCountry={deal.buyerCountry}
        />
      </div>
    </div>
  );
}

// ─── Port Autocomplete (used in Step 3 AI recommendation) ─────────────────────

function DealPortAutocomplete({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = KEY_PORTS.filter((p) =>
    p.name.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <p className="text-sm font-medium mb-1.5">{label}</p>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {filtered.map((port) => (
            <div
              key={port.name}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
              onMouseDown={() => { onChange(port.name); setOpen(false); }}
            >
              {port.name}
              <span className="text-xs text-muted-foreground">{port.countryCode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Incoterm & Pricing ───────────────────────────────────────────────

const PAYMENT_METHODS = [
  'T/T – Telegraphic Transfer',
  'L/C – Letter of Credit',
  'CAD – Cash Against Documents',
  'D/P – Documents Against Payment',
  'Open Account',
  'Advance Payment',
] as const;

const step3Schema = z.object({
  incoterm: z.string().min(1, 'Select an Incoterm'),
  incotermPlace: z.string().min(2, 'Specify the named place'),
  freightResponsibility: z.enum(['Seller', 'Buyer']),
  insuranceResponsibility: z.enum(['Seller', 'Buyer']),
  paymentMethod: z.string().min(1, 'Select a payment method'),
  paymentTerms: z.string().min(2, 'Specify payment terms'),
  deliveryDate: z.string().optional(),
});

type Step3Values = z.infer<typeof step3Schema>;

function Step3({
  deal,
  items,
  onSuccess,
  onBack,
  documentCount,
}: {
  deal: Deal;
  items: DealItem[];
  onSuccess: (updated: Deal) => void;
  onBack: () => void;
  documentCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedIncoterm, setSelectedIncoterm] = useState('');
  const [portOfLoading, setPortOfLoading] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [recLoading, setRecLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    primaryIncoterm: { code: string; label: string; confidence: string; summary: string; reasons: string[] };
    secondaryIncoterm: { code: string; label: string; confidence: string; summary: string; reasons: string[] };
    notes: string[];
  } | null>(null);

  const form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      incoterm: '',
      incotermPlace: '',
      freightResponsibility: 'Seller',
      insuranceResponsibility: 'Seller',
      paymentMethod: '',
      paymentTerms: '',
      deliveryDate: '',
    },
  });

  const incotermData = selectedIncoterm
    ? INCOTERMS_2020[selectedIncoterm as keyof typeof INCOTERMS_2020]
    : null;

  // Cargo value derived from line items or deal fields
  const cargoValue =
    items.length > 0
      ? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      : (deal.unitPrice ?? 0) * (deal.quantity ?? 1);

  function applyIncoterm(code: string) {
    form.setValue('incoterm', code, { shouldValidate: true });
    setSelectedIncoterm(code);
    const defaults = INCOTERM_DEFAULTS[code];
    if (defaults) {
      form.setValue('freightResponsibility', defaults.freight);
      form.setValue('insuranceResponsibility', defaults.insurance);
    }
    if (portOfDischarge && !form.getValues('incotermPlace')) {
      form.setValue('incotermPlace', portOfDischarge);
    }
  }

  async function getRecommendation() {
    if (!portOfLoading || !portOfDischarge) {
      toast.error('Enter both Port of Loading and Port of Discharge first');
      return;
    }
    setRecLoading(true);
    setRecommendation(null);
    try {
      const res = await fetch('/api/incoterm/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portOfLoading,
          portOfDischarge,
          originCountry: portOfLoading,
          destinationCountry: portOfDischarge,
          cargoType: deal.productDescription ?? 'general cargo',
          cargoValue,
          mode: 'sea',
        }),
      });
      if (!res.ok) throw new Error('Recommendation failed');
      const data = await res.json();
      setRecommendation(data);
    } catch {
      toast.error('Could not get AI recommendation — select manually below');
    } finally {
      setRecLoading(false);
    }
  }

  async function onSubmit(values: Step3Values) {
    setLoading(true);
    try {
      const updated = await updateDeal(deal.id, {
        incoterm: values.incoterm,
        incotermPlace: values.incotermPlace,
        freightResponsibility: values.freightResponsibility,
        insuranceResponsibility: values.insuranceResponsibility,
        paymentMethod: values.paymentMethod,
        paymentTerms: values.paymentTerms,
        deliveryDate: values.deliveryDate ?? '',
      });
      onSuccess(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Incoterm &amp; Logistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* ── AI Incoterm Recommendation ── */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-sm font-semibold">AI Incoterm Recommendation</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your ports and we'll recommend the right Incoterm based on your cargo.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DealPortAutocomplete
                      label="Port of Loading"
                      placeholder="e.g., Shanghai"
                      value={portOfLoading}
                      onChange={setPortOfLoading}
                    />
                    <DealPortAutocomplete
                      label="Port of Discharge"
                      placeholder="e.g., Halifax"
                      value={portOfDischarge}
                      onChange={setPortOfDischarge}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={recLoading || !portOfLoading || !portOfDischarge}
                    onClick={getRecommendation}
                  >
                    {recLoading ? (
                      <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Analysing…</>
                    ) : (
                      <>Get AI Recommendation</>
                    )}
                  </Button>

                  {recommendation && (
                    <div className="space-y-2 pt-1">
                      {[
                        { label: 'Primary', item: recommendation.primaryIncoterm },
                        { label: 'Alternative', item: recommendation.secondaryIncoterm },
                      ].map(({ label, item }) => (
                        <div key={item.code} className="rounded-md border bg-background p-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-xs text-muted-foreground mr-1.5">{label}</span>
                              <span className="font-semibold text-sm">{item.label}</span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              className="h-7 text-xs px-3 shrink-0"
                              onClick={() => applyIncoterm(item.code)}
                            >
                              Use {item.code}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
                          {item.reasons.length > 0 && (
                            <ul className="space-y-0.5 pt-0.5">
                              {item.reasons.map((r) => (
                                <li key={r} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <div className="mt-1.5 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                      {recommendation.notes.map((note) => (
                        <p key={note} className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded px-3 py-2">
                          ⚠ {note}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="incoterm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incoterm (Incoterms® 2020) *</FormLabel>
                      <Select
                        onValueChange={(v) => { field.onChange(v); setSelectedIncoterm(v); }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Incoterm" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INCOTERM_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* AI Incoterm intelligence */}
                {selectedIncoterm && (
                  <IncotermInsightPanel
                    incoterm={selectedIncoterm}
                    productDescription={deal.productDescription}
                    buyerCountry={deal.buyerCountry}
                    unitPrice={deal.unitPrice}
                    quantity={deal.quantity}
                    currency={deal.currency}
                  />
                )}

                <FormField
                  control={form.control}
                  name="incotermPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Named Place *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Port of Halifax, Canada" {...field} />
                      </FormControl>
                      <FormDescription>
                        The specific location where risk and/or cost transfers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="freightResponsibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Freight Responsibility</FormLabel>
                        <div className="flex gap-3 mt-1">
                          {(['Seller', 'Buyer'] as const).map((v) => (
                            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                value={v}
                                checked={field.value === v}
                                onChange={() => field.onChange(v)}
                                className="accent-primary"
                              />
                              {v}
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="insuranceResponsibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Responsibility</FormLabel>
                        <div className="flex gap-3 mt-1">
                          {(['Seller', 'Buyer'] as const).map((v) => (
                            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                value={v}
                                checked={field.value === v}
                                onChange={() => field.onChange(v)}
                                className="accent-primary"
                              />
                              {v}
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Payment & Delivery ── */}
                <div className="border-t pt-5 space-y-5">
                  <p className="text-sm font-semibold">Payment &amp; Delivery</p>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_METHODS.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 50% advance, balance against B/L; or Net 30 days from invoice date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Specify when and how payment is due — this is embedded directly in the contract.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onBack} className="flex-none">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                    ) : (
                      <>Continue — Generate Deal Summary <ChevronRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Right: pricing + incoterm explanation */}
      <div className="lg:col-span-2 space-y-4">
        <DealSummaryCard deal={deal} documentCount={documentCount} items={items} />

        {items.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <PricingTable items={items} currency={deal.currency} />
            </CardContent>
          </Card>
        )}

        {incotermData && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5 text-sm space-y-2">
              <p className="font-semibold">{incotermData.code} — {incotermData.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Risk transfers:</strong> {incotermData.riskTransfer}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Cost transfers:</strong> {incotermData.costTransfer}
              </p>
              <div className="border-t pt-2">
                <p className="text-xs font-medium mb-1">Seller responsibilities:</p>
                <ul className="space-y-0.5">
                  {incotermData.sellerResponsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <div className="mt-1.5 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs italic text-muted-foreground pt-1 border-t">
                Best for: {incotermData.bestFor}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Deal Dossier ─────────────────────────────────────────────────────

function Step4({
  deal,
  items,
  dossier,
  onFinalize,
  onBack,
  documents,
  onGenerateDossier,
  dossierGenerating,
}: {
  deal: Deal;
  items: DealItem[];
  dossier: HsClassificationResult | null;
  onFinalize: (updated: Deal) => void;
  onBack: () => void;
  documents: DealDocument[];
  onGenerateDossier: () => Promise<void>;
  dossierGenerating: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasHsDossier = documents.some((d) => d.type === 'HS_DOSSIER');

  async function handleDownloadDossier() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch('/api/deal/deal-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal, items, dossier }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'PDF generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mercorama-deal-dossier-${deal.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      toast.success('Deal Dossier downloaded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      const updated = await updateDeal(deal.id, { status: 'finalized', contractText: '' });
      toast.success('Deal finalized');
      onFinalize(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to finalize');
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <>
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Left: deal summary + actions */}
      <div className="lg:col-span-2 space-y-4">
        <DealSummaryCard deal={deal} documentCount={documents.length} />

        {/* Documents panel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents attached yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{doc.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('en-CA')}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        title="Open / Download"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {doc.type === 'HS_DOSSIER' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          asChild
                          title="Email dossier"
                        >
                          <a
                            href={`mailto:?subject=${encodeURIComponent(doc.title)}&body=${encodeURIComponent(`Please find the ${doc.title} attached to this message.\n\nTo view the dossier, open the link below in your browser:\n${doc.fileUrl.slice(0, 200)}…\n\n— Mercorama`)}`}
                          >
                            <Mail className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!hasHsDossier && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1"
                onClick={onGenerateDossier}
                disabled={dossierGenerating}
              >
                {dossierGenerating ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</>
                ) : (
                  <><FileDown className="mr-2 h-3.5 w-3.5" />Generate HS Dossier PDF</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Acknowledgement + download */}
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <input
                id="ack-checkbox"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-amber-300 accent-amber-600 shrink-0 cursor-pointer"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <label htmlFor="ack-checkbox" className="text-xs leading-relaxed text-amber-800 cursor-pointer">
                I understand this Deal Dossier is a reference document only. It is not a legally
                binding contract and does not constitute legal advice. I will engage a qualified
                trade lawyer before executing any international trade agreement.
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleDownloadDossier}
              className="w-full"
              disabled={downloading || !acknowledged}
            >
              {downloading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating PDF…</>
              ) : (
                <><FileDown className="mr-2 h-4 w-4" />Download Deal Dossier (PDF)</>
              )}
            </Button>

            {downloaded && (
              <Button
                onClick={handleFinalize}
                variant="outline"
                className="w-full"
                disabled={finalizing}
              >
                {finalizing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" />Finalize Deal</>
                )}
              </Button>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="w-full">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Incoterm
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: dossier preview */}
      <div className="lg:col-span-3">
        <Card className={downloaded ? 'border-green-200' : 'border-dashed'}>
          <CardContent className="pt-5">
            {!downloaded ? (
              <div className="flex min-h-[480px] flex-col items-center justify-center gap-4 py-12 text-center">
                <FileDown className="h-16 w-16 text-muted-foreground/40" />
                <div>
                  <p className="font-semibold">Ready to generate</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                    Your Deal Dossier PDF will include the HS classification, Incoterm allocation,
                    pricing, and a clause checklist for advisor review.
                  </p>
                </div>
                {!acknowledged && (
                  <p className="text-xs text-muted-foreground/60 max-w-[240px]">
                    Check the acknowledgement box to enable the download.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Dossier downloaded</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Click "Finalize Deal" to mark this deal as complete, or download again below.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dossier contents</p>
                  {[
                    `Deal Snapshot — ${deal.sellerName} → ${deal.buyerName}`,
                    `HS Code ${deal.hsCode} — ${deal.hsDescription}`,
                    `Incoterm ${deal.incoterm}${deal.incotermPlace ? ` (${deal.incotermPlace})` : ''} — Freight: ${deal.freightResponsibility}`,
                    `Payment: ${deal.paymentMethod} · ${deal.paymentTerms}`,
                    'Suggested Clause Checklist (8 items)',
                    'Reference Document Disclaimer',
                  ].map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <div className="mt-1.5 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                      {line}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleDownloadDossier}
                  disabled={downloading}
                >
                  {downloading ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</>
                  ) : (
                    <><FileDown className="mr-2 h-3.5 w-3.5" />Download again</>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Mercorama Deal Dossiers are AI-generated for informational purposes only and do not
                  constitute legal advice or a binding agreement.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Export Execution Playbook — AI-generated */}
    <div className="mt-8">
      <DealPlaybookPanel
        deal={{ ...deal, dealIntent: dealIntent ?? undefined }}
        dealId={deal.id}
        onGenerated={(playbook) => {
          import('@/lib/deals').then(({ updateDeal }) => {
            updateDeal(deal.id, { dealPlaybook: playbook as unknown as Record<string, unknown> });
          });
        }}
      />
    </div>
    </>
  );
}

// ─── Deal finalized view ──────────────────────────────────────────────────────

function DealFinalized({
  deal,
  hasDossier,
  onGenerateDossier,
  dossierGenerating,
}: {
  deal: Deal;
  hasDossier: boolean;
  onGenerateDossier: () => Promise<void>;
  dossierGenerating: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center space-y-6">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Deal Finalized</h2>
        <p className="mt-2 text-muted-foreground">
          Your deal dossier has been downloaded. HS Code{' '}
          <span className="font-mono font-semibold text-primary">{deal.hsCode}</span> and{' '}
          Incoterm <span className="font-semibold">{deal.incoterm}</span> are included in the PDF.
        </p>
      </div>

      {!hasDossier && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10 text-left">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  HS Dossier not generated
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                  Generate an HS Dossier PDF for this deal — recommended for audit trails and customs broker review.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              onClick={onGenerateDossier}
              disabled={dossierGenerating}
            >
              {dossierGenerating ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</>
              ) : (
                <><FileDown className="mr-2 h-3.5 w-3.5" />Generate HS Dossier PDF</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={() => window.location.reload()}>Start New Deal</Button>
      </div>

      {deal.productDescription && (
        <div className="space-y-2">
          <div className="rounded-lg border border-[#01696f]/30 bg-[#01696f]/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-foreground">Explore FTA opportunities for this product</p>
            <a
              href={`/dashboard?tool=fta-diversify&from=deal`}
              onClick={() => { import('@/lib/workflow').then(({ setWorkflow }) => setWorkflow({ product: deal.productDescription, hsCode: deal.hsCode, source: 'deal' })); }}
              className="shrink-0 text-sm font-semibold text-[#01696f] dark:text-[#4f98a3] hover:underline flex items-center gap-1"
            >
              Explore FTA Markets →
            </a>
          </div>
          <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-indigo-900 dark:text-indigo-200">Find the best global markets for this product</p>
            <a
              href={`/dashboard?tool=export-compass&from=deal&${deal.hsCode ? `hsCode=${encodeURIComponent(deal.hsCode)}&` : ''}product=${encodeURIComponent(deal.productDescription)}`}
              onClick={() => { import('@/lib/workflow').then(({ setWorkflow }) => setWorkflow({ product: deal.productDescription, hsCode: deal.hsCode, source: 'deal' })); }}
              className="shrink-0 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Export Compass →
            </a>
          </div>
        </div>
      )}

      <DealSummaryCard deal={deal} />
    </div>
  );
}

// ─── Step 0: Deal Intent ──────────────────────────────────────────────────────

type DealIntent = 'new_market' | 'fulfil_order' | 'repeat_deal' | 'explore';

const INTENT_OPTIONS: { value: DealIntent; label: string; icon: typeof Globe; desc: string }[] = [
  { value: 'new_market',   icon: Globe,     label: 'Enter a new market',       desc: 'First shipment to this country or buyer' },
  { value: 'fulfil_order', icon: Package,   label: 'Fulfil a confirmed order', desc: 'Buyer is ready — I need the paperwork and compliance in order' },
  { value: 'repeat_deal',  icon: RefreshCw, label: 'Repeat a previous deal',   desc: 'Similar to a deal I\'ve done before — I want to move faster this time' },
  { value: 'explore',      icon: Compass,   label: 'Explore my options',       desc: 'Not committed yet — I want to understand what\'s involved' },
];

const INTENT_LABELS: Record<DealIntent, string> = {
  new_market: 'Enter a new market',
  fulfil_order: 'Fulfil a confirmed order',
  repeat_deal: 'Repeat a previous deal',
  explore: 'Explore my options',
};

function Step0({ onSelect }: { onSelect: (intent: DealIntent) => void }) {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-center mb-2">What are you trying to do with this deal?</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">This helps us tailor the analysis and prioritise your next steps.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {INTENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="group rounded-xl border bg-card p-5 text-left hover:border-[#01696f] hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#01696f]/10 flex items-center justify-center shrink-0 group-hover:bg-[#01696f]/20 transition-colors">
                <opt.icon className="h-5 w-5 text-[#01696f]" />
              </div>
              <div>
                <div className="font-semibold text-sm">{opt.label}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function DealWizard() {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [dealIntent, setDealIntent] = useState<DealIntent | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dossier, setDossier] = useState<HsClassificationResult | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [items, setItems] = useState<DealItem[]>([]);
  const [dossierGenerating, setDossierGenerating] = useState(false);

  async function refreshDocs(dealId: string) {
    const docs = await listDealDocuments(dealId);
    setDocuments(docs);
  }

  async function refreshItems(dealId: string) {
    const loaded = await listDealItems(dealId);
    setItems(loaded);
  }

  async function handleGenerateDossier() {
    if (!deal) return;
    setDossierGenerating(true);
    try {
      const res = await fetch('/api/deal/hs-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, deal, dossier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Dossier generation failed');

      await createDealDocument({
        dealId: deal.id,
        type: 'HS_DOSSIER',
        title: data.title,
        fileUrl: data.fileUrl,
        createdBy: null,
      });
      await refreshDocs(deal.id);
      toast.success('HS Dossier generated and attached to this deal.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dossier generation failed');
    } finally {
      setDossierGenerating(false);
    }
  }

  const hasHsDossier = documents.some((d) => d.type === 'HS_DOSSIER');

  if (finalized && deal) {
    return (
      <DealFinalized
        deal={deal}
        hasDossier={hasHsDossier}
        onGenerateDossier={handleGenerateDossier}
        dossierGenerating={dossierGenerating}
      />
    );
  }

  return (
    <div>
      {step === 0 && (
        <Step0 onSelect={(intent) => { setDealIntent(intent); setStep(1); }} />
      )}

      {step >= 1 && (
        <>
          {/* Intent badge */}
          {dealIntent && (
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#01696f]/10 text-[#01696f] dark:text-[#4f98a3] px-3 py-1 text-xs font-medium">
                Goal: {INTENT_LABELS[dealIntent]}
              </span>
            </div>
          )}
          <Stepper current={step as 1 | 2 | 3 | 4} onNavigate={(n) => setStep(n)} />
        </>
      )}

      {step === 1 && (
        <Step1
          onSuccess={(newDeal, newDossier) => {
            setDeal(newDeal);
            setDossier(newDossier);
            setDocuments([]);
            refreshItems(newDeal.id);
            setStep(2);
          }}
        />
      )}

      {step === 2 && deal && dossier && (
        <Step2
          deal={deal}
          dossier={dossier}
          items={items}
          onConfirm={() => setStep(3)}
          onBack={() => setStep(1)}
          onGenerateDossier={handleGenerateDossier}
          dossierGenerating={dossierGenerating}
          hasExistingDossier={hasHsDossier}
          documentCount={documents.length}
        />
      )}

      {step === 3 && deal && (
        <Step3
          deal={deal}
          items={items}
          onSuccess={(updated) => { setDeal(updated); setStep(4); }}
          onBack={() => setStep(2)}
          documentCount={documents.length}
        />
      )}

      {step === 4 && deal && (
        <Step4
          deal={deal}
          items={items}
          dossier={dossier}
          onFinalize={(updated) => { setDeal(updated); setFinalized(true); }}
          onBack={() => setStep(3)}
          documents={documents}
          onGenerateDossier={handleGenerateDossier}
          dossierGenerating={dossierGenerating}
        />
      )}
    </div>
  );
}
