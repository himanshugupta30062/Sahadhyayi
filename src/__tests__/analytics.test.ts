/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAnalyticsIds, trackAnalyticsEvent, trackUiEvent } from '@/lib/analytics';

const invoke = vi.fn().mockResolvedValue({ data: { recorded: true }, error: null });
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { functions: { invoke } },
}));

describe('privacy-conscious analytics events', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    invoke.mockClear();
    vi.useRealTimers();
  });

  it('reuses a visitor and session id during activity, then rotates after 30 minutes idle', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T10:00:00Z'));
    const first = getAnalyticsIds();
    const second = getAnalyticsIds();
    expect(second).toEqual(first);

    vi.setSystemTime(new Date('2026-10-11T10:31:00Z'));
    const afterIdle = getAnalyticsIds();
    expect(afterIdle.visitorId).toBe(first.visitorId);
    expect(afterIdle.sessionId).not.toBe(first.sessionId);
  });

  it('strips query strings from page paths and sends no visitor-level metadata', async () => {
    await trackAnalyticsEvent('pageview', undefined, '/book/abc?token=private#chapter-2');
    expect(invoke).toHaveBeenCalledOnce();
    const body = invoke.mock.calls[0][1]?.body as Record<string, unknown>;
    expect(body.page).toBe('/book/abc');
    expect(body.event_type).toBe('pageview');
    expect(body.session_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.visitor_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body).not.toHaveProperty('user_agent');
    expect(body).not.toHaveProperty('ip_address');
    expect(body).not.toHaveProperty('metadata');
  });

  it('does not transmit arbitrary UI metadata', async () => {
    await trackUiEvent('group_participation', { email: 'reader@example.com', groupId: 'private-id' });
    const body = invoke.mock.calls[0][1]?.body as Record<string, unknown>;
    expect(body.event_name).toBe('group_participation');
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('groupId');
  });
});
