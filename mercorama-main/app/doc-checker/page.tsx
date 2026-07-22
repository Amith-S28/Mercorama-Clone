// app/doc-checker/page.tsx

import { getCurrentUser } from '@/app/auth/get-current-user';
import DocCheckerClient from './_client';

export default async function DocCheckerPage() {
  const user = await getCurrentUser();

  if (!user.features.includes('doc-checker')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Upgrade required</h1>
        <p className="text-muted-foreground">
          Your current plan does not include Doc Checker.
        </p>
        <a href="/beta" className="text-primary underline underline-offset-4">
          View plans
        </a>
      </div>
    );
  }

  return <DocCheckerClient />;
}
