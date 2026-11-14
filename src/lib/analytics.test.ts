// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client-universal';
import {
  cleanCampaignValue,
  getAnalyticsIds,
  trackAnalyticsEvent,
  trackUiEvent,
  trackBookOpened,
} from './analytics';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    functions: { invoke: vi.fn() },
  },
}));

const VISITOR_KEY = 'sahadhyayi.analytics.visitor';
const SESSION_KEY = 'sahadhyayi.analytics.session';

describe('client analytics utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
    window.history.replaceState({}, '', '/?utm_source=reader%21&utm_medium=social&utm_campaign=launch%20day');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as never);
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sanitizes campaign values, trims whitespace and enforces the length limit', () => {
    expect(cleanCampaignValue('  book!club@2026  ')).toBe('bookclub2026');
    expect(cleanCampaignValue('   ')).toBe(null);
    expect(cleanCampaignValue(null)).toBe(null);
    expect(cleanCampaignValue('x'.repeat(120))).toHaveLength(100);
  });

  it('creates and persists valid visitor and session UUIDs on first use', () => {
    const ids = getAnalyticsIds();

    expect(ids.visitorId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(ids.sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(localStorage.getItem(VISITOR_KEY)).toBe(ids.visitorId);
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}')).toMatchObject({ id: ids.sessionId });
  });

  it('reuses valid visitor and active session IDs while refreshing lastSeen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T10:00:00Z'));
    const visitorId = '123e4567-e89b-42d3-a456-426614174000';
    const sessionId = '123e4567-e89b-42d3-a456-426614174001';
    localStorage.setItem(VISITOR_KEY, visitorId);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: sessionId, lastSeen: Date.now() - 1000 }));

    const ids = getAnalyticsIds();

    expect(ids).toEqual({ visitorId, sessionId });
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}').lastSeen).toBe(Date.now());
  });

  it('replaces malformed visitor and expired session IDs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T10:00:00Z'));
    localStorage.setItem(VISITOR_KEY, 'not-a-uuid');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      id: '123e4567-e89b-42d3-a456-426614174001',
      lastSeen: Date.now() - 31 * 60 * 1000,
    }));

    const ids = getAnalyticsIds();

    expect(ids.visitorId).not.toBe('not-a-uuid');
    expect(ids.sessionId).not.toBe('123e4567-e89b-42d3-a456-426614174001');
  });

  it('sends a pageview with sanitized URL, campaign and anonymous identifiers', async () => {
    await trackAnalyticsEvent('pageview', undefined, '/books/featured?sort=popular#top');

    expect(supabase.functions.invoke).toHaveBeenCalledWith('website-visits', expect.objectContaining({
      headers: {},
      body: expect.objectContaining({
        event_type: 'pageview',
        event_name: null,
        page: '/books/featured',
        utm_source: 'reader',
        utm_medium: 'social',
        utm_campaign: 'launch day',
      }),
    }));
  });

  it('deduplicates identical events within the short window', async () => {
    await trackAnalyticsEvent('activity', 'coverage_test_event', '/coverage/dedup-2026-11-14');
    await trackAnalyticsEvent('activity', 'coverage_test_event', '/coverage/dedup-2026-11-14');

    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it('uses convenience helpers to report UI and book activity paths', async () => {
    await trackUiEvent('coverage-ui-action');
    await trackBookOpened('book-coverage-123');

    expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
    expect(supabase.functions.invoke).toHaveBeenNthCalledWith(2, 'website-visits', expect.objectContaining({
      body: expect.objectContaining({ event_name: 'book_opened', page: '/book/book-coverage-123' }),
    }));
  });

  it('includes an authenticated bearer token when a session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'test-access-token' } },
      error: null,
    } as never);

    await trackAnalyticsEvent('activity', 'authenticated-analytics', '/coverage/authenticated');

    expect(supabase.functions.invoke).toHaveBeenCalledWith('website-visits', expect.objectContaining({
      headers: { Authorization: 'Bearer test-access-token' },
    }));
  });
});
