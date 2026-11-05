import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionClientLogin } from './sessionClient';
import * as useSecureApiModule from './useSecureApi';
import { supabase } from '@/integrations/supabase/client';

describe('sessionClientLogin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(useSecureApiModule, 'setCsrfToken').mockImplementation(() => {});
  });

  it('retrieves access token from supabase session and mints csrfToken', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: { access_token: 'mock-access-token' } as any,
      },
      error: null,
    });

    const setCsrfSpy = vi.spyOn(useSecureApiModule, 'setCsrfToken');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ csrfToken: 'new-server-csrf' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const token = await sessionClientLogin();
    expect(token).toBe('new-server-csrf');
    expect(setCsrfSpy).toHaveBeenCalledWith('new-server-csrf');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/session',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-access-token',
        }),
      })
    );
  });

  it('proceeds with guest session when supabase getSession fails', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockRejectedValue(new Error('Auth unavailable'));

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ csrfToken: 'guest-csrf' }), { status: 200 })
    );

    const token = await sessionClientLogin();
    expect(token).toBe('guest-csrf');
  });

  it('throws an error if backend returns a non-200 status', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', { status: 500 })
    );

    await expect(sessionClientLogin()).rejects.toThrow('/api/session failed: 500');
  });

  it('throws an error if response lacks csrfToken', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await expect(sessionClientLogin()).rejects.toThrow('No csrfToken in /api/session response');
  });
});

