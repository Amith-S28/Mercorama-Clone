import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  message?: string;
  showSkeleton?: boolean;
}

export function LoadingState({ 
  message = 'Analyzing with AI...', 
  showSkeleton = true 
}: LoadingStateProps) {
  return (
    <div className="space-y-6">
      {/* Loading Message */}
      <Card>
        <CardContent className="flex items-center justify-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-lg font-semibold">{message}</p>
            <p className="text-sm text-muted-foreground">
              This may take a few moments...
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Placeholders */}
      {showSkeleton && (
        <>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <div className="pt-4">
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
