import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client-universal';

export const usePageVisitTracker = () => {
  const location = useLocation();
  const lastTrackedRef = useRef<{ page: string; time: number }>({ page: '', time: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPage = `${location.pathname}${location.search}`;
    const now = Date.now();

    // Prevent spamming identical page hit within 3 seconds (e.g. fast state re-renders)
    if (lastTrackedRef.current.page === currentPage && now - lastTrackedRef.current.time < 3000) {
      return;
    }
    lastTrackedRef.current = { page: currentPage, time: now };

    const recordVisit = async () => {
      try {
        const userAgent = navigator.userAgent;
        const referrer = document.referrer || undefined;
        const screenResolution = window.screen ? `${window.screen.width}x${window.screen.height}` : undefined;
        const language = navigator.language || undefined;
        let timezone: string | undefined = undefined;
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
          // ignore
        }

        await supabase.functions.invoke('website-visits', {
          body: {
            userAgent,
            page: currentPage,
            referrer,
            screenResolution,
            language,
            timezone,
          },
        });
      } catch {
        // Silently ignore — visit tracking is non-blocking
      }
    };

    recordVisit();
  }, [location.pathname, location.search]);
};

export default usePageVisitTracker;
