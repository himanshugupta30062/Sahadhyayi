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

  it('corrects religious and spiritual scriptures erroneously marked as Fiction', () => {
    expect(normalizeBookGenre('Fiction', 'Shri Durga Saptashati')).toBe('Spiritual');
    expect(normalizeBookGenre('Fiction', 'Shree Durga Saptashati')).toBe('Spiritual');
    expect(normalizeBookGenre('Fiction', 'Sri Sri Chandi (Durga Saptashati)')).toBe('Spiritual');
    expect(normalizeBookGenre('Fiction', 'The Bhagavad Gita')).toBe('Spiritual');
    expect(normalizeBookGenre('Fiction', 'Ramayana')).toBe('Spiritual');
    expect(normalizeBookGenre(null, 'Shrimad Bhagwat Geeta')).toBe('Spiritual');
  });

  it('normalizes religion and hinduism tags to Spiritual', () => {
    expect(normalizeBookGenre('Religion')).toBe('Spiritual');
    expect(normalizeBookGenre('Hinduism')).toBe('Spiritual');
    expect(normalizeBookGenre('Vedas')).toBe('Spiritual');
    expect(normalizeBookGenre('Bhagavadgītā')).toBe('Spiritual');
    expect(normalizeBookGenre('Sandhyā (Hindu rite)')).toBe('Spiritual');
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
