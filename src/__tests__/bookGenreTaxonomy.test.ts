import { describe, expect, it } from 'vitest';
import { normalizeBookGenre, normalizeBookGenres } from '@/utils/catalog/bookGenreTaxonomy';

describe('Library book genre taxonomy', () => {
  it.each([
    ['Sci-Fi', 'Science Fiction'],
    ['detective fiction', 'Mystery & Thriller'],
    ['Biography', 'Biography & Memoir'],
    ['non fiction', 'Non-Fiction'],
    ['Computer Science', 'Other'],
    ['Fiction / Fantasy', 'Fantasy'],
    ['Literary Fiction', 'Literary Fiction'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeBookGenre(input)).toBe(expected);
  });

  it('normalizes provider subject arrays into unique categories', () => {
    expect(normalizeBookGenres(['Fantasy', 'fantasy', 'Science Fiction', 'Unknown subject']))
      .toEqual(['Fantasy', 'Science Fiction']);
  });

  it('does not invent a category for missing metadata', () => {
    expect(normalizeBookGenre(null)).toBe('Other');
    expect(normalizeBookGenre('')).toBe('Other');
  });
});
