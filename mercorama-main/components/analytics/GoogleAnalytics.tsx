'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const GA_ID = 'G-57LY2Z3RVV';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const pageEntryTime = useRef<number>(Date.now());

  // Fire page_view on SPA route changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('config', GA_ID, { page_path: pathname });
    pageEntryTime.current = Date.now();
  }, [pathname]);

  // Track time on page when user navigates away or closes tab
  useEffect(() => {
    pageEntryTime.current = Date.now();

    function sendTimeOnPage() {
      const seconds = Math.round((Date.now() - pageEntryTime.current) / 1000);
      if (seconds < 1 || typeof window.gtag !== 'function') return;
      window.gtag('event', 'time_on_page', {
        page_path: pathname,
        seconds_spent: seconds,
      });
    }

    window.addEventListener('beforeunload', sendTimeOnPage);
    return () => window.removeEventListener('beforeunload', sendTimeOnPage);
  }, [pathname]);

  return null;
}
