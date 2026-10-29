// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, act, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  queryOptions: null as any,
  books: [] as any[],
  queryResponses: [] as any[],
  refetch: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  or: vi.fn(),
  eq: vi.fn(),
  detectCaps: vi.fn(),
  selectColumns: vi.fn(),
  applyFilter: vi.fn((query: any) => query),
  filterBooks: vi.fn((rows: any[]) => rows.filter((row) => row.catalog_status !== 'archived')),
  mapEdition: vi.fn((row: any) => ({
    title: row.title, author: row.author, genre: row.genre, coverImageUrl: row.cover_image_url,
    description: row.description, publicationYear: row.publication_year, language: row.language,
    assets: [], qualityScore: 10, qualityReasons: [], whyThisEdition: 'mapped',
    accessStatus: 'public_domain', licenseEvidence: 'public_domain',
  })),
  compare: vi.fn((a: any, b: any) => a.title.localeCompare(b.title)),
  diversify: vi.fn((books: any[]) => books),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    mocks.queryOptions = options;
    return { data: mocks.books, isLoading: false, isError: false, error: null, refetch: mocks.refetch };
  },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (table: string) => {
      mocks.from(table);
      const query: any = {
        select: (...args: unknown[]) => { mocks.select(...args); return query; },
        order: (...args: unknown[]) => { mocks.order(...args); return query; },
        range: (...args: unknown[]) => { mocks.range(...args); return query; },
        or: (...args: unknown[]) => { mocks.or(...args); return query; },
        eq: (...args: unknown[]) => { mocks.eq(...args); return query; },
        then: (resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) => {
          const next = mocks.queryResponses.shift() || { data: [], error: null };
          return Promise.resolve(next).then(resolve, reject);
        },
      };
      return query;
    },
  },
}));

vi.mock('@/hooks/useLibraryBooks', () => ({
  getBookCompletenessScore: () => 1,
  compareLibraryBooks: (...args: any[]) => mocks.compare(...args),
  diversifyBooksPerPage: (...args: any[]) => mocks.diversify(...args),
}));

vi.mock('@/utils/catalog/deduplicationEngine', () => ({
  mapRawToEdition: (row: any) => mocks.mapEdition(row),
}));

vi.mock('@/utils/catalog/bookVisibility', () => ({
  BASE_BOOK_SELECT_COLUMNS: 'base columns',
  detectBookSchemaCapabilities: (...args: unknown[]) => mocks.detectCaps(...args),
  getPublicBookSelectColumns: (...args: unknown[]) => mocks.selectColumns(...args),
  applyPublicBookFilter: (query: any, ...args: unknown[]) => mocks.applyFilter(query, ...args),
  filterPublicBooks: (rows: any[]) => mocks.filterBooks(rows),
}));

import { usePaginatedLibraryBooks } from '@/hooks/usePaginatedLibraryBooks';

const rawBook = (id: number, overrides: Record<string, unknown> = {}) => ({
  id: 'book-' + id,
  title: 'Book ' + String(id).padStart(3, '0'),
  author: 'Author ' + id,
  genre: 'Fiction',
  cover_image_url: null,
  description: 'Description',
  publication_year: 2020,
  language: 'English',
  created_at: '2026-01-01T00:00:00Z',
  catalog_status: 'active',
  ...overrides,
});

const viewBook = (id: number) => ({ ...rawBook(id), id: 'book-' + id });

