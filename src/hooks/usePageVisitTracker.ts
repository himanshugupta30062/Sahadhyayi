import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client-universal';
import { getAnalyticsIds, trackAnalyticsEvent, trackUiEvent } from '@/lib/analytics';

const cleanCampaignValue = (value: string | null) =>
  value ? value.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 100) || null : null;

const referrerHost = () => {
  try {
    return document.referrer ? new URL(document.referrer).hostname.slice(0, 200) : undefined;
  } catch {
    return undefined;
  }
};

export const usePageVisitTracker = () => {
  const location = useLocation();
  const lastTrackedRef = useRef<{ page: string; time: number }>({ page: '', time: 0 });

  // Record route pageviews; never store query strings that might contain OAuth codes,
  // reset tokens, search terms or other user-supplied data.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPage = location.pathname.split(/[?#]/, 1)[0] || '/';
    const now = Date.now();
    if (lastTrackedRef.current.page === currentPage && now - lastTrackedRef.current.time < 3000) return;
    lastTrackedRef.current = { page: currentPage, time: now };

    const recordVisit = async () => {
      try {
        const { visitorId, sessionId } = getAnalyticsIds();
        const userAgent = navigator.userAgent;
        const screenResolution = window.screen ? `${window.screen.width}x${window.screen.height}` : undefined;
        const language = navigator.language || undefined;
        let timezone: string | undefined;
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
          // Optional browser context; omit when unavailable.
        }

        const query = new URLSearchParams(window.location.search);
        const { data: authData } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (authData?.session?.access_token) headers.Authorization = `Bearer ${authData.session.access_token}`;

        await supabase.functions.invoke('website-visits', {
          headers,
          body: {
            event_type: 'pageview',
            page: currentPage,
            referrer: referrerHost(),
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
        // Silently ignore tracking failures — never block the product.
      }
    };

    void recordVisit();
  }, [location.pathname]);

  // Broad interaction capture applies across the site without requiring every screen
  // to reimplement telemetry. It records button/link labels and control names only,
  // never form field values, search text, message bodies, or passwords.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onClick = (event: MouseEvent) => {
      const rawTarget = event.target;
      if (!(rawTarget instanceof Element)) return;
      const target = rawTarget.closest<HTMLElement>('a, button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [data-analytics-event], .cursor-pointer, [tabindex="0"]');
      if (!target || target.closest('[data-analytics-ignore="true"], [contenteditable="true"]')) return;
      if (target instanceof HTMLButtonElement && target.disabled) return;
      if (target.getAttribute('aria-disabled') === 'true') return;

      const tag = target.tagName.toLowerCase();
      // Only explicit, developer-authored labels are recorded. Never persist arbitrary
      // visible text, which may contain usernames, post excerpts, book notes or other dynamic content.
      const labelCandidate =
        target.dataset.analyticsLabel ||
        target.getAttribute('aria-label') ||
        target.getAttribute('title') ||
        '';
      const targetLabel = labelCandidate.replace(/\s+/g, ' ').trim().slice(0, 80);
      const metadata: Record<string, unknown> = {
        target_type: tag === 'a' ? 'link' : tag === 'button' ? 'button' : 'interactive',
        ...(targetLabel ? { target_label: targetLabel } : {}),
        ...(target.id ? { target_id: target.id.slice(0, 80) } : {}),
      };

      const section = target.closest<HTMLElement>('[data-analytics-section]')?.dataset.analyticsSection;
      if (section) metadata.section = section.slice(0, 80);

      if (tag === 'a') {
        const anchor = target as HTMLAnchorElement;
        try {
          const href = new URL(anchor.href, window.location.origin);
          metadata.target_href = href.origin === window.location.origin
            ? href.pathname.slice(0, 120)
            : `external:${href.hostname}`.slice(0, 120);
        } catch {
          // Ignore malformed or javascript URLs.
        }
        void trackUiEvent('navigation_click', metadata);
      } else {
        void trackUiEvent(target.dataset.analyticsEvent || 'ui_click', metadata);
      }
    };

    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.closest('[data-analytics-ignore="true"]')) return;
      const formName =
        form.dataset.analyticsForm ||
        form.getAttribute('aria-label') ||
        form.id ||
        form.getAttribute('name') ||
        'unlabeled_form';
      void trackUiEvent('form_submitted', {
        form_name: formName.slice(0, 80),
        ...(form.id ? { form_id: form.id.slice(0, 80) } : {}),
      });
    };

    const onChange = (event: Event) => {
      const control = event.target;
      if (!(control instanceof HTMLSelectElement || control instanceof HTMLInputElement)) return;
      if (control instanceof HTMLInputElement && !['checkbox', 'radio', 'range'].includes(control.type)) return;
      if (control.closest('[data-analytics-ignore="true"]')) return;
      void trackUiEvent('control_changed', {
        control_type: control instanceof HTMLSelectElement ? 'select' : control.type,
        ...(control.name ? { field_name: control.name.slice(0, 80) } : {}),
      });
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('change', onChange, true);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('change', onChange, true);
    };
  }, []);

  // Measure visible, active page time. This is a measured segment, not an estimate
  // based on pageviews, and is grouped by the first-party session ID on the server.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const currentPage = location.pathname.split(/[?#]/, 1)[0] || '/';
    let visibleSince: number | null = document.visibilityState === 'hidden' ? null : Date.now();

    const flushDuration = () => {
      if (visibleSince === null) return;
      const duration = Math.min(Date.now() - visibleSince, 30 * 60 * 1000);
      visibleSince = null;
      if (duration < 1000) return;
      void trackAnalyticsEvent('activity', 'page_engagement_duration', currentPage, {
        duration_ms: Math.round(duration),
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushDuration();
      } else if (visibleSince === null) {
        visibleSince = Date.now();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flushDuration);

    return () => {
      flushDuration();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flushDuration);
    };
  }, [location.pathname]);

  // Store coarse scroll-depth milestones at most once per page. No scroll positions
  // or content are retained, only the 25/50/75/100% milestone.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const sent = new Set<number>();
    const onScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const depth = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100));
      for (const milestone of [25, 50, 75, 100]) {
        if (depth >= milestone && !sent.has(milestone)) {
          sent.add(milestone);
          void trackAnalyticsEvent('activity', 'scroll_depth', location.pathname, {
            scroll_depth_percent: milestone,
          });
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

};

export default usePageVisitTracker;
