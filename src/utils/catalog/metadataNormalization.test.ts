import { describe, expect, it } from 'vitest';
import { normalizeTitle, normalizeAuthor, normalizeIsbn, validateISBN, createCanonicalClusterKey } from './metadataNormalization';

describe('book metadata normalization', () => {
  it('handles empty titles and extracts subtitles and edition markers', () => {
    expect(normalizeTitle('')).toEqual({ cleanTitle: 'Untitled' });
    expect(normalizeTitle('  The Arthashastra: Illustrated (Vintage Classics)  ')).toEqual({
      cleanTitle: 'The Arthashastra', subtitle: 'Illustrated', editionTag: 'Vintage Classics',
    });
    expect(normalizeTitle('महाभारत खण्ड २')).toMatchObject({ cleanTitle: 'महाभारत' });
  });

  it('removes volume labels and trailing punctuation while preserving Unicode', () => {
    expect(normalizeTitle('War and Peace Vol. 2!!!').cleanTitle).toBe('War and Peace Vol. 2!!!');
    expect(normalizeTitle('The Odyssey — A Journey').subtitle).toBe('A Journey');
    expect(normalizeTitle('தமிழ் நூல் [Annotated]').editionTag).toBe('Annotated');
  });

  it('normalizes authors, honorifics, dates and co-authors', () => {
    expect(normalizeAuthor('Dostoevsky, Fyodor').normalizedAuthor).toBe('Fyodor Dostoevsky');
    expect(normalizeAuthor('Dr. A. P. J. Abdul Kalam').normalizedAuthor).toBe('A. P. J. Abdul Kalam');
    expect(normalizeAuthor('Stephen Hawking, Leonard Mlodinow').normalizedAuthor).toBe('Stephen Hawking');
    expect(normalizeAuthor('Kautilya; Translator').normalizedAuthor).toBe('Kautilya');
    expect(normalizeAuthor('Rabindranath Tagore (1861-1941)').normalizedAuthor).toBe('Rabindranath Tagore');
    expect(normalizeAuthor(null)).toMatchObject({ normalizedAuthor: 'Unknown Author' });
  });

  it('validates ISBN-10 and ISBN-13 including X check digit', () => {
    expect(normalizeIsbn('0-306-40615-2')).toMatchObject({ isbn10: '0306406152', isValid: true });
    expect(normalizeIsbn('0-8044-2957-X')).toMatchObject({ isbn10: '080442957X', isValid: true });
    expect(normalizeIsbn('978-0-306-40615-7')).toMatchObject({ isbn13: '9780306406157', isValid: true });
    expect(normalizeIsbn('9780306406158')).toEqual({ isValid: false });
    expect(normalizeIsbn(null)).toEqual({ isValid: false });
    expect(validateISBN('0306406152')).toBe(true);
    expect(validateISBN('invalid')).toBe(false);
  });

  it('creates stable keys across cosmetic punctuation and author formatting', () => {
    expect(createCanonicalClusterKey('The Arthashastra: A Guide', 'Kautilya'))
      .toBe(createCanonicalClusterKey('The Arthashastra — A Guide', 'Kautilya'));
    expect(createCanonicalClusterKey('महाभारत', null)).toContain('महाभारत::unknown author');
  });
});
