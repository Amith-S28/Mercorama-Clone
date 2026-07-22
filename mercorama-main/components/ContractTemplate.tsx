'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ContractTemplateProps {
  clauses: Array<{
    title: string;
    content: string;
    importance: 'critical' | 'recommended' | 'optional';
  }>;
}

const importanceConfig = {
  critical: { color: 'bg-destructive', label: 'Critical' },
  recommended: { color: 'bg-[hsl(var(--trade-risk))]', label: 'Recommended' },
  optional: { color: 'bg-muted-foreground', label: 'Optional' },
};

export function ContractTemplate({ clauses }: ContractTemplateProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const fullContract = clauses
      .map(
        (clause, index) =>
          `${index + 1}. ${clause.title.toUpperCase()}\n\n${clause.content}\n`
      )
      .join('\n');

    await navigator.clipboard.writeText(fullContract);
    setCopied(true);
    toast.success('Deal summary clauses copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fullContract = clauses
      .map(
        (clause, index) =>
          `${index + 1}. ${clause.title.toUpperCase()}\n\n${clause.content}\n`
      )
      .join('\n');

    const blob = new Blob([fullContract], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Deal summary downloaded');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Deal Summary — Suggested Clause References</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </>
              )}
            </Button>
            <Button variant="default" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {clauses.map((clause, index) => {
          const config = importanceConfig[clause.importance];

          return (
            <div key={index}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground">
                  {index + 1}.
                </span>
                <h3 className="flex-1 font-semibold uppercase text-balance">
                  {clause.title}
                </h3>
                <Badge className={`${config.color} text-white text-xs`}>
                  {config.label}
                </Badge>
              </div>
              <div className="ml-7 rounded-lg border bg-muted/30 p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-pretty">
                  {clause.content}
                </p>
              </div>
              {index < clauses.length - 1 && <Separator className="mt-6" />}
            </div>
          );
        })}

        <div className="rounded-lg border-2 border-dashed bg-muted/20 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground text-center">
            <strong>Important:</strong> These are suggested clause references for informational purposes only — not a legally binding contract. Always have agreements reviewed by qualified legal counsel before execution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
