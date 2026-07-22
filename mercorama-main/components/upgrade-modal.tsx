'use client';

import { Lock, X, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface UpgradeModalProps {
  feature?: string;
  isOpen: boolean;
  onClose: () => void;
}

const featureNames: Record<string, string> = {
  contract: 'Deal Clarity Engine',
  payment_alignment: 'Payment-Incoterm Alignment Analysis',
  risk_scorecard: 'Full Risk Allocation Scorecard',
  pdf_export: 'PDF Export',
  email_report: 'Email Report Delivery',
  history: 'Analysis History',
};

export function UpgradeModal({ feature, isOpen, onClose }: UpgradeModalProps) {
  const featureName = feature ? featureNames[feature] || feature : 'This feature';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <span>Upgrade Required</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-lg text-muted-foreground">
            <span className="font-semibold text-foreground">{featureName}</span> requires a paid plan to access advanced AI-powered trade analysis features.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Starter Plan */}
            <Card className="relative overflow-hidden border-2 border-[hsl(var(--accent))] p-6">
              <div className="absolute right-4 top-4">
                <Sparkles className="h-5 w-5 text-[hsl(var(--accent))]" />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">Starter</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$79</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--accent))]">✓</span>
                    <span>10 complete deals / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--accent))]">✓</span>
                    <span>30 Incoterms Analyzer runs / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--accent))]">✓</span>
                    <span>30 HS Code classifications / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--accent))]">✓</span>
                    <span>30 Deal Summary Generator runs / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--accent))]">✓</span>
                    <span>Save Product Export Profiles</span>
                  </li>
                </ul>

                <Button asChild className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90">
                  <Link href="/beta">Get Starter</Link>
                </Button>
              </div>
            </Card>

            {/* Growth Plan */}
            <Card className="border-2 border-primary p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">Growth</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>50 complete deals / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>150 runs / month per tool</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Shared Product Export Profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Team deal history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Priority support + onboarding call</span>
                  </li>
                </ul>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/beta">Get Growth</Link>
                </Button>
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Link href="/beta" className="text-sm text-[hsl(var(--accent))] hover:underline">
              See all features →
            </Link>
            <Button variant="ghost" onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
