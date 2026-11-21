import { describe, expect, it } from 'vitest';
import { buildAdaptationSeoMetadata } from './adaptationSeo';

describe('buildAdaptationSeoMetadata', () => {
  it('creates canonical metadata and linked Book/Movie structured data', () => {
    const result = buildAdaptationSeoMetadata({
      id: 'adaptation-123', bookTitle: 'The Godfather', bookAuthor: 'Mario Puzo',
      bookPublicationYear: 1969, bookCoverUrl: 'https://cdn.example.com/book.jpg',
      bookLibraryId: 'book-456', movieTitle: 'The Godfather', movieReleaseYear: 1972,
      moviePosterUrl: 'https://cdn.example.com/movie.jpg',
    });
    expect(result.canonical).toBe('https://sahadhyayi.com/from-page-to-screen/adaptation-123');
    expect(result.image).toBe('https://cdn.example.com/book.jpg');
    const movie = result.schema.mainEntity as any;
    expect(result.schema).toMatchObject({ '@type': 'WebPage', url: result.canonical });
    expect(movie).toMatchObject({ '@type': 'Movie', name: 'The Godfather', datePublished: '1972' });
    expect(movie.isBasedOn).toMatchObject({ '@type': 'Book', name: 'The Godfather', author: { name: 'Mario Puzo' }, datePublished: '1969' });
    expect(result.breadcrumbs).toHaveLength(3);
  });
  it('uses a useful fallback description and omits unverified image/year fields', () => {
    const result = buildAdaptationSeoMetadata({ id: 'x', bookTitle: 'Book', movieTitle: 'Film' });
    expect(result.description).toContain('Compare Book with its screen adaptation Film');
    expect(result.image).toBeUndefined();
    const movie = result.schema.mainEntity as any;
    expect(movie.isBasedOn).not.toHaveProperty('datePublished');
    expect(movie.isBasedOn).not.toHaveProperty('image');
    expect(movie).not.toHaveProperty('datePublished');
  });
  it('strips markup from descriptions and ignores non-http image URLs', () => {
    const result = buildAdaptationSeoMetadata({
      id: 'x', bookTitle: 'Book', movieTitle: 'Film',
      bookSynopsis: '<p>A <strong>clear</strong> synopsis.</p>',
      bookCoverUrl: 'javascript:alert(1)', moviePosterUrl: 'data:image/png;base64,abc',
    });
    expect(result.description).toBe('A clear synopsis.');
    expect(result.image).toBeUndefined();
  });
});
