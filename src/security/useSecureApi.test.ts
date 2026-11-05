import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getCsrfToken, setCsrfToken, useSecureApi } from './useSecureApi';
import { supabase } from '@/integrations/supabase/client';

describe('useSecureApi & CSRF token storage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('gets and sets CSRF token in localStorage', () => {
    expect(getCsrfToken()).toBe('');
    setCsrfToken('test-csrf-token');
    expect(getCsrfToken()).toBe('test-csrf-token');
    setCsrfToken(null);
    expect(getCsrfToken()).toBe('');
  });

  it('handles localStorage errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Access denied');
    });
    expect(getCsrfToken()).toBe('');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('Quota exceeded');
    });
    expect(() => setCsrfToken('fail-token')).not.toThrow();
  });

  it('initializes session without access token for guest users', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ csrfToken: 'guest-csrf-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { result } = renderHook(() => useSecureApi());

    let token = '';
    await act(async () => {
      token = await result.current.login();
    });

    expect(token).toBe('guest-csrf-123');
    expect(getCsrfToken()).toBe('guest-csrf-123');
    expect(fetchSpy).toHaveBeenCalledWith('/api/session', expect.objectContaining({
      method: 'POST',
      body: '{}',
    }));
  });

  it('initializes session with access token for authenticated users', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { access_token: 'auth-jwt-token' } as any },
      error: null,
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ csrfToken: 'auth-csrf-456' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { result } = renderHook(() => useSecureApi());

    let token = '';
    await act(async () => {
      token = await result.current.login();
    });

    expect(token).toBe('auth-csrf-456');
    expect(fetchSpy).toHaveBeenCalledWith('/api/session', expect.objectContaining({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer auth-jwt-token',
      },
      body: JSON.stringify({ access_token: 'auth-jwt-token' }),
    }));
  });

  it('throws SESSION_INIT_FAILED when fetch fails or response is not ok', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 })
    );

    const { result } = renderHook(() => useSecureApi());

    await expect(result.current.login()).rejects.toThrow('SESSION_INIT_FAILED');
  });

  it('clears csrfToken on logout even if delete fails', async () => {
    setCsrfToken('active-token');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSecureApi());

    await act(async () => {
      await result.current.logout().catch(() => {});
    });

    expect(getCsrfToken()).toBe('');
  });
});
