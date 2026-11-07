import { describe, expect, it } from 'vitest';
import {
  cleanGoogleBooksData,
  cleanInternetArchiveData,
  constructImageUrl,
  prepareBookForLibrary,
} from './libraryApiHelpers';

describe('constructImageUrl', () => {
  it('returns undefined when image links are absent', () => {
    expect(constructImageUrl(undefined)).toBeUndefined();
    expect(constructImageUrl({})).toBeUndefined();
  });

  it('prefers the highest available image size', () => {
    expect(constructImageUrl({ imageLinks: {
      extraLarge: 'xl', large: 'lg', medium: 'md', thumbnail: 'thumb',
    } })).toBe('xl');
    expect(constructImageUrl({ imageLinks: { large: 'lg', medium: 'md' } })).toBe('lg');
    expect(constructImageUrl({ imageLinks: { medium: 'md', small: 'sm' } })).toBe('md');
    expect(constructImageUrl({ imageLinks: { small: 'sm', thumbnail: 'thumb' } })).toBe('sm');
    expect(constructImageUrl({ imageLinks: { thumbnail: 'thumb', smallThumbnail: 'tiny' } })).toBe('thumb');
    expect(constructImageUrl({ imageLinks: { smallThumbnail: 'tiny' } })).toBe('tiny');
  });
});

describe('cleanGoogleBooksData', () => {
  it('maps provider fields and defaults missing metadata', () => {
    expect(cleanGoogleBooksData({ id: 'g-1', volumeInfo: {
      title: 'Book', authors: ['A', 'B'], industryIdentifiers: [{ identifier: 'ISBN-1' }],
      publishedDate: '2024-05-01', pageCount: 120, language: 'hi',
      categories: ['History'], imageLinks: { thumbnail: 'cover' },
    } })).toEqual({
      id: 'g-1', title: 'Book', author: 'A, B', description: '', imageUrl: 'cover',
      source: 'google_books', isbn: 'ISBN-1', publishedDate: '2024-05-01',
      pageCount: 120, language: 'hi', genre: 'History',
    });
    expect(cleanGoogleBooksData({})).toEqual({
      id: '', title: 'Unknown Title', author: 'Unknown Author', description: '',
      imageUrl: undefined, source: 'google_books', isbn: '', publishedDate: '',
      pageCount: 0, language: 'en', genre: 'General',
    });
  });
});

describe('cleanInternetArchiveData', () => {
  it('joins creators and builds an archive cover URL', () => {
    expect(cleanInternetArchiveData({
      identifier: 'archive-id', title: 'Archive Book', creator: ['One', 'Two'],
      description: 'About', date: '1998', language: ['en', 'fr'], subject: ['Science'],
    })).toEqual({
      id: 'archive-id', title: 'Archive Book', author: 'One, Two', description: 'About',
      imageUrl: 'https://archive.org/services/img/archive-id', source: 'internet_archive',
      publishedDate: '1998', pageCount: 0, language: 'en', genre: 'Science',
    });
  });

  it('handles missing fields and omits cover when identifier is absent', () => {
    expect(cleanInternetArchiveData({})).toEqual({
      id: '', title: 'Unknown Title', author: 'Unknown Author', description: '',
      imageUrl: undefined, source: 'internet_archive', publishedDate: '',
      pageCount: 0, language: 'en', genre: 'General',
    });
  });
});

describe('prepareBookForLibrary', () => {
  it('converts a cleaned book to the API payload and parses its year', () => {
    expect(prepareBookForLibrary({
      id: 'ignored', title: 'Title', author: 'Author', description: 'Description',
      imageUrl: 'cover', source: 'manual', isbn: 'ISBN', publishedDate: '2021-06-01',
      pageCount: 88, language: 'en', genre: 'Fiction',
    })).toEqual({
      title: 'Title', author: 'Author', description: 'Description', cover_image_url: 'cover',
      isbn: 'ISBN', publication_year: 2021, pages: 88, language: 'en', genre: 'Fiction',
      source: 'manual',
    });
  });

  it('leaves publication year undefined when date is absent', () => {
    expect(prepareBookForLibrary({
      id: 'x', title: 'T', author: 'A', source: 'manual',
    })).toMatchObject({ title: 'T', author: 'A', publication_year: undefined });
  });
});
