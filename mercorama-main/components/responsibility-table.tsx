'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ResponsibilityTableProps {
  seller: string[];
  buyer: string[];
  shared?: string[];
}

export function ResponsibilityTable({ seller, buyer, shared }: ResponsibilityTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Responsibility Breakdown</CardTitle>
        <CardDescription>
          Clear allocation of tasks between parties in this trade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Seller Responsibilities */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--trade-seller))]/10">
                <CheckCircle className="h-5 w-5 text-[hsl(var(--trade-seller))]" />
              </div>
              <h3 className="font-semibold text-foreground">Seller Responsibilities</h3>
            </div>
            <div className="space-y-2">
              {seller.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 rounded-lg border border-[hsl(var(--trade-seller))]/20 bg-[hsl(var(--trade-seller))]/5 p-3"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--trade-seller))]" />
                  <span className="text-sm text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Buyer Responsibilities */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--trade-buyer))]/10">
                <XCircle className="h-5 w-5 text-[hsl(var(--trade-buyer))]" />
              </div>
              <h3 className="font-semibold text-foreground">Buyer Responsibilities</h3>
            </div>
            <div className="space-y-2">
              {buyer.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (seller.length + index) * 0.05 }}
                  className="flex items-start gap-3 rounded-lg border border-[hsl(var(--trade-buyer))]/20 bg-[hsl(var(--trade-buyer))]/5 p-3"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--trade-buyer))]" />
                  <span className="text-sm text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Shared Responsibilities */}
          {shared && shared.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--trade-risk))]/10">
                  <Users className="h-5 w-5 text-[hsl(var(--trade-risk))]" />
                </div>
                <h3 className="font-semibold text-foreground">Shared Responsibilities</h3>
              </div>
              <div className="space-y-2">
                {shared.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (seller.length + buyer.length + index) * 0.05 }}
                    className="flex items-start gap-3 rounded-lg border border-[hsl(var(--trade-risk))]/20 bg-[hsl(var(--trade-risk))]/5 p-3"
                  >
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--trade-risk))]" />
                    <span className="text-sm text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
