/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInvoke = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

import { sanitizeAnalyticsMetadata, trackAnalyticsEvent } from '@/lib/analytics';

describe('website action analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
  });

  it('keeps only approved metadata and clamps duration values', () => {
    expect(sanitizeAnalyticsMetadata({
      target_label: '  Save book  ',
      cta: 'Join',
      duration_ms: 9000000,
      message: 'private message body',
      password: 'not-for-analytics',
      search_text: 'a private query',
      query_length: 12,
    })).toEqual({
      target_label: 'Save book',
      cta: 'Join',
      duration_ms: 1800000,
      query_length: 12,
    });
  });

  it('sends activity metadata while removing query strings from page paths', async () => {
    window.history.replaceState({}, '', '/social?search=private&access_token=secret');

    await trackAnalyticsEvent(
      'activity',
      `privacy_test_${Date.now()}`,
      '/social?search=private&access_token=secret',
      {
        target_label: 'Like',
        message: 'comment body should never be stored',
        search_text: 'private search query',
      },
    );

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('website-visits', expect.objectContaining({
      body: expect.objectContaining({
        event_type: 'activity',
        page: '/social',
        metadata: { target_label: 'Like' },
      }),
    }));

    const sentBody = mockInvoke.mock.calls[0][1].body;
    expect(JSON.stringify(sentBody)).not.toContain('private search query');
    expect(JSON.stringify(sentBody)).not.toContain('comment body');
    expect(JSON.stringify(sentBody)).not.toContain('access_token');
  });
});
