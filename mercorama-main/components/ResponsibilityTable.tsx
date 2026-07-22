'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResponsibilityTableProps {
  responsibilities: {
    seller: string[];
    buyer: string[];
    shared?: string[];
  };
}

export function ResponsibilityTable({ responsibilities }: ResponsibilityTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Responsibility Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seller Responsibilities */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-[hsl(var(--trade-seller))] text-white">Seller</Badge>
            <span className="text-sm text-muted-foreground">
              {responsibilities.seller.length} responsibilities
            </span>
          </div>
          <div className="space-y-2">
            {responsibilities.seller.map((item, index) => (
              <motion.div
                key={`seller-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 rounded-lg border border-[hsl(var(--trade-seller))]/20 bg-[hsl(var(--trade-seller))]/5 p-3"
              >
                <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[hsl(var(--trade-seller))]" />
                <p className="text-sm leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Buyer Responsibilities */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-[hsl(var(--trade-buyer))] text-white">Buyer</Badge>
            <span className="text-sm text-muted-foreground">
              {responsibilities.buyer.length} responsibilities
            </span>
          </div>
          <div className="space-y-2">
            {responsibilities.buyer.map((item, index) => (
              <motion.div
                key={`buyer-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (responsibilities.seller.length + index) * 0.05 }}
                className="flex items-start gap-3 rounded-lg border border-[hsl(var(--trade-buyer))]/20 bg-[hsl(var(--trade-buyer))]/5 p-3"
              >
                <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[hsl(var(--trade-buyer))]" />
                <p className="text-sm leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Shared Responsibilities (if any) */}
        {responsibilities.shared && responsibilities.shared.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge className="bg-[hsl(var(--trade-risk))] text-white">Shared</Badge>
              <span className="text-sm text-muted-foreground">
                {responsibilities.shared.length} shared items
              </span>
            </div>
            <div className="space-y-2">
              {responsibilities.shared.map((item, index) => (
                <motion.div
                  key={`shared-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (responsibilities.seller.length + responsibilities.buyer.length + index) * 0.05
                  }}
                  className="flex items-start gap-3 rounded-lg border border-[hsl(var(--trade-risk))]/20 bg-[hsl(var(--trade-risk))]/5 p-3"
                >
                  <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[hsl(var(--trade-risk))]" />
                  <p className="text-sm leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
