
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';

const usePageVisitTracker = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recordVisit = async () => {
      try {
        const userAgent = navigator.userAgent;
        const currentPage = window.location.pathname;
        const referrer = document.referrer || undefined;
        const screenResolution = `${window.screen.width}x${window.screen.height}`;
        const language = navigator.language || undefined;

        await supabase.functions.invoke('website-visits', {
          body: {
            userAgent,
            page: currentPage,
            referrer,
            screenResolution,
            language,
          },
        });
      } catch {
        // Silently ignore — visit tracking is non-critical
      }
    };

    recordVisit();
  }, []);
};

export default usePageVisitTracker;
