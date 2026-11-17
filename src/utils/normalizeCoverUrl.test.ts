import { describe, expect, it } from 'vitest';
import { normalizeCoverUrl } from './normalizeCoverUrl';

describe('normalizeCoverUrl', () => {
  it('normalizes empty and placeholder values to null', () => {
    expect(normalizeCoverUrl()).toBeNull();
    expect(normalizeCoverUrl(null)).toBeNull();
    expect(normalizeCoverUrl('')).toBeNull();
    expect(normalizeCoverUrl('   ')).toBeNull();
    expect(normalizeCoverUrl('null')).toBeNull();
    expect(normalizeCoverUrl('undefined')).toBeNull();
  });

  it('trims valid URLs without changing their content', () => {
    expect(normalizeCoverUrl('/storage/v1/object/public/covers/local-cover.jpg')).toBe('/storage/v1/object/public/covers/local-cover.jpg');
    expect(normalizeCoverUrl('  https://example.com/cover.jpg  ')).toBe('https://example.com/cover.jpg');
  });
  it('rejects known placeholder and unusable provider thumbnail URLs', () => {
    expect(normalizeCoverUrl('https://archive.org/services/img/problemsofphilos00russuoft')).toBeNull();
    expect(normalizeCoverUrl('https://archive.org/services/img/originofspecies00darwuoft')).toBeNull();
    expect(normalizeCoverUrl('https://books.google.com/books/content?id=ryQBzwEACAAJ&printsec=frontcover&img=1')).toBeNull();
    expect(normalizeCoverUrl('https://cdn.example.com/image-not-available.jpg')).toBeNull();
    expect(normalizeCoverUrl('javascript:alert(1)')).toBeNull();
  });

  it('keeps genuine remote cover URLs', () => {
    expect(normalizeCoverUrl('https://covers.openlibrary.org/b/id/12345-L.jpg')).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
    expect(normalizeCoverUrl('https://pressbooks.example.edu/book-cover.jpg')).toBe('https://pressbooks.example.edu/book-cover.jpg');
  });
});
