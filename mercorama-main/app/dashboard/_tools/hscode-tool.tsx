'use client';

import { useState } from 'react';
import { ToolCrossPromo } from '../_components/tool-cross-promo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { HSCodeResult } from '@/components/HSCodeResult';
import { LoadingState } from '@/components/LoadingState';
import { HSCodeAnalysisResponse } from '@/lib/types';
import { saveAnalysis } from '@/lib/storage';
import { toast } from 'sonner';
import { ExpertCTA } from '@/components/ExpertCTA';

const formSchema = z.object({
  productDescription: z.string().min(10, 'Please provide at least 10 characters describing the product'),
  originCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
});

export function HSCodeTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HSCodeAnalysisResponse | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productDescription: '',
      originCountry: '',
      destinationCountry: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hscode',
          payload: values,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to classify');
      }

      const data = await response.json();
      setResult(data.result);

      saveAnalysis({
        id: crypto.randomUUID(),
        type: 'hscode',
        timestamp: Date.now(),
        inputs: values,
        results: data.result,
      });

      toast.success('Classification complete!');
    } catch (error) {
      console.error('[mercorama] Classification error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to classify product');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Archived tool banner */}
      <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          This tool is now part of Mercorama&apos;s HS Code Intelligence system. For best results, use it within your <a href="/dashboard" className="font-semibold underline">growth workflow</a>.
        </p>
      </div>
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--trade-buyer))]/10 px-3 py-1.5">
          <Search className="h-4 w-4 text-[hsl(var(--trade-buyer))]" />
          <span className="text-sm font-medium">Harmonized System</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
          HS Code Assistant
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground text-pretty">
          Get accurate HS Code classifications with AI-powered analysis. Understand duty implications,
          misclassification risks, and applicable trade agreements for your products.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Describe your product for HS Code classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="productDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Wireless Bluetooth headphones with noise cancellation, made of plastic and metal, rechargeable lithium battery"
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific: include materials, function, and key features
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Classifying...' : 'Classify Product'}
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

        {/* Results */}
        <div className="lg:col-span-3">
          {isLoading && <LoadingState message="Classifying product with AI..." />}

          {!isLoading && !result && (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12 text-center">
                <PackageSearch className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Ready to Classify</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Describe your product to receive an AI-powered HS Code classification
                    with confidence ratings and duty implications.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && result && <HSCodeResult result={result} />}
          {!isLoading && result && (
            <div className="mt-4">
              <ExpertCTA context="this HS classification" />
            </div>
          )}
        </div>
      </div>
      <ToolCrossPromo currentTool="hs-code-assistant" />
    </div>
  );
}
