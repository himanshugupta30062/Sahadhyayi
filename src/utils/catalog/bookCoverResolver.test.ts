import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc: vi.fn().mockResolvedValue({ data: true, error: null }) },
}));
import {
  clearCoverCache,
  fetchGoogleBooksCover,
  fetchOpenLibraryCoverBySearch,
  getBookLookupKey,
  getCachedCover,
  getOpenLibraryCoverUrl,
  persistVerifiedCoverToDatabase,
  resolveGenuineBookCover,
  setCachedCover,
} from '@/utils/catalog/bookCoverResolver';

const book = { id: 'book-1', title: 'Matilda', author: 'Roald Dahl', isbn: '9780140328721' };
const response = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('bookCoverResolver', () => {
  beforeEach(() => {
    clearCoverCache();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    cleanup();
    clearCoverCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds stable lookup keys and validates ISBN cover URLs', () => {
    expect(getBookLookupKey(book)).toBe('id_book-1');
    expect(getBookLookupKey({ title: 'Matilda', author: 'Roald Dahl' })).toContain('meta_');
    expect(getOpenLibraryCoverUrl('invalid')).toBeNull();
    expect(getOpenLibraryCoverUrl(book.isbn, 'L')).toContain('-L.jpg?default=false');
  });

  it('persists and retrieves memory and localStorage cache entries including negative results', () => {
    setCachedCover(book, 'https://covers.example/matilda.jpg');
    expect(getCachedCover(book)).toBe('https://covers.example/matilda.jpg');
    setCachedCover({ ...book, id: 'negative' }, null);
    expect(getCachedCover({ ...book, id: 'negative' })).toBeNull();
    clearCoverCache();
    expect(getCachedCover(book)).toBeUndefined();
  });

  it('rejects unsafe cover persistence and handles RPC failure', async () => {
    expect(await persistVerifiedCoverToDatabase('', 'https://cover.test/x')).toBe(false);
    expect(await persistVerifiedCoverToDatabase('id', 'http://cover.test/x')).toBe(false);
    const { supabase } = await import('@/integrations/supabase/client-universal');
    vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error('offline'));
    expect(await persistVerifiedCoverToDatabase('id', 'https://cover.test/x')).toBe(false);
  });

  it('prefers an existing secure cover and resolves a valid ISBN without network search', async () => {
    await expect(resolveGenuineBookCover({ ...book, cover_image_url: 'https://publisher.test/cover.jpg' }))
      .resolves.toBe('https://publisher.test/cover.jpg');
    await expect(resolveGenuineBookCover(book)).resolves.toContain('https://covers.openlibrary.org/b/isbn/');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses cached negative results without repeating network requests', async () => {
    setCachedCover(book, null);
    await expect(resolveGenuineBookCover(book)).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('searches Open Library by title and author and retries title-only when needed', async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => response({ docs: [] }))
      .mockImplementationOnce(() => response({ docs: [{ title: 'Matilda', cover_i: 123 }] }));
    await expect(fetchOpenLibraryCoverBySearch('Matilda', 'Roald Dahl'))
      .resolves.toBe('https://covers.openlibrary.org/b/id/123-L.jpg');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects unrelated Open Library matches and handles provider errors', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response({ docs: [{ title: 'Unrelated book', cover_i: 123 }] }));
    await expect(fetchOpenLibraryCoverBySearch('Matilda')).resolves.toBeNull();
    vi.mocked(fetch).mockImplementationOnce(() => response({}, 503));
    await expect(fetchOpenLibraryCoverBySearch('Matilda')).resolves.toBeNull();
  });

  it('verifies Google Books title matches and upgrades thumbnail URLs to HTTPS', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response({ items: [{
      volumeInfo: { title: 'Matilda', imageLinks: { thumbnail: 'http://books.example/cover.jpg&edge=curl' } },
    }] }));
    await expect(fetchGoogleBooksCover('Matilda')).resolves.toBe('https://books.example/cover.jpg');
    vi.mocked(fetch).mockImplementationOnce(() => response({ items: [{ volumeInfo: {
      title: 'Different title', imageLinks: { thumbnail: 'https://books.example/no.jpg' },
    } }] }));
    await expect(fetchGoogleBooksCover('Matilda')).resolves.toBeNull();
  });

  it('returns null for empty Google Books results and fetch failures', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response({ items: [] }));
    await expect(fetchGoogleBooksCover('Matilda')).resolves.toBeNull();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
    await expect(fetchGoogleBooksCover('Matilda')).resolves.toBeNull();
  });
});
