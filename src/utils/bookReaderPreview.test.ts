import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  extractGoogleBooksId,
  validateReaderUrl,
  buildSafeGoogleBooksEmbedUrl,
  buildSafePdfEmbedUrl,
  checkGoogleBooksEmbeddability,
} from './bookReaderPreview';

describe('bookReaderPreview utility', () => {
  describe('extractGoogleBooksId', () => {
    it('extracts ID from standard books.google.com URLs', () => {
      expect(
        extractGoogleBooksId('https://books.google.com/books?id=fqiEEQAAQBAJ&lpg=PP1&pg=PP1')
      ).toBe('fqiEEQAAQBAJ');
      expect(
        extractGoogleBooksId('http://books.google.co.in/books?printsec=frontcover&id=J7U719-WcWQC')
      ).toBe('J7U719-WcWQC');
    });

    it('extracts ID from content or about paths', () => {
      expect(
        extractGoogleBooksId('https://books.google.com/books/about/Book.html?id=1234567890AB')
      ).toBe('1234567890AB');
    });

    it('accepts raw valid volume IDs', () => {
      expect(extractGoogleBooksId('fqiEEQAAQBAJ')).toBe('fqiEEQAAQBAJ');
      expect(extractGoogleBooksId('abc_123-XYZ')).toBe('abc_123-XYZ');
    });

    it('returns null for empty or invalid values', () => {
      expect(extractGoogleBooksId('')).toBeNull();
      expect(extractGoogleBooksId(null)).toBeNull();
      expect(extractGoogleBooksId(undefined)).toBeNull();
      expect(extractGoogleBooksId('not a url or id with spaces')).toBeNull();
    });
  });

  describe('validateReaderUrl', () => {
    it('validates and categorizes Google Books URLs correctly', () => {
      const result = validateReaderUrl('https://books.google.com/books?id=fqiEEQAAQBAJ');
      expect(result.isValid).toBe(true);
      expect(result.isGoogleBooks).toBe(true);
      expect(result.googleBooksId).toBe('fqiEEQAAQBAJ');
      expect(result.isPdf).toBe(false);
    });

    it('validates raw Google Books IDs and turns them into safe URL', () => {
      const result = validateReaderUrl('fqiEEQAAQBAJ');
      expect(result.isValid).toBe(true);
      expect(result.isGoogleBooks).toBe(true);
      expect(result.googleBooksId).toBe('fqiEEQAAQBAJ');
      expect(result.sanitizedUrl).toBe('https://books.google.com/books?id=fqiEEQAAQBAJ');
    });

    it('validates and categorizes PDF URLs correctly', () => {
      const result = validateReaderUrl('https://example.com/storage/book.pdf?token=secret123');
      expect(result.isValid).toBe(true);
      expect(result.isPdf).toBe(true);
      expect(result.isGoogleBooks).toBe(false);
    });

    it('rejects unsafe schemes like javascript: or data:', () => {
      expect(validateReaderUrl('javascript:alert(1)').isValid).toBe(false);
      expect(validateReaderUrl('data:text/html,evil').isValid).toBe(false);
      expect(validateReaderUrl('file:///etc/passwd').isValid).toBe(false);
    });
  });

  describe('buildSafePdfEmbedUrl', () => {
    it('appends toolbar and page number to hash without modifying searchParams or auth tokens', () => {
      const signedUrl =
        'https://example.com/book.pdf?X-Amz-Security-Token=token123&X-Amz-Signature=sig456';
      const embedUrl = buildSafePdfEmbedUrl(signedUrl, 15);

      expect(embedUrl).toContain('X-Amz-Security-Token=token123');
      expect(embedUrl).toContain('X-Amz-Signature=sig456');
      expect(embedUrl).toContain('#toolbar=1&navpanes=1&scrollbar=1&page=15');
    });

    it('clamps negative or zero page numbers to 1', () => {
      const embedUrl = buildSafePdfEmbedUrl('https://example.com/book.pdf', 0);
      expect(embedUrl).toContain('#toolbar=1&navpanes=1&scrollbar=1&page=1');
    });
  });

  describe('buildSafeGoogleBooksEmbedUrl', () => {
    it('builds standard output=embed URL', () => {
      expect(buildSafeGoogleBooksEmbedUrl('fqiEEQAAQBAJ')).toBe(
        'https://books.google.com/books?id=fqiEEQAAQBAJ&lpg=PP1&pg=PP1&output=embed'
      );
    });

    it('returns empty string for invalid ID', () => {
      expect(buildSafeGoogleBooksEmbedUrl('')).toBe('');
    });
  });

  describe('checkGoogleBooksEmbeddability', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('returns available status when embeddable is true and viewability is not NO_PAGES', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id-1',
          volumeInfo: { title: 'Dune', previewLink: 'https://books.google.com/preview' },
          accessInfo: { embeddable: true, viewability: 'PARTIAL' },
        }),
      } as any);

      const res = await checkGoogleBooksEmbeddability('test-id-1');
      expect(res.status).toBe('available');
      expect(res.embeddable).toBe(true);
      expect(res.viewability).toBe('PARTIAL');
      expect(res.title).toBe('Dune');
    });

    it('returns restricted status when embeddable is false', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id-2',
          volumeInfo: { title: 'Restricted Book' },
          accessInfo: { embeddable: false, viewability: 'NO_PAGES' },
        }),
      } as any);

      const res = await checkGoogleBooksEmbeddability('test-id-2');
      expect(res.status).toBe('restricted');
      expect(res.embeddable).toBe(false);
    });

    it('returns restricted status when volume returns 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      const res = await checkGoogleBooksEmbeddability('not-found-id');
      expect(res.status).toBe('restricted');
      expect(res.embeddable).toBe(false);
    });

    it('falls back to unknown on network error or timeout', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const res = await checkGoogleBooksEmbeddability('test-error-id');
      expect(res.status).toBe('unknown');
      expect(res.embeddable).toBe(true);
    });
  });
});

