import { describe, expect, it, vi } from 'vitest';
import { makeAbortable } from '@/lib/fetchAbort';
import { withAsync } from '@/lib/withAsync';
import { genreOverlap, cosineSimilarity, matchScore, getCrossRecommendations, type ReadingDna } from '@/lib/readingDna';
import { getCoverQualityScore } from '@/utils/getCoverQualityScore';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';
import { redirectToUserHome } from '@/utils/navigation';

const reportCustomError = vi.hoisted(() => vi.fn());
vi.mock('@/utils/errorHandler', () => ({
  errorHandler: { reportCustomError },
}));

const dna = (overrides: Partial<ReadingDna> = {}): ReadingDna => ({
  user_id: 'reader',
  genres: [{ name: 'Fantasy', weight: 4 }, { name: 'History', weight: 2 }],
  moods: ['curious', 'hopeful'],
  pace: 'steady',
  themes: ['friendship', 'courage'],
  summary: null,
  signature_color: null,
  generated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('core utility coverage', () => {
  it('aborts the previous operation when a new abortable run starts', async () => {
    const signals: AbortSignal[] = [];
    const operation = makeAbortable(async (signal) => {
      signals.push(signal);
      return signals.length;
    });

    await expect(operation.run()).resolves.toBe(1);
    await expect(operation.run()).resolves.toBe(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    operation.abort();
    expect(signals[1].aborted).toBe(true);
  });

  it('returns successful async results without reporting an error', async () => {
    await expect(withAsync(async () => 'saved', { action: 'save' })).resolves.toBe('saved');
    expect(reportCustomError).not.toHaveBeenCalled();
  });

  it('normalizes thrown values and reports context before rethrowing', async () => {
    const original = new Error('request failed');
    await expect(withAsync(async () => { throw original; }, { action: 'load-book' }))
      .rejects.toMatchObject({ name: 'AppError', message: 'request failed', severity: 'high' });
    expect(reportCustomError).toHaveBeenCalledWith(
      'request failed',
      { action: 'load-book' },
      'high',
    );
  });

  it('computes case-insensitive weighted genre overlap and handles empty vectors', () => {
    expect(genreOverlap(dna(), dna({ genres: [{ name: ' fantasy ', weight: 2 }] }))).toBeCloseTo(1 / 3);
    expect(genreOverlap(dna({ genres: [] }), dna({ genres: [] }))).toBe(0);
    expect(cosineSimilarity([], ['hopeful'])).toBe(0);
    expect(cosineSimilarity([' Hopeful ', 'curious'], ['curious', 'hopeful'])).toBe(1);
    expect(cosineSimilarity(['curious'], ['hopeful'])).toBe(0);
  });

  it('scores reading-DNA matches and safely handles missing profiles', () => {
    expect(matchScore(null, dna())).toBe(0);
    expect(matchScore(dna(), dna())).toBe(100);
    expect(matchScore(dna({ pace: null }), dna({ pace: 'fast' }))).toBeLessThan(100);
  });

  it('recommends only books absent from the reader shelf and ranks by genre and rating', () => {
    const own = [{ book_id: 'own', books_library: { id: 'own', title: 'Already read', author: null, cover_image_url: null, genre: 'Fantasy' } }];
    const friend = [
      { book_id: 'own', rating: 5, books_library: { id: 'own', title: 'Already read', author: null, cover_image_url: null, genre: 'Fantasy' } },
      { book_id: 'history', rating: 2, books_library: { id: 'history', title: 'History book', author: null, cover_image_url: null, genre: 'History' } },
      { book_id: 'fantasy', rating: 5, books_library: { id: 'fantasy', title: 'Fantasy book', author: null, cover_image_url: null, genre: 'Fantasy' } },
      { book_id: 'missing-title', books_library: { id: 'missing-title', title: '', author: null, cover_image_url: null, genre: 'Fantasy' } },
    ];
    const result = getCrossRecommendations(own, friend, dna(), 5);
    expect(result.map((book) => book.book_id)).toEqual(['fantasy', 'history']);
    expect(getCrossRecommendations(own, friend, null, 1).map((book) => book.book_id)).toEqual(['history']);
  });

  it('ranks cover sources without network calls and normalizes empty URLs', () => {
    expect(getCoverQualityScore()).toBe(0);
    expect(getCoverQualityScore('https://cdn.example.com/cover.jpg')).toBe(100);
    expect(getCoverQualityScore('https://books.google.com/books/content?id=abc')).toBe(200);
    expect(getCoverQualityScore('https://covers.openlibrary.org/b/id/1-M.jpg')).toBe(250);
    expect(getCoverQualityScore('https://covers.openlibrary.org/b/id/1-L.jpg')).toBe(400);
    expect(getCoverQualityScore('https://project.supabase.co/storage/cover.jpg')).toBe(500);
    expect(normalizeCoverUrl()).toBeNull();
    expect(normalizeCoverUrl('  ')).toBeNull();
    expect(normalizeCoverUrl('null')).toBeNull();
    expect(normalizeCoverUrl('undefined')).toBeNull();
    expect(normalizeCoverUrl('  https://example.com/book.pdf  ')).toBe('https://example.com/book.pdf');
  });

  it('redirects signed-in users to their dashboard with history replacement', () => {
    const navigate = vi.fn();
    redirectToUserHome(navigate as never);
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
