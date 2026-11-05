import { beforeEach, describe, expect, it, vi } from 'vitest';
import { secureFetch } from './secureFetch';
import * as sessionClientModule from './sessionClient';
import * as useSecureApiModule from './useSecureApi';

describe('secureFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(useSecureApiModule, 'getCsrfToken').mockReturnValue('mock-csrf-token');
    vi.spyOn(useSecureApiModule, 'setCsrfToken').mockImplementation(() => {});
  });

  it('attaches X-CSRF-Token and credentials to outgoing requests', async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const res = await secureFetch('/api/test');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.any(Headers),
      })
    );
    expect(res.status).toBe(200);
  });

  it('updates CSRF token when X-New-CSRF-Token response header is present', async () => {
    const setCsrfSpy = vi.spyOn(useSecureApiModule, 'setCsrfToken');
    const mockResponse = new Response('{}', {
      status: 200,
      headers: { 'X-New-CSRF-Token': 'rotated-token' },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await secureFetch('/api/data');
    expect(setCsrfSpy).toHaveBeenCalledWith('rotated-token');
  });

  it('retries with sessionClientLogin on 401 response and succeeds on retry', async () => {
    const loginSpy = vi.spyOn(sessionClientModule, 'sessionClientLogin').mockResolvedValue('new-token');
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    const successResponse = new Response('Success', { status: 200 });

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce(successResponse);

    const res = await secureFetch('/api/protected');
    expect(loginSpy).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('retries with sessionClientLogin on 403 response', async () => {
    const loginSpy = vi.spyOn(sessionClientModule, 'sessionClientLogin').mockResolvedValue('new-token');
    const forbiddenResponse = new Response('Forbidden', { status: 403 });
    const successResponse = new Response('Success', { status: 200 });

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(forbiddenResponse)
      .mockResolvedValueOnce(successResponse);

    const res = await secureFetch('/api/protected');
    expect(loginSpy).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('returns original 401 response if sessionClientLogin throws', async () => {
    vi.spyOn(sessionClientModule, 'sessionClientLogin').mockRejectedValue(new Error('Network error'));
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(unauthorizedResponse);

    const res = await secureFetch('/api/protected');
    expect(res.status).toBe(401);
  });
});

