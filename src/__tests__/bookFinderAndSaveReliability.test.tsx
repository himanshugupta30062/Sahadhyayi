/** @vitest-environment jsdom */

import { describe, vi, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGetSession, mockFunctionsInvoke, mockFrom, mockRpc, mockToast, mockUserState } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFunctionsInvoke: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockToast: vi.fn(),
  mockUserState: { current: null as any },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUserState.current }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUserState.current }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: (...args: any[]) => mockToast(...args),
  useToast: () => ({
    toast: (...args: any[]) => mockToast(...args),
  }),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: mockUserState.current,
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUserState.current,
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/lib/bookCapabilities', () => ({
  detectBookSchemaCapabilities: vi.fn().mockResolvedValue({
    hasStatus: false,
    hasAuditTrail: false,
    hasAuthorBio: true,
  }),
  applyPublicBookFilter: vi.fn((query) => query),
  filterPublicBooks: vi.fn((books) => books),
}));

vi.mock('@/components/library/LibgenBookCard', () => ({
  LibgenBookCard: ({ book }: { book: any }) => (
    <div data-testid={`libgen-card-${book.id}`}>{book.title}</div>
  ),
}));

import { useBookSearch, clientSearchCache } from '@/hooks/useBookSearch';
import BookSelectionModal from '@/components/library/BookSelectionModal';

import { MemoryRouter } from 'react-router-dom';

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
};

