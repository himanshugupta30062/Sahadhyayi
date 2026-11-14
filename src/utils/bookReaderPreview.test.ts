import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractGoogleBooksId, validateReaderUrl, buildSafeGoogleBooksEmbedUrl,
  buildSafePdfEmbedUrl, checkGoogleBooksEmbeddability,
} from './bookReaderPreview';

describe('extractGoogleBooksId', () => {
  it('extracts query, path, and raw volume IDs', () => {
    expect(extractGoogleBooksId('https://books.google.com/books?id=Abc12345')).toBe('Abc12345');
    expect(extractGoogleBooksId('https://books.google.com/books/reader/Abc12345')).toBe('Abc12345');
    expect(extractGoogleBooksId('Abc12345')).toBe('Abc12345');
  });
  it('rejects empty and invalid identifiers', () => {
    expect(extractGoogleBooksId('')).toBeNull();
    expect(extractGoogleBooksId(undefined)).toBeNull();
    expect(extractGoogleBooksId('short')).toBeNull();
    expect(extractGoogleBooksId('https://example.com/book')).toBeNull();
  });
});

describe('validateReaderUrl', () => {
  it('normalizes Google IDs and recognizes PDF, EPUB, archive and proxy sources', () => {
    expect(validateReaderUrl('Abc12345')).toMatchObject({ isValid: true, sanitizedUrl: 'https://books.google.com/books?id=Abc12345', isGoogleBooks: true });
    expect(validateReaderUrl('https://cdn.test/book.pdf?token=x').isPdf).toBe(true);
    expect(validateReaderUrl('https://cdn.test/book.epub').isEpub).toBe(true);
    expect(validateReaderUrl('https://archive.org/details/book').isPdf).toBe(true);
    expect(validateReaderUrl('https://cdn.test/pdf-proxy?id=1').isPdf).toBe(true);
  });
  it.each(['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'not a url'])('rejects unsafe URL %s', url => {
    expect(validateReaderUrl(url).isValid).toBe(false);
  });
  it('handles nullish values', () => expect(validateReaderUrl(null)).toMatchObject({ isValid: false, sanitizedUrl: null, googleBooksId: null }));
});

describe('embed URL builders', () => {
  it('builds valid Google Books embed URLs only', () => {
    expect(buildSafeGoogleBooksEmbedUrl('Abc12345')).toContain('https://books.google.com/books?id=Abc12345');
    expect(buildSafeGoogleBooksEmbedUrl('bad')).toBe('');
  });
  it('preserves signed PDF query params and clamps pages', () => {
    const url = buildSafePdfEmbedUrl('https://cdn.test/book.pdf?signature=abc&expires=42', 0);
    expect(url).toContain('signature=abc');
    expect(url).toContain('expires=42');
    expect(url).toContain('#toolbar=1&navpanes=1&scrollbar=1&page=1');
    expect(buildSafePdfEmbedUrl('https://cdn.test/book.pdf', 4.8)).toContain('page=4');
  });
  it('supports relative/malformed URLs and empty input', () => {
    expect(buildSafePdfEmbedUrl('relative.pdf#old', 3)).toBe('relative.pdf#toolbar=1&navpanes=1&scrollbar=1&page=3');
    expect(buildSafePdfEmbedUrl('', 2)).toBe('');
  });
});

describe('checkGoogleBooksEmbeddability', () => {
  afterEach(() => vi.restoreAllMocks());
  it('returns invalid ID without fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await checkGoogleBooksEmbeddability('bad')).toMatchObject({ status: 'invalid_id', embeddable: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('returns available metadata for embeddable volume', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ accessInfo: { embeddable: true, viewability: 'PARTIAL', webReaderLink: 'reader' }, volumeInfo: { title: 'Test', previewLink: 'preview' } }) } as Response);
    expect(await checkGoogleBooksEmbeddability('Abc12345')).toMatchObject({ status: 'available', embeddable: true, viewability: 'PARTIAL', title: 'Test', previewLink: 'preview' });
  });
  it('handles 404 and other HTTP errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    expect(await checkGoogleBooksEmbeddability('Abc12345')).toMatchObject({ status: 'restricted', viewability: 'NO_PAGES' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    expect(await checkGoogleBooksEmbeddability('Abc12345')).toMatchObject({ status: 'unknown', embeddable: true });
  });
  it('handles restricted response and network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ accessInfo: { embeddable: false, viewability: 'NO_PAGES' }, volumeInfo: { infoLink: 'info' } }) } as Response);
    expect(await checkGoogleBooksEmbeddability('Abc12345')).toMatchObject({ status: 'restricted', embeddable: false, infoLink: 'info' });
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'));
    expect(await checkGoogleBooksEmbeddability('Abc12345')).toMatchObject({ status: 'unknown', embeddable: true });
  });
});
