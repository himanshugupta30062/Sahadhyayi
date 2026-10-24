import { supabase } from '@/integrations/supabase/client-universal';

const VISITOR_KEY = 'sahadhyayi.analytics.visitor';
const SESSION_KEY = 'sahadhyayi.analytics.session';
const SESSION_IDLE_MS = 30 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const newId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

const readStorage = (storage: Storage, key: string) => {
  try { return storage.getItem(key); } catch { return null; }
};
const writeStorage = (storage: Storage, key: string, value: string) => {
  try { storage.setItem(key, value); } catch { /* analytics stays optional */ }
};

export const getAnalyticsIds = () => {
  if (typeof window === 'undefined') return { visitorId: null, sessionId: null };
  let visitorId = readStorage(window.localStorage, VISITOR_KEY);
  if (!visitorId || !UUID_RE.test(visitorId)) {
    visitorId = newId();
    writeStorage(window.localStorage, VISITOR_KEY, visitorId);
  }

  const now = Date.now();
  let session: { id: string; lastSeen: number } | null = null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    session = raw ? JSON.parse(raw) : null;
  } catch { session = null; }
  if (!session || !UUID_RE.test(session.id) || now - session.lastSeen > SESSION_IDLE_MS) {
    session = { id: newId(), lastSeen: now };
  } else {
    session.lastSeen = now;
  }
  writeStorage(window.sessionStorage, SESSION_KEY, JSON.stringify(session));
  return { visitorId, sessionId: session.id };
};

export const cleanCampaignValue = (value: string | null) =>
  value ? value.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 100) || null : null;

// In-memory deduplication set to avoid duplicate event insertion within 4 seconds
const recentEvents = new Map<string, number>();

export const trackAnalyticsEvent = async (
  eventType: 'pageview' | 'activity',
  eventName?: string,
  pagePath?: string,
  _metadata?: Record<string, any>,
) => {
  if (typeof window === 'undefined') return;

  const dedupKey = `${eventType}:${eventName || ''}:${pagePath || window.location.pathname}`;
  const now = Date.now();
  const lastEmitted = recentEvents.get(dedupKey);
  if (lastEmitted && now - lastEmitted < 4000) {
    return; // Suppress duplicate events within 4 seconds
  }
  recentEvents.set(dedupKey, now);

  // Clean old deduplication entries
  if (recentEvents.size > 100) {
    for (const [k, time] of recentEvents.entries()) {
      if (now - time > 10000) recentEvents.delete(k);
    }
  }

  try {
    const { visitorId, sessionId } = getAnalyticsIds();
    const query = new URLSearchParams(window.location.search);
    const page = (pagePath || window.location.pathname).split(/[?#]/, 1)[0].slice(0, 200) || '/';
    let referrer: string | null = null;
    try { referrer = document.referrer ? new URL(document.referrer).hostname.slice(0, 200) : null; } catch { referrer = null; }

    const { data: authData } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (authData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${authData.session.access_token}`;
    }

    const { error: invokeErr } = await supabase.functions.invoke('website-visits', {
      headers,
      body: {
        event_id: newId(),
        event_type: eventType,
        event_name: eventType === 'activity' ? eventName : null,
        page,
        referrer,
        visitor_id: visitorId,
        session_id: sessionId,
        utm_source: cleanCampaignValue(query.get('utm_source')),
        utm_medium: cleanCampaignValue(query.get('utm_medium')),
        utm_campaign: cleanCampaignValue(query.get('utm_campaign')),
      },
    });

    if (invokeErr) {
      // Do not use the database RPC fallback: it cannot populate server-derived IP/geolocation.
      console.warn('Website analytics ingestion failed; no metadata-free fallback was written.', invokeErr);
    }
  } catch (error) {
    // Analytics never blocks product actions or navigation. Keep page-view metadata server-derived.
    console.warn('Website analytics could not reach the ingestion function.', error);
  }
};

export const trackUiEvent = (eventName: string, metadata?: Record<string, any>) =>
  trackAnalyticsEvent('activity', eventName, undefined, metadata);

export const trackBookOpened = (bookId: string, _title?: string) =>
  trackAnalyticsEvent('activity', 'book_opened', `/book/${bookId}`);

export const trackReadingStarted = (bookId: string, _title?: string) =>
  trackAnalyticsEvent('activity', 'reading_started', `/reader/${bookId}`);

export const trackReadingCompleted = (bookId: string, _title?: string) =>
  trackAnalyticsEvent('activity', 'reading_completed', `/reader/${bookId}`);

export const trackGroupJoined = (groupId: string, _groupName?: string) =>
  trackAnalyticsEvent('activity', 'group_joined', `/groups/${groupId}`);

export const trackDiscussionCreated = (postId: string) =>
  trackAnalyticsEvent('activity', 'discussion_created', `/social?post=${postId}`);
