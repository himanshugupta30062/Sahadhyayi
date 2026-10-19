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

const cleanCampaignValue = (value: string | null) =>
  value ? value.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 100) || null : null;

const safeMetadataKeys = new Set([
  'target_type', 'target_label', 'target_id', 'target_href', 'component', 'section',
  'action', 'cta', 'filter', 'completed', 'step', 'item_type', 'item_id',
  'book_id', 'group_id', 'post_id', 'form_id', 'form_name', 'input_type',
  'field_name', 'control_type', 'query_length', 'result_count', 'duration_ms',
  'scroll_depth_percent', 'tab', 'method', 'status', 'source', 'category',
  'is_authenticated', 'success', 'opened',
]);

/**
 * Client-side allowlist is only a first pass; website-visits validates metadata again
 * on the server. Form values, search text, message bodies, passwords and tokens are
 * deliberately never accepted as analytics metadata.
 */
export const sanitizeAnalyticsMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const clean: Record<string, string | number | boolean> = {};

  for (const [rawKey, value] of Object.entries(metadata)) {
    const key = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40);
    if (!safeMetadataKeys.has(key)) continue;

    if (typeof value === 'string') {
      const normalized = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!normalized) continue;
      clean[key] = normalized.slice(0, key === 'target_label' ? 80 : 120);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      clean[key] = Math.max(0, Math.min(value, key === 'duration_ms' ? 1800000 : 1000000000));
    } else if (typeof value === 'boolean') {
      clean[key] = value;
    }
  }

  return Object.keys(clean).length ? clean : undefined;
};

// Per-event in-memory deduplication: preserve distinct button labels and actions.
const recentEvents = new Map<string, number>();

export const trackAnalyticsEvent = async (
  eventType: 'pageview' | 'activity',
  eventName?: string,
  pagePath?: string,
  metadata?: Record<string, unknown>,
) => {
  if (typeof window === 'undefined') return;

  const safeMetadata = sanitizeAnalyticsMetadata(metadata);
  const page = (pagePath || window.location.pathname).split(/[?#]/, 1)[0].slice(0, 200) || '/';
  const fingerprint = safeMetadata ? JSON.stringify(safeMetadata, Object.keys(safeMetadata).sort()) : '';
  const dedupKey = `${eventType}:${eventName || ''}:${page}:${fingerprint}`;
  const now = Date.now();
  const lastEmitted = recentEvents.get(dedupKey);
  // Deduplicate accidental duplicate route pageviews, but never drop genuine rapid actions.
  if (eventType === 'pageview') {
    if (lastEmitted && now - lastEmitted < 3000) return;
    recentEvents.set(dedupKey, now);
    if (recentEvents.size > 200) {
      for (const [key, time] of recentEvents.entries()) {
        if (now - time > 30000 || recentEvents.size > 200) recentEvents.delete(key);
      }
    }
  }

  try {
    const { visitorId, sessionId } = getAnalyticsIds();
    const query = new URLSearchParams(window.location.search);
    let referrer: string | null = null;
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname.slice(0, 200) : null;
    } catch {
      referrer = null;
    }

    const { data: authData } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (authData?.session?.access_token) {
      headers.Authorization = `Bearer ${authData.session.access_token}`;
    }

    const { error } = await supabase.functions.invoke('website-visits', {
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
        metadata: safeMetadata,
      },
    });

    if (error && import.meta.env.DEV) {
      console.debug('[analytics] Event was not recorded:', error.message);
    }
  } catch {
    // Analytics must never block navigation or a product action.
  }
};

export const trackUiEvent = (eventName: string, metadata?: Record<string, unknown>) =>
  trackAnalyticsEvent('activity', eventName, undefined, metadata);

export const trackBookOpened = (bookId: string, _title?: string) =>
  trackAnalyticsEvent('activity', 'book_opened', `/book/${bookId}`, { book_id: bookId, item_type: 'book' });

export const trackReadingStarted = (bookId: string, _title?: string) =>
  trackAnalyticsEvent('activity', 'reading_started', `/reader/${bookId}`, { book_id: bookId, item_type: 'book' });

export const trackReadingCompleted = (bookId: string, _title?: string) =>
  trackAnalyticsEvent('activity', 'reading_completed', `/reader/${bookId}`, { book_id: bookId, item_type: 'book' });

export const trackGroupJoined = (groupId: string, _groupName?: string) =>
  trackAnalyticsEvent('activity', 'group_joined', `/groups/${groupId}`, { group_id: groupId, item_type: 'group' });

export const trackDiscussionCreated = (postId: string) =>
  trackAnalyticsEvent('activity', 'discussion_created', '/social', { post_id: postId, item_type: 'post' });