describe('usePaginatedLibraryBooks', () => {
  beforeEach(() => {
    mocks.queryOptions = null;
    mocks.books = Array.from({ length: 15 }, (_, i) => viewBook(i + 1));
    mocks.queryResponses = [];
    for (const fn of [mocks.refetch, mocks.from, mocks.select, mocks.order, mocks.range, mocks.or, mocks.eq, mocks.detectCaps, mocks.selectColumns, mocks.applyFilter, mocks.filterBooks, mocks.mapEdition, mocks.compare, mocks.diversify]) fn.mockClear();
    mocks.detectCaps.mockResolvedValue({ hasStatus: true, hasCatalogStatus: true, checked: true });
    mocks.selectColumns.mockReturnValue('public columns');
    mocks.applyFilter.mockImplementation((query: any) => query);
    mocks.filterBooks.mockImplementation((rows: any[]) => rows.filter((row) => row.catalog_status !== 'archived'));
    mocks.mapEdition.mockImplementation((row: any) => ({
      title: row.title, author: row.author, genre: row.genre, coverImageUrl: row.cover_image_url,
      description: row.description, publicationYear: row.publication_year, language: row.language,
      assets: [], qualityScore: 10, qualityReasons: [], whyThisEdition: 'mapped',
      accessStatus: 'public_domain', licenseEvidence: 'public_domain',
    }));
    mocks.compare.mockImplementation((a: any, b: any) => a.title.localeCompare(b.title));
    mocks.diversify.mockImplementation((books: any[]) => books);
  });

  afterEach(() => cleanup());

  it('paginates cached books without refetching when changing pages', () => {
    const { result } = renderHook(() => usePaginatedLibraryBooks());
    expect(result.current.data?.books).toHaveLength(12);
    expect(result.current.data?.hasNextPage).toBe(true);
    act(() => result.current.goToNextPage());
    expect(result.current.page).toBe(2);
    expect(result.current.data?.books).toHaveLength(3);
    expect(result.current.data?.hasPrevPage).toBe(true);
    act(() => result.current.goToPrevPage());
    expect(result.current.page).toBe(1);
    act(() => result.current.changePageSize(5));
    expect(result.current.pageSize).toBe(5);
    expect(result.current.data?.books).toHaveLength(5);
    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it('runs filtered catalog fetches in batches and sanitizes search input', async () => {
    mocks.queryResponses = [{ data: [rawBook(1), rawBook(2)], error: null }];
    renderHook(() => usePaginatedLibraryBooks({
      searchQuery: '  fantasy,(classic)  ',
      selectedGenre: 'Hindi',
      selectedAuthor: 'Premchand',
      selectedYear: '1925',
      selectedLanguage: 'Hindi',
    }));
    const books = await mocks.queryOptions.queryFn();
    expect(books).toHaveLength(2);
    expect(mocks.or).toHaveBeenCalledWith('title.ilike.%fantasy classic%,author.ilike.%fantasy classic%,genre.ilike.%fantasy classic%');
    expect(mocks.eq).toHaveBeenCalledWith('language', 'Hindi');
    expect(mocks.eq).toHaveBeenCalledWith('author', 'Premchand');
    expect(mocks.eq).toHaveBeenCalledWith('publication_year', 1925);
    expect(mocks.selectColumns).toHaveBeenCalled();
  });

  it('falls back to base columns if schema capability columns are unavailable', async () => {
    mocks.queryResponses = [
      { data: null, error: { message: 'column catalog_status does not exist' } },
      { data: [rawBook(1)], error: null },
    ];
    renderHook(() => usePaginatedLibraryBooks({ searchQuery: 'book' }));
    const books = await mocks.queryOptions.queryFn();
    expect(books).toHaveLength(1);
    expect(mocks.select).toHaveBeenCalledWith('base columns');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('probe mismatch'), 'column catalog_status does not exist');
  });

  it('propagates query errors when fallback is not applicable', async () => {
    mocks.detectCaps.mockResolvedValueOnce({ hasStatus: false, hasCatalogStatus: false, checked: true });
    mocks.queryResponses = [{ data: null, error: new Error('query unavailable') }];
    renderHook(() => usePaginatedLibraryBooks());
    await expect(mocks.queryOptions.queryFn()).rejects.toThrow('query unavailable');
  });

  it('refetches on shelf and library update events and removes listeners on unmount', () => {
    const { unmount } = renderHook(() => usePaginatedLibraryBooks());
    act(() => {
      window.dispatchEvent(new Event('shelfUpdated'));
      window.dispatchEvent(new Event('libraryUpdated'));
    });
    expect(mocks.refetch).toHaveBeenCalledTimes(2);
    unmount();
    window.dispatchEvent(new Event('shelfUpdated'));
    expect(mocks.refetch).toHaveBeenCalledTimes(2);
  });
});
