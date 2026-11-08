import { describe, expect, it, vi, beforeEach } from 'vitest';
import { searchLibgen } from './libgenApi';
import * as secureFetchModule from '../security/secureFetch';

describe('searchLibgen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false and empty list for empty query', async () => {
    const res = await searchLibgen('   ');
    expect(res).toEqual({ success: false, books: [] });
  });

  it('returns error when not on localhost and no backend is configured', async () => {
    const origLocation = window.location;
    delete (window as any).location;
    (window as any).location = { hostname: 'production.com', origin: 'https://production.com' };

    const res = await searchLibgen('calculus');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Libgen proxy is only enabled on local dev proxies');

    (window as any).location = origLocation;
  });

  it('fetches and returns json results on successful response', async () => {
    const mockBooks = [
      { id: '1', title: 'Calculus', author: 'Stewart', mirrorLink: 'http://libgen/1', source: 'libgen' as const }
    ];

    vi.spyOn(secureFetchModule, 'secureFetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, books: mockBooks }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const res = await searchLibgen('calculus');
    expect(res.success).toBe(true);
    expect(res.books).toEqual(mockBooks);
  });

  it('handles non-ok response statuses gracefully', async () => {
    vi.spyOn(secureFetchModule, 'secureFetch').mockResolvedValue(
      new Response('Not found', { status: 404, headers: { 'content-type': 'application/json' } })
    );

    const res = await searchLibgen('quantum');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Libgen search unavailable (status 404)');
  });

  it('handles non-json response format', async () => {
    vi.spyOn(secureFetchModule, 'secureFetch').mockResolvedValue(
      new Response('<html>error</html>', { status: 200, headers: { 'content-type': 'text/html' } })
    );

    const res = await searchLibgen('algebra');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Invalid response format from Libgen service');
  });

  it('handles fetch exceptions gracefully', async () => {
    vi.spyOn(secureFetchModule, 'secureFetch').mockRejectedValue(new Error('Network offline'));

    const res = await searchLibgen('physics');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Network offline');
  });
});

