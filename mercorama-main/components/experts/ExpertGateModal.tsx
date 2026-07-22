'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';

const BOARD = process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com';

interface ExpertGateModalProps {
  open: boolean;
  onClose: () => void;
}

const TIERS = [
  {
    name: 'Starter',
    id: 'pro',
    experts: '5 profiles',
    highlight: false,
  },
  {
    name: 'Growth',
    id: 'team',
    experts: 'Full directory',
    highlight: true,
  },
  {
    name: 'Advisory',
    id: 'enterprise',
    experts: 'Full directory + priority',
    highlight: false,
  },
];

export function ExpertGateModal({ open, onClose }: ExpertGateModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Image src="/mercorama_logo_2026.png" alt="Mercorama" width={140} height={35} className="h-8 w-auto" />
          </div>
          <DialogTitle className="text-center text-lg">
            Unlock the Expert Directory
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Connect with verified trade professionals across customs, freight, and market entry.
          </p>
        </DialogHeader>

        {/* Tier comparison */}
        <div className="space-y-2 mt-4">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                t.highlight
                  ? 'border-[#01696f] bg-[#01696f]/5'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  t.highlight
                    ? 'bg-[#01696f] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  {t.highlight && (
                    <span className="text-[10px] text-[#01696f] font-medium">Recommended</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t.experts}</span>
                {t.experts.includes('Full') ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <span className="text-xs text-muted-foreground">Limited</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-2 mt-4">
          <Link href="/beta" className="block">
            <Button className="w-full" size="lg">Apply for Beta Access</Button>
          </Link>
          <a href={`${BOARD}/auth/signin`} className="block">
            <Button variant="outline" className="w-full" size="lg">Sign In</Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
