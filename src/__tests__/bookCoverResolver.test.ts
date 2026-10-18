/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBookLookupKey,
  getOpenLibraryCoverUrl,
  getCachedCover,
  setCachedCover,
  resolveGenuineBookCover,
  fetchGoogleBooksCover,
  clearCoverCache,
} from '@/utils/catalog/bookCoverResolver';

describe('bookCoverResolver', () => {
  beforeEach(() => {
    clearCoverCache();
    vi.restoreAllMocks();
  });

  describe('getBookLookupKey', () => {
    it('uses id if present', () => {
      expect(getBookLookupKey({ id: 'book-123', title: 'Test Book' })).toBe('id_book-123');
    });

    it('uses isbn if valid', () => {
      expect(
        getBookLookupKey({ title: 'The Great Gatsby', isbn: '978-0-7432-7356-5' })
      ).toBe('isbn_9780743273565');
    });

    it('falls back to normalized title and author when id and isbn are missing', () => {
      expect(
        getBookLookupKey({ title: ' The Great Gatsby ', author: 'F. Scott Fitzgerald' })
      ).toBe('meta_the great gatsby_f. scott fitzgerald');
    });
  });

  describe('getOpenLibraryCoverUrl', () => {
    it('constructs valid Open Library CDN URL for valid ISBN-13', () => {
      const url = getOpenLibraryCoverUrl('978-0-7432-7356-5', 'M');
      expect(url).toBe('https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg?default=false');
    });

    it('constructs valid Open Library CDN URL for valid ISBN-10', () => {
      const url = getOpenLibraryCoverUrl('0743273567', 'L');
      expect(url).toBe('https://covers.openlibrary.org/b/isbn/0743273567-L.jpg?default=false');
    });

    it('returns null for invalid or missing ISBN', () => {
      expect(getOpenLibraryCoverUrl(null)).toBeNull();
      expect(getOpenLibraryCoverUrl('')).toBeNull();
      expect(getOpenLibraryCoverUrl('12345')).toBeNull();
    });
  });

  describe('cache operations', () => {
    it('persists resolved cover in localStorage and retrieves it', () => {
      const book = { id: 'sample-book-1', title: '1984', author: 'George Orwell' };
      expect(getCachedCover(book)).toBeUndefined();

      setCachedCover(book, 'https://images.example.com/1984.jpg');
      expect(getCachedCover(book)).toBe('https://images.example.com/1984.jpg');
    });

    it('caches null (negative match) to avoid repeat network lookups', () => {
      const book = { id: 'unknown-book-2', title: 'Nonexistent Book' };
      setCachedCover(book, null);
      expect(getCachedCover(book)).toBeNull();
    });
  });

  describe('fetchGoogleBooksCover', () => {
    it('fetches cover by isbn from Google Books API and enforces https', async () => {
      const fakeResponse = {
        ok: true,
        json: async () => ({
          items: [
            {
              volumeInfo: {
                title: 'The Great Gatsby',
                imageLinks: {
                  thumbnail: 'http://books.google.com/books/content?id=xyz&zoom=1',
                },
              },
            },
          ],
        }),
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(fakeResponse as unknown as Response);

      const cover = await fetchGoogleBooksCover('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565');
      expect(cover).toBe('https://books.google.com/books/content?id=xyz&zoom=1');
    });

    it('rejects false-positive title mismatches', async () => {
      const fakeResponse = {
        ok: true,
        json: async () => ({
          items: [
            {
              volumeInfo: {
                title: 'Completely Unrelated Novel',
                imageLinks: {
                  thumbnail: 'https://books.google.com/books/content?id=abc',
                },
              },
            },
          ],
        }),
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(fakeResponse as unknown as Response);

      const cover = await fetchGoogleBooksCover('The Great Gatsby', 'F. Scott Fitzgerald', null);
      expect(cover).toBeNull();
    });
  });

  describe('resolveGenuineBookCover', () => {
    it('returns existing valid cover without network calls', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const cover = await resolveGenuineBookCover({
        id: 'book-exist',
        title: 'Existing Cover',
        cover_image_url: 'https://cdn.example.com/cover.png',
      });
      expect(cover).toBe('https://cdn.example.com/cover.png');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('resolves valid ISBN directly via Open Library without external search call', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const cover = await resolveGenuineBookCover({
        id: 'book-isbn',
        title: 'Pride and Prejudice',
        isbn: '9780141439518',
      });
      expect(cover).toBe('https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg?default=false');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('resolves covers via Open Library search for books without ISBN', async () => {
      const fakeResponse = {
        ok: true,
        json: async () => ({
          docs: [
            {
              title: '1984',
              author_name: ['George Orwell'],
              cover_i: 8745958,
            },
          ],
        }),
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(fakeResponse as unknown as Response);

      const cover = await resolveGenuineBookCover({
        id: 'book-no-isbn',
        title: '1984',
        author: 'George Orwell',
      });
      expect(cover).toBe('https://covers.openlibrary.org/b/id/8745958-L.jpg');
    });
  });
});


