import { describe, expect, it } from 'vitest';
import {
  SUPABASE_PDF_PROXY_URL,
  isWhitelistedProxyHost,
  isCorsRestrictedPdf,
  getProxiedPdfUrl,
} from './pdfProxyHelper';

describe('pdfProxyHelper', () => {
  describe('isWhitelistedProxyHost', () => {
    it('accepts exact allowlisted hosts and their subdomains', () => {
      expect(isWhitelistedProxyHost('https://gutenberg.org/ebooks/1')).toBe(true);
      expect(isWhitelistedProxyHost('https://www.gutenberg.org/ebooks/1')).toBe(true);
      expect(isWhitelistedProxyHost('https://cdn.archive.org/book.pdf')).toBe(true);
      expect(isWhitelistedProxyHost('https://files.sahadhyayi.com/book.pdf')).toBe(true);
    });

    it('accepts educational domains but rejects lookalike suffixes', () => {
      expect(isWhitelistedProxyHost('https://library.example.edu/book.pdf')).toBe(true);
      expect(isWhitelistedProxyHost('https://archive.org.attacker.test/book.pdf')).toBe(false);
      expect(isWhitelistedProxyHost('https://gutenberg.org.attacker.test/book.pdf')).toBe(false);
      expect(isWhitelistedProxyHost('https://notgoogle.com/book.pdf')).toBe(false);
    });

    it('returns false for empty and malformed URLs', () => {
      expect(isWhitelistedProxyHost('')).toBe(false);
      expect(isWhitelistedProxyHost('not a URL')).toBe(false);
      expect(isWhitelistedProxyHost('javascript:alert(1)')).toBe(false);
    });
  });

  describe('isCorsRestrictedPdf', () => {
    it('does not flag same-origin, Supabase, blob, or data URLs', () => {
      expect(isCorsRestrictedPdf('https://localhost:8443/book.pdf')).toBe(false);
      expect(isCorsRestrictedPdf('https://assets.supabase.co/book.pdf')).toBe(false);
      expect(isCorsRestrictedPdf('blob:https://localhost/123')).toBe(false);
      expect(isCorsRestrictedPdf('data:application/pdf;base64,abc')).toBe(false);
    });

    it('flags valid external HTTP URLs and rejects invalid values', () => {
      expect(isCorsRestrictedPdf('https://cdn.example.org/book.pdf')).toBe(true);
      expect(isCorsRestrictedPdf('')).toBe(false);
      expect(isCorsRestrictedPdf('not a URL')).toBe(false);
    });
  });

  describe('getProxiedPdfUrl', () => {
    it('returns an empty string for an empty input', () => {
      expect(getProxiedPdfUrl('')).toBe('');
    });

    it('does not proxy an already proxied URL a second time', () => {
      const existing = `${SUPABASE_PDF_PROXY_URL}?url=https%3A%2F%2Fgutenberg.org%2Fbook.pdf`;
      expect(getProxiedPdfUrl(existing, true, 'book.pdf')).toBe(existing);
    });

    it('leaves unsupported schemes and non-allowlisted hosts untouched', () => {
      const ftpUrl = 'ftp://gutenberg.org/book.pdf';
      const externalUrl = 'https://private.example.com/book.pdf';
      expect(getProxiedPdfUrl(ftpUrl, true)).toBe(ftpUrl);
      expect(getProxiedPdfUrl(externalUrl, true)).toBe(externalUrl);
    });

    it('creates a proxy URL with the original URL and optional download metadata', () => {
      const source = 'https://www.gutenberg.org/files/1/book.pdf?token=a%2Fb';
      const result = new URL(getProxiedPdfUrl(source, true, 'A Book.pdf'));

      expect(result.origin + result.pathname).toBe(SUPABASE_PDF_PROXY_URL);
      expect(result.searchParams.get('url')).toBe(source);
      expect(result.searchParams.get('download')).toBe('1');
      expect(result.searchParams.get('filename')).toBe('A Book.pdf');
    });

    it('omits download and filename parameters when download is not requested', () => {
      const result = new URL(getProxiedPdfUrl('https://archive.org/book.pdf'));
      expect(result.searchParams.get('url')).toBe('https://archive.org/book.pdf');
      expect(result.searchParams.has('download')).toBe(false);
      expect(result.searchParams.has('filename')).toBe(false);
    });

    it('falls back to the original value for malformed input', () => {
      const malformed = 'https://[invalid';
      expect(getProxiedPdfUrl(malformed)).toBe(malformed);
    });
  });
});