describe('useBookSearch hook reliability & caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientSearchCache.clear();
    mockUserState.current = null;

    // Default mockFrom returning empty database results
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  it('retrieves subsequent identical queries instantly from cache without extra network calls', async () => {
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        books: [
          {
            title: 'Pride and Prejudice',
            author: 'Jane Austen',
            isbn: '9780141439518',
            source: 'gutenberg',
            access_type: 'full_download',
            formats: ['epub', 'html'],
          },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useBookSearch());

    let firstRes: any;
    await act(async () => {
      firstRes = await result.current.searchBooks('Pride and Prejudice');
    });

    expect(firstRes).toHaveLength(1);
    expect(mockFunctionsInvoke).toHaveBeenCalledTimes(1);

    // Second call with same term (case-insensitive trimmed)
    let secondRes: any;
    await act(async () => {
      secondRes = await result.current.searchBooks('  pride and prejudice  ');
    });

    expect(secondRes).toHaveLength(1);
    // Should NOT have called mockFunctionsInvoke again
    expect(mockFunctionsInvoke).toHaveBeenCalledTimes(1);
  });

  it('cancels stale in-flight searches when a newer search is issued', async () => {
    let resolveFirst: any;
    const firstPromise = new Promise((res) => {
      resolveFirst = res;
    });

    mockFunctionsInvoke
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce({
        data: {
          success: true,
          books: [
            {
              title: 'War and Peace',
              author: 'Leo Tolstoy',
              source: 'standard_ebooks',
              access_type: 'full_download',
              formats: ['epub'],
            },
          ],
        },
        error: null,
      });

    const { result } = renderHook(() => useBookSearch());

    // Trigger slow first search
    let firstCallPromise: Promise<any>;
    act(() => {
      firstCallPromise = result.current.searchBooks('Slow Query');
    });

    // Immediately trigger fast second search
    await act(async () => {
      await result.current.searchBooks('Fast Query');
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].title).toBe('War and Peace');

    // Resolve the first slow search later
    await act(async () => {
      resolveFirst({
        data: {
          success: true,
          books: [
            {
              title: 'Ancient History',
              author: 'Old Author',
              source: 'openalex',
              access_type: 'metadata_only',
              formats: [],
            },
          ],
        },
        error: null,
      });
      await firstCallPromise;
    });

    // Stale result must be discarded; results must still be War and Peace
    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].title).toBe('War and Peace');
  });

  it('rejects saveSelectedBooks if user is unauthenticated before invoking edge function', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useBookSearch());

    await expect(
      result.current.saveSelectedBooks([
        {
          id: 'temp-1',
          title: 'The Republic',
          author: 'Plato',
          created_at: new Date().toISOString(),
        },
      ])
    ).rejects.toThrow(/Authentication required/i);

    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it('passes user JWT in authorization header and returns detailed save outcome', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'valid-jwt-token-xyz',
          user: { id: 'usr-123', email: 'test@example.com' },
        },
      },
      error: null,
    });

    mockFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        booksSaved: 1,
        newlyInserted: 1,
        enrichedCount: 0,
        failedCount: 0,
        duplicatesFound: 0,
        books: [{ id: 'b-1', title: 'Cosmos', author: 'Carl Sagan' }],
        results: [{ title: 'Cosmos', status: 'inserted', id: 'b-1' }],
      },
      error: null,
    });

    const { result } = renderHook(() => useBookSearch());

    let outcome: any;
    await act(async () => {
      outcome = await result.current.saveSelectedBooks([
        {
          id: 'temp-1',
          title: 'Cosmos',
          author: 'Carl Sagan',
          created_at: new Date().toISOString(),
        },
      ]);
    });

    expect(outcome.newlyInserted).toBe(1);
    expect(outcome.savedBooks).toHaveLength(1);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'save-selected-books',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer valid-jwt-token-xyz',
        },
      })
    );
  });

  it('falls back seamlessly to save_selected_books RPC when Edge Function returns 401 or error', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'valid-jwt-token-xyz',
          user: { id: 'usr-123', email: 'test@example.com' },
        },
      },
      error: null,
    });

    // Simulate Edge Function 401 / failure
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: { error: 'Invalid authentication credentials' },
      error: { message: 'Edge Function returned a non-2xx status code' },
    });

    // Simulate database RPC fallback succeeding
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        booksSaved: 1,
        newlyInserted: 1,
        enrichedCount: 0,
        failedCount: 0,
        duplicatesFound: 0,
        books: [{ id: 'b-fallback-1', title: 'The Odyssey', author: 'Homer' }],
        results: [{ title: 'The Odyssey', status: 'inserted', id: 'b-fallback-1' }],
      },
      error: null,
    });

    const { result } = renderHook(() => useBookSearch());

    let outcome: any;
    await act(async () => {
      outcome = await result.current.saveSelectedBooks([
        {
          id: 'temp-odyssey',
          title: 'The Odyssey',
          author: 'Homer',
          created_at: new Date().toISOString(),
        },
      ]);
    });

    expect(outcome.newlyInserted).toBe(1);
    expect(outcome.savedBooks[0].title).toBe('The Odyssey');
    expect(mockRpc).toHaveBeenCalledWith('save_selected_books', {
      p_books: [
        expect.objectContaining({
          title: 'The Odyssey',
          author: 'Homer',
        }),
      ],
    });
  });

  it('falls back to direct public provider search when search-books-preview edge function fails', async () => {
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code' },
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('openlibrary.org')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              docs: [
                {
                  key: '/works/OL12345W',
                  title: 'Crime and Punishment',
                  author_name: ['Fyodor Dostoevsky'],
                  first_publish_year: 1866,
                  cover_i: 9999,
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });
    });

    try {
      const { result } = renderHook(() => useBookSearch());

      let searchRes: any;
      await act(async () => {
        searchRes = await result.current.searchBooks('Crime and Punishment');
      });

      expect(searchRes).toHaveLength(1);
      expect(searchRes[0].title).toBe('Crime and Punishment');
      expect(searchRes[0].author).toBe('Fyodor Dostoevsky');
      expect(searchRes[0].source).toBe('open_library');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('BookSelectionModal UX & Provider Badges', () => {
  const sampleBooks = [
    {
      id: 'book-1',
      title: 'Frankenstein',
      author: 'Mary Shelley',
      genre: 'Classic Horror',
      cover_image_url: 'https://covers.openlibrary.org/b/id/1.jpg',
      pdf_url: 'https://www.gutenberg.org/ebooks/84.epub.images',
      epub_url: 'https://www.gutenberg.org/ebooks/84.epub3.images',
      source: 'gutenberg',
      access_type: 'full_download' as const,
      formats: ['epub', 'html'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'book-2',
      title: 'Quantum Mechanics and Path Integrals',
      author: 'Richard Feynman',
      genre: 'Physics',
      cover_image_url: null,
      reader_url: 'https://books.google.com/books?id=123',
      source: 'google_books',
      access_type: 'preview' as const,
      formats: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'book-3',
      title: 'The Time Machine',
      author: 'H. G. Wells',
      genre: 'Science Fiction',
      cover_image_url: 'https://standardebooks.org/covers/3.jpg',
      epub_url: 'https://standardebooks.org/ebooks/h-g-wells/the-time-machine/dist.epub',
      source: 'standard_ebooks',
      access_type: 'full_download' as const,
      formats: ['epub'],
      created_at: new Date().toISOString(),
    },
  ];

  it('renders provider badges and access badges for external sources', () => {
    renderWithQueryClient(
      <BookSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        books={sampleBooks}
        searchTerm="Classics"
        onSaveSuccess={vi.fn()}
      />
    );

    // Verify source badges appear
    expect(screen.getByText(/Project Gutenberg/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Books/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Ebooks/i)).toBeInTheDocument();

    // Verify access type badges appear
    expect(screen.getAllByText(/Full Text \/ Download/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Preview Only/i)).toBeInTheDocument();
  });

  it('renders filter controls for source and format', async () => {
    renderWithQueryClient(
      <BookSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        books={sampleBooks}
        searchTerm="Classics"
        onSaveSuccess={vi.fn()}
      />
    );

    expect(screen.getAllByText('Frankenstein')[0]).toBeInTheDocument();
    expect(screen.getAllByText('The Time Machine')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Quantum Mechanics and Path Integrals')[0]).toBeInTheDocument();

    // Verify filter triggers are rendered
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/All Sources/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/All Formats/i).length).toBeGreaterThan(0);
  });

  it('prompts sign-in toast when unauthenticated user attempts to save books', async () => {
    mockUserState.current = null;

    renderWithQueryClient(
      <BookSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        books={sampleBooks}
        searchTerm="Classics"
        onSaveSuccess={vi.fn()}
      />
    );

    // All books are selected by default; click the "Sign In to Save" button
    const saveButtons = screen.getAllByText(/Sign In to Save/i);
    expect(saveButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(saveButtons[0]);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sign in required',
        variant: 'destructive',
      })
    );
  });

  it('displays per-book outcome statuses and allows single-book retry', async () => {
    mockUserState.current = { id: 'usr-1', email: 'user@example.com' };
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: 'test-token', user: { id: 'usr-1' } },
      },
      error: null,
    });

    // Mock initial save returning 1 inserted, 1 failed
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        booksSaved: 1,
        newlyInserted: 1,
        enrichedCount: 0,
        failedCount: 1,
        duplicatesFound: 0,
        books: [{ id: 'book-1', title: 'Frankenstein', author: 'Mary Shelley' }],
        results: [
          { title: 'Frankenstein', status: 'inserted', id: 'book-1' },
          { title: 'Quantum Mechanics and Path Integrals', status: 'failed', error: 'Network timeout' },
        ],
      },
      error: null,
    });

    renderWithQueryClient(
      <BookSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        books={sampleBooks.slice(0, 2)}
        searchTerm="Classics"
        onSaveSuccess={vi.fn()}
      />
    );

    const saveButtons = screen.getAllByText(/Save Selected/i);
    await act(async () => {
      fireEvent.click(saveButtons[0]);
    });

    // Check that success and failed badges are rendered
    await waitFor(() => {
      expect(screen.getByText(/Saved to catalog/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to save/i)).toBeInTheDocument();
      // Retry button should be present for the failed book
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    // Mock retry resolving successfully
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        booksSaved: 1,
        newlyInserted: 1,
        enrichedCount: 0,
        failedCount: 0,
        duplicatesFound: 0,
        books: [{ id: 'book-2', title: 'Quantum Mechanics and Path Integrals', author: 'Richard Feynman' }],
        results: [{ title: 'Quantum Mechanics and Path Integrals', status: 'inserted', id: 'book-2' }],
      },
      error: null,
    });

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    await act(async () => {
      fireEvent.click(retryButton);
    });

    // After retry, both books should have success indicators
    await waitFor(() => {
      expect(screen.getAllByText(/Saved to catalog/i).length).toBe(2);
    });
  });
});

