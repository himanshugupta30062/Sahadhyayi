import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client-universal';
import { getAnalyticsIds } from '@/lib/analytics';

const cleanCampaignValue = (value: string | null) =>
  value ? value.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 100) || null : null;

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
        const { visitorId, sessionId } = getAnalyticsIds();
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

        const query = new URLSearchParams(window.location.search);

        await supabase.functions.invoke('website-visits', {
          body: {
            event_type: 'pageview',
            page: currentPage,
            referrer,
            visitor_id: visitorId,
            session_id: sessionId,
            utm_source: cleanCampaignValue(query.get('utm_source')),
            utm_medium: cleanCampaignValue(query.get('utm_medium')),
            utm_campaign: cleanCampaignValue(query.get('utm_campaign')),
            userAgent,
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
