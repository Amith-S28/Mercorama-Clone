import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RiskScorecardProps {
  riskScorecard: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: Array<{
      category: string;
      level: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
}

const riskConfig = {
  low: {
    icon: CheckCircle,
    color: 'text-[hsl(var(--trade-success))]',
    bg: 'bg-[hsl(var(--trade-success))]/10',
    border: 'border-[hsl(var(--trade-success))]/20',
    badge: 'bg-[hsl(var(--trade-success))]',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-[hsl(var(--trade-risk))]',
    bg: 'bg-[hsl(var(--trade-risk))]/10',
    border: 'border-[hsl(var(--trade-risk))]/20',
    badge: 'bg-[hsl(var(--trade-risk))]',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    badge: 'bg-destructive',
  },
};

export function RiskScorecard({ riskScorecard }: RiskScorecardProps) {
  const overallConfig = riskConfig[riskScorecard.overallRisk];
  const OverallIcon = overallConfig.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Risk Assessment</CardTitle>
          <Badge className={`${overallConfig.badge} text-white`}>
            {riskScorecard.overallRisk.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Risk Summary */}
        <div className={`flex items-start gap-4 rounded-lg border ${overallConfig.border} ${overallConfig.bg} p-4`}>
          <OverallIcon className={`mt-1 h-6 w-6 flex-shrink-0 ${overallConfig.color}`} />
          <div>
            <h4 className="mb-1 font-semibold">Overall Risk: {riskScorecard.overallRisk}</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Review the risk factors below for a comprehensive understanding of potential challenges.
            </p>
          </div>
        </div>

        {/* Individual Risk Factors */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Risk Breakdown</h4>
          {riskScorecard.factors.map((factor, index) => {
            const config = riskConfig[factor.level];
            const Icon = config.icon;

            return (
              <div
                key={index}
                className={`flex items-start gap-3 rounded-lg border ${config.border} ${config.bg} p-3`}
              >
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{factor.category}</span>
                    <Badge variant="outline" className={`${config.color} text-xs`}>
                      {factor.level}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {factor.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
