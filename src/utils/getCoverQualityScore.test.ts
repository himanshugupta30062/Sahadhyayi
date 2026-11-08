import { describe, expect, it } from 'vitest';
import { getCoverQualityScore } from './getCoverQualityScore';

describe('getCoverQualityScore', () => {
  it('returns zero for missing covers', () => {
    expect(getCoverQualityScore()).toBe(0);
    expect(getCoverQualityScore(null)).toBe(0);
    expect(getCoverQualityScore('')).toBe(0);
  });

  it('ranks known cover sources above generic URLs', () => {
    expect(getCoverQualityScore('https://storage.supabase.co/book.jpg')).toBe(500);
    expect(getCoverQualityScore('https://covers.openlibrary.org/b/id/123-L.jpg')).toBe(400);
    expect(getCoverQualityScore('https://covers.openlibrary.org/b/id/123-M.jpg')).toBe(250);
    expect(getCoverQualityScore('https://books.google.com/books/content?id=abc')).toBe(200);
    expect(getCoverQualityScore('https://example.com/cover.jpg')).toBe(100);
  });
});
