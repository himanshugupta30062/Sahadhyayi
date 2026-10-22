import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client-universal';
import { cleanCampaignValue, getAnalyticsIds } from '@/lib/analytics';

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

        if (invokeErr) {
          // Do not create rows without server-derived IP/geolocation as a fallback.
          console.warn('Page-view analytics ingestion failed; skipping metadata-free RPC fallback.', invokeErr);
        }
      } catch (error) {
        // Tracking remains non-blocking, but all page-view writes must go through the Edge Function.
        console.warn('Page-view analytics could not reach the ingestion function.', error);
      }
    };

    recordVisit();

    // Measure visible time continuously while this page is in the foreground.
    // Requiring a fresh click/scroll every 30 seconds undercounted reading sessions
    // when people read without interacting. Hidden-tab time is still excluded.
    let lastHeartbeatAt = Date.now();
    const sendEngagement = async (seconds: number) => {
      if (seconds <= 0 || document.visibilityState !== 'visible') return;
      try {
        const { visitorId, sessionId } = getAnalyticsIds();
        const { data: authData } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (authData?.session?.access_token) headers.Authorization = `Bearer ${authData.session.access_token}`;
        await supabase.functions.invoke('website-visits', {
          headers,
          body: {
            event_type: 'engagement',
            event_name: 'engaged_time',
            engaged_seconds: Math.min(15, seconds),
            page: currentPage,
            visitor_id: visitorId,
            session_id: sessionId,
            event_id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : undefined,
          },
        });
      } catch {
        // Engagement measurement is best-effort and never blocks navigation.
      }
    };
    const heartbeat = window.setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor(Math.min(15_000, now - lastHeartbeatAt) / 1000);
      lastHeartbeatAt = now;
      void sendEngagement(elapsedSeconds);
    }, 15_000);
    const handleVisibility = () => {
      // Reset the clock on resume so time spent in a background tab is not counted.
      lastHeartbeatAt = Date.now();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    const handlePageHide = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor(Math.min(15_000, now - lastHeartbeatAt) / 1000);
      void sendEngagement(elapsedSeconds);
    };
    window.addEventListener('pagehide', handlePageHide, { once: true });
    
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [location.pathname, location.search]);
};

export default usePageVisitTracker;
