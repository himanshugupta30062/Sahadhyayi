import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client-universal';
import { getAnalyticsIds } from '@/lib/analytics';

const cleanCampaignValue = (value: string | null) =>
  value ? value.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 100) || null : null;

// Global in-memory cache preventing duplicate ingestion across React Strict Mode & remounts
const recentPageHits = new Map<string, number>();

export const usePageVisitTracker = () => {
  const location = useLocation();
  const lastTrackedRef = useRef<{ page: string; time: number }>({ page: '', time: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPage = `${location.pathname}${location.search}`;
    const now = Date.now();

    // Prevent spamming identical page hit within 3.5 seconds (React Strict Mode & re-renders)
    const lastGlobalHit = recentPageHits.get(currentPage);
    if (lastGlobalHit && now - lastGlobalHit < 3500) {
      return;
    }
    if (lastTrackedRef.current.page === currentPage && now - lastTrackedRef.current.time < 3500) {
      return;
    }

    recentPageHits.set(currentPage, now);
    lastTrackedRef.current = { page: currentPage, time: now };

    // Prune cache if it grows large
    if (recentPageHits.size > 50) {
      for (const [key, timestamp] of recentPageHits.entries()) {
        if (now - timestamp > 10000) {
          recentPageHits.delete(key);
        }
      }
    }

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

        const { data: authData } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (authData?.session?.access_token) {
          headers['Authorization'] = `Bearer ${authData.session.access_token}`;
        }

        const { error: invokeErr } = await supabase.functions.invoke('website-visits', {
          headers,
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

        // If Edge function reported error, fallback directly to secure RPC
        if (invokeErr) {
          await supabase.rpc('record_pageview', {
            p_page_path: currentPage,
            p_session_id: sessionId,
            p_visitor_id: visitorId,
            p_referrer: referrer || null,
            p_event_type: 'pageview',
          });
        }
      } catch {
        // Fallback directly to secure database RPC if function invoke throws
        try {
          const { visitorId, sessionId } = getAnalyticsIds();
          await supabase.rpc('record_pageview', {
            p_page_path: currentPage,
            p_session_id: sessionId,
            p_visitor_id: visitorId,
            p_referrer: document.referrer || null,
            p_event_type: 'pageview',
          });
        } catch {
          // Analytics is completely non-blocking
        }
      }
    };

    recordVisit();
  }, [location.pathname, location.search]);
};

export default usePageVisitTracker;
