
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';

const usePageVisitTracker = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recordVisit = async () => {
      try {
        const userAgent = navigator.userAgent;
        const currentPage = window.location.pathname;

        // Use edge function only — it captures IP & country server-side
        await supabase.functions.invoke('website-visits', {
          body: { userAgent, page: currentPage },
        });
      } catch {
        // Silently ignore — visit tracking is non-critical
      }
    };

    recordVisit();
  }, []);
};

export default usePageVisitTracker;