describe('useBookSearch edge resilience & duplicate enrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientSearchCache.clear();
    mockUserState.current = { id: 'usr-1', email: 'test@example.com' };
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token-abc', user: { id: 'usr-1' } } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  it('handles partial provider failure gracefully and returns books from available providers', async () => {
    // External search returns books even if some backend providers timed out
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        booksFound: 1,
        sources: { standard_ebooks: 1, gutenberg: 0 },
        metrics: {
          standard_ebooks: { count: 1, latencyMs: 250, status: 'ok' },
          gutenberg: { count: 0, latencyMs: 4000, status: 'timeout' },
        },
        books: [
          {
            title: 'Dracula',
            author: 'Bram Stoker',
            source: 'standard_ebooks',
            access_type: 'full_download',
            formats: ['epub'],
          },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useBookSearch());

    let results: any;
    await act(async () => {
      results = await result.current.searchBooks('Dracula');
    });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Dracula');
    expect(results[0].source).toBe('standard_ebooks');
    expect(result.current.error).toBeNull();
  });

  it('enriches existing records when duplicate books contain complementary metadata', async () => {
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        booksSaved: 1,
        newlyInserted: 0,
        enrichedCount: 1,
        failedCount: 0,
        duplicatesFound: 1,
        books: [
          {
            id: 'existing-id-1',
            title: 'Great Expectations',
            author: 'Charles Dickens',
            cover_image_url: 'https://new-cover.jpg',
          },
        ],
        results: [
          {
            title: 'Great Expectations',
            status: 'enriched',
            id: 'existing-id-1',
            enrichedFields: ['cover_image_url', 'pdf_url'],
          },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useBookSearch());

    let outcome: any;
    await act(async () => {
      outcome = await result.current.saveSelectedBooks([
        {
          id: 'temp-ge',
          title: 'Great Expectations',
          author: 'Charles Dickens',
          cover_image_url: 'https://new-cover.jpg',
          created_at: new Date().toISOString(),
        },
      ]);
    });

    expect(outcome.enrichedCount).toBe(1);
    expect(outcome.newlyInserted).toBe(0);
    expect(outcome.duplicatesFound).toBe(1);
  });
});

