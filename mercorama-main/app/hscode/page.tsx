'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MarketingCmsSection } from '@/components/marketing/MarketingCmsSection';
import { ArrowRight, PackageSearch, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { getAuthUser } from '@/lib/auth-store';

export default function HSCodePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (getAuthUser()) {
      router.replace('/dashboard?tool=hs-code-assistant');
    } else {
      setIsLoggedIn(false);
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-background to-secondary/20 px-4 py-12 sm:py-16 md:px-6 lg:py-20">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <PackageSearch className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                The Wrong HS Code Can Trigger Audits, Fines, and Shipment Delays
              </h1>
              <p className="max-w-3xl text-pretty text-lg text-muted-foreground md:text-xl">
                Mercorama classifies your product against the Harmonized System with AI-powered reasoning —
                giving you the right 6-digit code, duty rate, and FTA eligibility before you ship.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signin?callbackUrl=/dashboard?tool=hs-code-assistant">
                  <Button size="lg" className="gap-2">
                    Classify My Product
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline">Already have an account? Sign in</Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">Available on Starter and above — join today.</p>
            </div>
          </div>
        </section>

        {/* Why HS Codes Matter */}
        <section className="px-4 py-10 md:px-6 lg:py-16">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-6 text-3xl font-bold">Why Getting the Code Right Matters</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Customs Penalties</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Misclassified goods can result in fines, back-payment of unpaid duties, and
                    seizure of shipments. Customs authorities in most countries can audit up to 4 years back.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle>Missed FTA Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Canada has FTAs covering 51 countries. The wrong HS code means you may pay full
                    MFN duties when you qualify for 0% under CETA, CPTPP, or CUSMA.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Shipment Delays</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Customs holds triggered by incorrect codes can delay shipments by days or weeks,
                    breaching delivery commitments and damaging buyer relationships.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What Mercorama Provides */}
        <section className="border-t bg-secondary/20 px-4 py-10 md:px-6 lg:py-16">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-6 text-3xl font-bold">What Mercorama Gives You</h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                    <div>
                      <CardTitle>6-Digit HS Code with Confidence Score</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        AI classification grounded in GRI (General Rules for Interpretation) with
                        a High / Medium / Low confidence rating and the reasoning behind each decision.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                    <div>
                      <CardTitle>Duty Rate Lookup</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        MFN (Most Favoured Nation) duty rate for your product, so you know your
                        baseline cost before negotiating payment terms with your buyer.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                    <div>
                      <CardTitle>FTA Eligibility Check</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Automatically flags whether your product qualifies for reduced or zero duty
                        under Canada's active FTAs — CETA, CPTPP, CUSMA, and others.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                    <div>
                      <CardTitle>Alternative Code Candidates</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Where classification is ambiguous, Mercorama surfaces alternate headings
                        with explanations — so you can review with your broker before filing.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Sample Output */}
        <section className="px-4 py-10 md:px-6 lg:py-16">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold">Sample Classification Output</h2>
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle>Organic Cold-Pressed Canola Oil — Food Grade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border bg-secondary/50 px-4 py-3">
                    <span className="text-sm font-medium">HS Code</span>
                    <span className="font-mono text-sm font-bold">1514.11</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-secondary/50 px-4 py-3">
                    <span className="text-sm font-medium">Confidence</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">High (92%)</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95 backdrop-blur-sm" />
                    <div className="space-y-3 opacity-30">
                      <div className="flex items-center justify-between rounded-lg border bg-secondary/50 px-4 py-3">
                        <span className="text-sm font-medium">MFN Duty Rate</span>
                        <span className="text-sm">0%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border bg-secondary/50 px-4 py-3">
                        <span className="text-sm font-medium">CETA Rate</span>
                        <span className="text-sm">0% (eligible)</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                        <p className="font-medium text-muted-foreground">Sign in to see full classification</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t px-4 py-10 md:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Available on Starter and above</h2>
            <p className="mb-8 text-muted-foreground">
              Available on Starter and above — join today.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/auth/signup">
                <Button size="lg">Start with Starter</Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingCmsSection slug="hscode" />
      <Footer />
    </div>
  );
}
