'use client';

import { useEffect } from 'react';

export function ViewTracker({ view }: { view: string }) {
  useEffect(() => {
    try { localStorage.setItem('mercorama_last_view', view); } catch {}
  }, [view]);
  return null;
}
