'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MarketingCmsSection } from '@/components/marketing/MarketingCmsSection';
import { ArrowRight, FileText, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { getAuthUser } from '@/lib/auth-store';

export default function ContractEducationalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => { setIsLoggedIn(!!getAuthUser()); }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-background to-secondary/20 px-4 py-20 md:px-6 lg:py-32">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <FileText className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                International Trade Disputes Are Preventable
              </h1>
              <p className="max-w-3xl text-pretty text-lg text-muted-foreground md:text-xl">
                Misaligned payment terms and Incoterms are the #1 cause of international trade disputes. 
                Mercorama makes your obligations explicit before you sign.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={isLoggedIn ? '/dashboard?tool=deal-wizard' : '/auth/signin?callbackUrl=/dashboard?tool=deal-wizard'}>
                  <Button size="lg" className="gap-2">
                    {isLoggedIn ? 'Build Your Export Plan' : 'Start Your Export Plan'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {!isLoggedIn && (
                  <Link href="/auth/signin">
                    <Button size="lg" variant="outline">Already have an account? Sign in</Button>
                  </Link>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Deal summaries are generated as the final step of the Deal Wizard.</p>
            </div>
          </div>
        </section>

        {/* Dangerous Combinations */}
        <section className="px-4 py-16 md:px-6 lg:py-24">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-12 text-3xl font-bold">The Most Dangerous Combinations</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>CIF + 90-Day Open Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Seller bears full cargo risk for 90 days while payment remains outstanding. If the 
                    buyer defaults, the seller has already paid freight and insurance with no recourse.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle>DDP + Letter of Credit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Seller must clear import customs but can't control delays in the buyer's country. 
                    Customs holds can void the LC's validity period, leaving the seller unpaid.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>EXW + New Buyer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Buyer must clear export customs in the seller's country. Most new buyers can't do this. 
                    The shipment gets stuck, and the seller still bears reputational risk.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What Mercorama Generates */}
        <section className="border-t bg-secondary/20 px-4 py-16 md:px-6 lg:py-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold">What Mercorama Generates</h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                    <div>
                      <CardTitle>Clause Reference Library</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Suggested clause references aligned to your chosen Incoterm, covering delivery, risk 
                        transfer, insurance requirements, and documentation obligations.
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
                      <CardTitle>Payment Trigger Timeline</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Visual timeline showing who pays what, when, tied to which shipping event 
                        (e.g., "30% on PO, 60% on BL, 10% 30 days after delivery").
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
                      <CardTitle>Red Flag Detector</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Automated analysis that identifies payment-Incoterm misalignments that could 
                        leave you exposed to payment or cargo risk.
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
                      <CardTitle>Negotiation Checklist</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        10 key points to clarify before signing, including delivery place precision, 
                        force majeure clauses, and dispute resolution jurisdiction.
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
                      <CardTitle>Risk Allocation Scorecard</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Quantified assessment of who bears what percentage of risk across payment, 
                        transit, currency, and regulatory dimensions.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Sample Red Flag */}
        <section className="px-4 py-16 md:px-6 lg:py-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold">Sample Red Flag Detection</h2>
            <Card className="relative overflow-hidden border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <CardTitle className="text-red-900 dark:text-red-100">
                      HIGH RISK: Payment-Incoterm Misalignment Detected
                    </CardTitle>
                    <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                      FOB + 70% on Bill of Lading — seller bears full cargo risk on $X while payment 
                      remains outstanding. Recommend: reduce to 30% on BL or switch to Letter of Credit.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95 backdrop-blur-sm" />
                <div className="relative py-12 text-center">
                  <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Sign in to generate your full analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t px-4 py-16 md:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Available on Starter and above</h2>
            <p className="mb-8 text-muted-foreground">
              Available on Starter and above — join today.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {isLoggedIn ? (
                <Link href="/dashboard?tool=deal-wizard">
                  <Button size="lg">Build Your Export Plan</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="lg">Start with Starter</Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button size="lg" variant="outline">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <MarketingCmsSection slug="contract" />

      <Footer />
    </div>
  );
}
