// app/doc-checker/_client.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileCheck, AlertTriangle, AlertCircle, Info,
  CheckCircle2, XCircle, MinusCircle, ClipboardList, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { saveAnalysis } from '@/lib/storage';
import { DocCheckerResponse, DocIssue } from '@/lib/types';

const formSchema = z.object({
  exporterCountry: z.string().min(2, 'Required'),
  importerCountry: z.string().min(2, 'Required'),
  mode: z.enum(['air', 'sea', 'road', 'courier']),
  incoterm: z.string().min(2, 'Required'),
  incotermPlace: z.string().min(2, 'Required'),
  portOfLoading: z.string().min(2, 'Required'),
  portOfDischarge: z.string().min(2, 'Required'),
  commodityDescription: z.string().min(5, 'Required'),
  hsCodes: z.string().optional(),
  currency: z.string().min(1, 'Required'),
  commercialInvoice: z.string().min(20, 'Paste your invoice text'),
  packingList: z.string().min(20, 'Paste your packing list text'),
  purchaseOrder: z.string().optional(),
  letterOfCredit: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function StatusBadge({ status }: { status: 'Ready' | 'At risk' | 'Not ready' | undefined | null }) {
  if (!status) return null;
  const config = {
    Ready: { icon: CheckCircle2, className: 'bg-green-100 text-green-800 border-green-200' },
    'At risk': { icon: AlertTriangle, className: 'bg-amber-100 text-amber-800 border-amber-200' },
    'Not ready': { icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${config.className}`}>
      <Icon className="h-4 w-4" />
      {status}
    </span>
  );
}

function IssueCard({ issues, level }: { issues: DocIssue[]; level: 'critical' | 'important' | 'minor' }) {
  if (!issues || issues.length === 0) return null;
  const config = {
    critical: { label: 'Critical Issues', icon: XCircle, borderClass: 'border-l-red-500', iconClass: 'text-red-500', badgeClass: 'bg-red-100 text-red-700' },
    important: { label: 'Important Issues', icon: AlertTriangle, borderClass: 'border-l-amber-500', iconClass: 'text-amber-500', badgeClass: 'bg-amber-100 text-amber-700' },
    minor: { label: 'Minor Issues', icon: Info, borderClass: 'border-l-gray-400', iconClass: 'text-gray-400', badgeClass: 'bg-gray-100 text-gray-600' },
  }[level];
  const Icon = config.icon;

  return (
    <Card className={`border-l-4 ${config.borderClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${config.iconClass}`} />
          {config.label}
          <Badge variant="secondary" className={`ml-auto text-xs ${config.badgeClass}`}>{issues.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues.map((issue, i) => (
          <div key={i} className="rounded-md bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex flex-wrap gap-2">
              <span className="font-semibold text-foreground">{issue.document}</span>
              {issue.field && <span className="text-muted-foreground">→ {issue.field}</span>}
            </div>
            <p className="text-foreground">{issue.problem}</p>
            <p className="text-muted-foreground italic">Risk: {issue.consequence}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DocCheckerClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DocCheckerResponse | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exporterCountry: '',
      importerCountry: '',
      mode: 'sea',
      incoterm: '',
      incotermPlace: '',
      portOfLoading: '',
      portOfDischarge: '',
      commodityDescription: '',
      hsCodes: '',
      currency: 'USD',
      commercialInvoice: '',
      packingList: '',
      purchaseOrder: '',
      letterOfCredit: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'doc_checker', payload: values }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || 'Analysis failed');
      }
      const data = await res.json();
      setResult(data.result);
      saveAnalysis({
        id: crypto.randomUUID(),
        type: 'doc_checker',
        timestamp: Date.now(),
        inputs: values,
        results: data.result,
      });
      toast.success('Document check complete');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  const totalIssues = result
    ? (result.critical_issues?.length ?? 0) + (result.important_issues?.length ?? 0) + (result.minor_issues?.length ?? 0)
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--trade-risk))]/10 px-3 py-1.5">
            <FileCheck className="h-4 w-4 text-[hsl(var(--trade-risk))]" />
            <span className="text-sm font-medium">Smart Doc Checker</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Shipment Document Validator
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Paste your commercial invoice, packing list, PO, and LC. Get a full compliance check with Critical, Important, and Minor issues flagged before you ship.
          </p>
        </div>
      </section>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-5">

            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shipment & Documents</CardTitle>
                  <CardDescription>Fill in the shipment details and paste your document text</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                      {/* Shipment metadata */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shipment Details</p>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="exporterCountry" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Exporter Country</FormLabel>
                              <FormControl><Input placeholder="China" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="importerCountry" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Importer Country</FormLabel>
                              <FormControl><Input placeholder="USA" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="mode" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Transport Mode</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="sea">Sea</SelectItem>
                                <SelectItem value="air">Air</SelectItem>
                                <SelectItem value="road">Road</SelectItem>
                                <SelectItem value="courier">Courier</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="incoterm" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Incoterm</FormLabel>
                              <FormControl><Input placeholder="FOB" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="incotermPlace" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Named Place</FormLabel>
                              <FormControl><Input placeholder="Shanghai" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="portOfLoading" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Port of Loading</FormLabel>
                              <FormControl><Input placeholder="CNSHA" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="portOfDischarge" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Port of Discharge</FormLabel>
                              <FormControl><Input placeholder="USLAX" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="commodityDescription" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Commodity Description</FormLabel>
                            <FormControl><Input placeholder="Electronic components — PCBs" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="hsCodes" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">HS Codes (optional)</FormLabel>
                              <FormControl><Input placeholder="8534.00, 8542.31" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="currency" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="GBP">GBP</SelectItem>
                                  <SelectItem value="CNY">CNY</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      {/* Document tabs */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</p>
                        <Tabs defaultValue="invoice">
                          <TabsList className="w-full grid grid-cols-4 text-xs">
                            <TabsTrigger value="invoice">Invoice</TabsTrigger>
                            <TabsTrigger value="packing">Packing</TabsTrigger>
                            <TabsTrigger value="po">PO</TabsTrigger>
                            <TabsTrigger value="lc">LC</TabsTrigger>
                          </TabsList>

                          <TabsContent value="invoice" className="mt-2">
                            <FormField control={form.control} name="commercialInvoice" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Commercial Invoice <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Paste the full invoice text here — including all line items, header fields, totals, and any certification text..."
                                    rows={8}
                                    className="text-xs font-mono resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </TabsContent>

                          <TabsContent value="packing" className="mt-2">
                            <FormField control={form.control} name="packingList" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Packing List <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Paste the full packing list text — including marks/numbers, carton counts, dimensions, and weights..."
                                    rows={8}
                                    className="text-xs font-mono resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </TabsContent>

                          <TabsContent value="po" className="mt-2">
                            <FormField control={form.control} name="purchaseOrder" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Purchase Order <span className="text-muted-foreground">(optional)</span></FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Paste PO text if available — quantities, prices, and terms will be cross-checked..."
                                    rows={8}
                                    className="text-xs font-mono resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </TabsContent>

                          <TabsContent value="lc" className="mt-2">
                            <FormField control={form.control} name="letterOfCredit" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Letter of Credit <span className="text-muted-foreground">(optional)</span></FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Paste LC text or summary — expiry dates, port names, required documents, and special conditions will be checked..."
                                    rows={8}
                                    className="text-xs font-mono resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </TabsContent>
                        </Tabs>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Checking documents...' : 'Check Documents'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Analyzing your documents…</p>
                    <p className="text-xs text-muted-foreground">This may take 15–30 seconds</p>
                  </CardContent>
                </Card>
              ) : !result ? (
                <Card className="border-dashed">
                  <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12 text-center">
                    <FileCheck className="h-16 w-16 text-muted-foreground/40" />
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">Ready to check your documents</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Fill in the shipment details, paste your invoice and packing list, then click "Check Documents".
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Assessment banner */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Overall Assessment
                        <span className="ml-auto text-xs text-muted-foreground font-normal">{totalIssues} issue{totalIssues !== 1 ? 's' : ''} found</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Customs</span>
                        <StatusBadge status={result.overall_assessment?.customs} />
                      </div>
                      {result.overall_assessment?.lc_payment && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">LC / Payment</span>
                          <StatusBadge status={result.overall_assessment.lc_payment} />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <IssueCard issues={result.critical_issues} level="critical" />
                  <IssueCard issues={result.important_issues} level="important" />
                  <IssueCard issues={result.minor_issues} level="minor" />

                  {/* Fix list */}
                  {result.fix_list && result.fix_list.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <AlertCircle className="h-5 w-5 text-primary" />
                          Fix List
                        </CardTitle>
                        <CardDescription>Share this with your operations team</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.fix_list.map((item, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">{item.issue}</p>
                              <p className="mt-0.5 text-muted-foreground">{item.correction}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Questions */}
                  {result.questions && result.questions.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-300">
                          <HelpCircle className="h-5 w-5" />
                          Confirm Before Shipping
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.questions.map((q, i) => (
                            <li key={i} className="flex gap-2 text-sm text-amber-800 dark:text-amber-300">
                              <MinusCircle className="h-4 w-4 mt-0.5 shrink-0" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
