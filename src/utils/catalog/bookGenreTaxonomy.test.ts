import { describe, it, expect } from 'vitest';
import { normalizeBookGenre, normalizeBookGenres, BOOK_GENRE_TAXONOMY } from './bookGenreTaxonomy';

describe('bookGenreTaxonomy', () => {
  it('normalizes single genres and aliases', () => {
    expect(normalizeBookGenre('novel')).toBe('Fiction');
    expect(normalizeBookGenre('sci-fi')).toBe('Science Fiction');
    expect(normalizeBookGenre('mystery')).toBe('Mystery & Thriller');
    expect(normalizeBookGenre('biography')).toBe('Biography & Memoir');
    expect(normalizeBookGenre('Mathematics')).toBe('Science');
    expect(normalizeBookGenre('unknown genre 123')).toBe('Other');
    expect(normalizeBookGenre(null)).toBe('Other');
  });

  it('normalizes hierarchical slash-separated genres by checking specific leaf first', () => {
    expect(normalizeBookGenre('Fiction / Fantasy / Epic')).toBe('Fantasy');
    expect(normalizeBookGenre('Non-Fiction / History')).toBe('History');
  });

  it('normalizes arrays and delimited lists into deduplicated sets', () => {
    const list = normalizeBookGenres(['novels', 'sci fi', 'novels', 'biography']);
    expect(list).toEqual(['Fiction', 'Science Fiction', 'Biography & Memoir']);

    const stringInput = normalizeBookGenres('novel; science fiction; history');
    expect(stringInput).toEqual(['Fiction', 'Science Fiction', 'History']);
  });

  it('filters out Other genres from array normalization', () => {
    const list = normalizeBookGenres(['gibberish', 'fiction']);
    expect(list).toEqual(['Fiction']);
  });
});

