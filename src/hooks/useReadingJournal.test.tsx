// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  notes: [] as any[],
  highlights: [] as any[],
  quotes: [] as any[],
  progress: [] as any[],
  notesLoading: false,
  highlightsLoading: false,
  progressLoading: false,
  localProgress: {} as Record<string, any>,
  loadLocal: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: () => ({ data: mocks.notes, isLoading: mocks.notesLoading }),
}));
vi.mock('@/hooks/useReaderHighlights', () => ({
  useReaderHighlights: () => ({ data: mocks.highlights, isLoading: mocks.highlightsLoading }),
}));
vi.mock('@/contexts/quotesHelpers', () => ({
  useQuotes: () => ({ quotes: mocks.quotes }),
}));
vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({ data: mocks.progress, isLoading: mocks.progressLoading }),
}));
vi.mock('@/utils/readingProgressStorage', () => ({
  loadProgressLocally: (...args: unknown[]) => mocks.loadLocal(...args),
}));

import { useReadingJournal } from './useReadingJournal';

describe('useReadingJournal', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.notes = [];
    mocks.highlights = [];
    mocks.quotes = [];
    mocks.progress = [];
    mocks.notesLoading = false;
    mocks.highlightsLoading = false;
    mocks.progressLoading = false;
    mocks.localProgress = {};
    mocks.loadLocal.mockReset().mockImplementation((bookId: string) => mocks.localProgress[bookId] ?? null);
  });

  afterEach(() => cleanup());

  it('combines private reflections, highlights, and saved quotes into page/date order', () => {
    mocks.notes = [
      { id: 'private', user_id: 'reader-1', visibility: 'private', book_id: 'book-1', page: 3, quote: 'A passage', note: 'My thought', created_at: '2026-01-01T00:00:00Z', books_library: { title: 'Book One' } },
      { id: 'public', user_id: 'reader-1', visibility: 'public', book_id: 'book-1', page: 1, quote: 'Public', created_at: '2026-01-03T00:00:00Z' },
      { id: 'other-reader', user_id: 'reader-2', visibility: 'private', book_id: 'book-1', page: 1, quote: 'Other', created_at: '2026-01-04T00:00:00Z' },
    ];
    mocks.highlights = [
      { id: 'highlight', book_id: 'book-1', page: 3, location: 'Chapter 1', text: 'Highlighted text', color: 'yellow', created_at: '2026-01-02T00:00:00Z' },
    ];
    mocks.quotes = [
      { id: 'quote', bookId: 'book-1', source: 'Book One', page: 3, text: 'Saved quote', createdAt: '2026-01-03T00:00:00Z' },
    ];

    const { result } = renderHook(() => useReadingJournal());

    expect(result.current.entries.map(entry => entry.id)).toEqual(['hl-highlight', 'quote-quote', 'note-private']);
    expect(result.current.entries[2]).toMatchObject({ type: 'reflection', bookTitle: 'Book One', page: 3, note: 'My thought' });
    expect(result.current.entries[0]).toMatchObject({ type: 'highlight', location: 'Chapter 1', color: 'yellow' });
  });

  it('filters reflections by the authenticated reader and selected book', () => {
    mocks.notes = [
      { id: 'match', user_id: 'reader-1', visibility: 'private', book_id: 'book-1', quote: 'Mine', created_at: '2026-01-01' },
      { id: 'wrong-book', user_id: 'reader-1', visibility: 'private', book_id: 'book-2', quote: 'Other book', created_at: '2026-01-01' },
      { id: 'wrong-user', user_id: 'reader-2', visibility: 'private', book_id: 'book-1', quote: 'Other user', created_at: '2026-01-01' },
    ];
    const { result } = renderHook(() => useReadingJournal('book-1'));
    expect(result.current.entries.map(entry => entry.id)).toEqual(['note-match']);
  });

  it('includes general and legacy quotes and supplies a stable fallback timestamp', () => {
    mocks.quotes = [
      { id: 'general', text: 'General quote', source: 'Notebook' },
      { id: 'legacy', bookId: 'book-1', text: 'Legacy quote', page: 4 },
    ];
    const { result } = renderHook(() => useReadingJournal('book-1'));
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0]).toMatchObject({ id: 'quote-general', bookId: 'book-1', page: 1, createdAt: new Date(0).toISOString() });
    expect(result.current.entries[1]).toMatchObject({ id: 'quote-legacy', page: 4 });
  });

  it('keeps general quotes when a book filter is active but excludes quotes for other books', () => {
    mocks.quotes = [
      { id: 'general', text: 'General' },
      { id: 'same', bookId: 'book-1', text: 'Same book' },
      { id: 'other', bookId: 'book-2', text: 'Other book' },
    ];
    const { result } = renderHook(() => useReadingJournal('book-1'));
    expect(result.current.entries.map(entry => entry.id)).toEqual(['quote-general', 'quote-same']);
  });

  it('builds summaries from database progress and merges larger local progress values', () => {
    mocks.progress = [
      { book_id: 'book-1', book_title: 'Book One', current_page: 20, total_pages: 100 },
      { book_id: 'book-2', book_title: null, current_page: 5, total_pages: 0 },
      { book_id: null, book_title: 'No ID', current_page: 1, total_pages: 1 },
    ];
    mocks.localProgress = { 'book-1': { currentPage: 40, totalPages: 120 } };
    const { result } = renderHook(() => useReadingJournal());

    expect(result.current.bookSummaries).toEqual([
      expect.objectContaining({ bookId: 'book-1', bookTitle: 'Book One', currentPage: 40, totalPages: 120, progressPercent: 33 }),
      expect.objectContaining({ bookId: 'book-2', bookTitle: 'Untitled Book', currentPage: 5, totalPages: 1, progressPercent: 100 }),
    ]);
    expect(mocks.loadLocal).toHaveBeenCalledWith('book-1', 'reader-1');
  });

  it('creates summaries for books represented only by journal entries and counts entry types', () => {
    mocks.notes = [
      { id: 'n1', user_id: 'reader-1', visibility: 'private', book_id: 'book-1', page: 7, quote: 'Passage', created_at: '2026-01-01' },
      { id: 'n2', user_id: 'reader-1', visibility: 'private', book_id: 'book-1', page: 8, quote: 'Passage 2', created_at: '2026-01-02' },
    ];
    mocks.highlights = [{ id: 'h1', book_id: 'book-1', page: 9, text: 'Highlight', created_at: '2026-01-03' }];
    mocks.quotes = [{ id: 'q1', bookId: 'book-1', text: 'Quote' }];
    const { result } = renderHook(() => useReadingJournal());

    expect(result.current.bookSummaries).toEqual([
      expect.objectContaining({
        bookId: 'book-1', bookTitle: 'Book Notes', currentPage: 7, totalPages: 1,
        reflectionCount: 2, highlightCount: 1, quoteCount: 1, totalEntriesCount: 4,
      }),
    ]);
  });

  it('sorts book summaries by total journal entries', () => {
    mocks.notes = [
      { id: 'a', user_id: 'reader-1', visibility: 'private', book_id: 'book-a', quote: 'A', created_at: '2026-01-01' },
      { id: 'b1', user_id: 'reader-1', visibility: 'private', book_id: 'book-b', quote: 'B1', created_at: '2026-01-01' },
      { id: 'b2', user_id: 'reader-1', visibility: 'private', book_id: 'book-b', quote: 'B2', created_at: '2026-01-02' },
    ];
    const { result } = renderHook(() => useReadingJournal());
    expect(result.current.bookSummaries.map(summary => summary.bookId)).toEqual(['book-b', 'book-a']);
  });

  it('combines loading states from notes, highlights, and progress', () => {
    mocks.notesLoading = true;
    mocks.highlightsLoading = false;
    mocks.progressLoading = false;
    const { result, rerender } = renderHook(() => useReadingJournal());
    expect(result.current.isLoading).toBe(true);

    mocks.notesLoading = false;
    mocks.highlightsLoading = true;
    rerender();
    expect(result.current.isLoading).toBe(true);

    mocks.highlightsLoading = false;
    mocks.progressLoading = true;
    rerender();
    expect(result.current.isLoading).toBe(true);
  });

  it('handles a signed-out reader without exposing private notes', () => {
    mocks.user = null;
    mocks.notes = [
      { id: 'private', user_id: 'reader-1', visibility: 'private', book_id: 'book-1', quote: 'Private', created_at: '2026-01-01' },
    ];
    const { result } = renderHook(() => useReadingJournal());
    expect(result.current.entries).toEqual([]);
    expect(result.current.bookSummaries).toEqual([]);
  });
});
