import { describe, expect, it } from 'vitest';
import { normalizeBookIdentity } from './bookIdentity';

describe('normalizeBookIdentity', () => {
  it('returns safe defaults for a missing record', () => {
    expect(normalizeBookIdentity(null)).toMatchObject({
      cleanTitle: 'Untitled',
      normalizedTitleKey: 'untitled',
      cleanAuthors: ['Unknown Author'],
      primaryAuthor: 'Unknown Author',
      normalizedAuthorKey: 'unknownauthor',
      isbns: [],
      language: 'en',
      isOriginalScript: false,
      raw: null,
    });
  });

  it('normalizes title, multiple authors, ISBNs and Hindi language', () => {
    const result = normalizeBookIdentity({
      id: 'book-1',
      title: 'गोदान Volume 2',
      author: 'Munshi Premchand & Translator Name',
      isbn: '9780140449136, 9780140449136 invalid-isbn',
      language: 'Hindi',
      publication_year: '1936',
      publisher: '  Example Press  ',
      pdf_url: 'https://www.gutenberg.org/ebooks/12345',
    });

    expect(result.normalizedTitleKey).toContain('गोदान');
    expect(result.normalizedTitleKey).not.toContain('volume2');
    expect(result.cleanTitle).toBe('गोदान');
    expect(result.volumeTag).toBe('vol-2');
    expect(result.cleanAuthors).toEqual(['Munshi Premchand', 'Translator Name']);
    expect(result.language).toBe('hi');
    expect(result.isOriginalScript).toBe(true);
    expect(result.isbns).toEqual(['9780140449136']);
    expect(result.publicationYear).toBe(1936);
    expect(result.publisher).toBe('Example Press');
    expect(result.stableProviderId).toBe('gutenberg-12345');
    expect(result.sourceUrl).toBe('https://www.gutenberg.org/ebooks/12345');
  });

  it('recognizes supported language aliases and script preservation', () => {
    const cases = [
      ['sa', 'sa'],
      ['fr', 'fr'],
      ['German', 'de'],
      ['es', 'es'],
      ['ta', 'ta'],
      ['bn', 'bn'],
    ] as const;

    for (const [language, expected] of cases) {
      expect(normalizeBookIdentity({ title: 'A book', language }).language).toBe(expected);
    }

    expect(normalizeBookIdentity({ title: 'தமிழ் நூல்', author: 'Author' }).isOriginalScript).toBe(true);
  });

  it('rejects invalid publication years and extracts archive provider IDs', () => {
    expect(normalizeBookIdentity({
      title: 'A book',
      publication_year: '400',
      source_url: 'https://archive.org/download/example-item/file.pdf',
    })).toMatchObject({
      publicationYear: undefined,
      stableProviderId: 'archive-example-item',
    });
  });

  it('extracts Standard Ebooks IDs and uses fallback author/title values', () => {
    expect(normalizeBookIdentity({
      title: 'A book',
      author: ' ',
      source_url: 'https://standardebooks.org/ebooks/example-author/example-book',
    })).toMatchObject({
      cleanAuthors: ['Unknown Author'],
      primaryAuthor: 'Unknown Author',
      stableProviderId: 'standardebooks-example-author',
    });
  });
  it('preserves Devanagari vowel signs in both NFC and decomposed titles', () => {
    const canonicalTitle = 'गोदान';
    const decomposedTitle = canonicalTitle.normalize('NFD');

    for (const title of [canonicalTitle, decomposedTitle]) {
      const result = normalizeBookIdentity({ title, author: 'मुंशी प्रेमचंद', language: 'Hindi' });

      expect(result.cleanTitle).toBe(canonicalTitle);
      expect(result.normalizedTitleKey).toBe(canonicalTitle.replace(/[^\p{L}\p{N}\p{M}]/gu, ''));
      expect(result.isOriginalScript).toBe(true);
    }
  });

});
