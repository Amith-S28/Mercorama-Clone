import { Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentTimelineProps {
  milestones: Array<{
    stage: string;
    percentage: number;
    trigger: string;
    daysFromTrigger?: number;
  }>;
}

export function PaymentTimeline({ milestones }: PaymentTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 h-full w-0.5 bg-border" />

          {milestones.map((milestone, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Timeline Dot */}
              <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  {milestone.percentage}%
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="mb-2 font-semibold text-balance">{milestone.stage}</h4>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {milestone.trigger}
                  </p>
                  {milestone.daysFromTrigger && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due within {milestone.daysFromTrigger} days</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Final Indicator */}
          <div className="relative flex gap-4">
            <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-background bg-[hsl(var(--trade-success))]">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center">
              <p className="font-semibold text-[hsl(var(--trade-success))]">
                Deal Complete
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
