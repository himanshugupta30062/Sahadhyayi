// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSaveReadingProgress, useUpdateReadingProgress } from '@/hooks/useReadingProgress';
import { resetRequestSequence } from './readingProgressSync';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-sync-1' } as null | { id: string },
  rpSelect: vi.fn(),
  rpUpsert: vi.fn(),
  rpUpdate: vi.fn(),
  shelfSelect: vi.fn(),
  shelfInsert: vi.fn(),
  shelfUpdate: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (table: string) => mocks.from(table),
    auth: { getUser: vi.fn().mockImplementation(async () => ({ data: { user: mocks.user } })) },
  },
}));

describe('Unified Reading Progress Synchronization Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    resetRequestSequence();
    mocks.user = { id: 'reader-sync-1' };
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const createQueryChain = (data: any, error: any = null) => {
      const chain: any = {
        select: vi.fn().mockImplementation(() => chain),
        eq: vi.fn().mockImplementation(() => chain),
        order: vi.fn().mockImplementation(() => Promise.resolve({ data, error })),
        maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data, error })),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data, error })),
        upsert: vi.fn().mockImplementation(() => chain),
        insert: vi.fn().mockImplementation(() => Promise.resolve({ data, error })),
        update: vi.fn().mockImplementation(() => chain),
      };
      return chain;
    };

    mocks.from.mockImplementation((table: string) => {
      if (table === 'reading_progress') {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 101, book_id: 'book-1', current_page: 25, total_pages: 100, book_title: 'Dune' },
            error: null,
          }),
          single: vi.fn().mockResolvedValue({
            data: { id: 101, book_id: 'book-1', current_page: 50, total_pages: 100 },
            error: null,
          }),
          upsert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
        };
        return chain;
      }

      if (table === 'user_bookshelf') {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'shelf-1', book_id: 'book-1', status: 'reading', progress: 25 },
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
        return chain;
      }

      return createQueryChain(null);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderSaveHook = () => {
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useSaveReadingProgress(), { wrapper });
  };

  const renderUpdateHook = () => {
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useUpdateReadingProgress(), { wrapper });
  };

  it('performs optimistic cache update across both reading_progress and user_bookshelf', async () => {
    // Populate initial caches
    queryClient.setQueryData(['reading-progress', 'reader-sync-1'], [
      { id: 101, book_id: 'book-1', book_title: 'Dune', current_page: 25, total_pages: 100 },
    ]);
    queryClient.setQueryData(['user-bookshelf', 'reader-sync-1'], [
      { id: 'shelf-1', book_id: 'book-1', status: 'reading', progress: 25 },
    ]);

    const { result } = renderSaveHook();

    await act(async () => {
      await result.current.mutateAsync({
        bookId: 'book-1',
        bookTitle: 'Dune',
        currentPage: 50,
        totalPages: 100,
      });
    });

    const updatedProgress = queryClient.getQueryData<any[]>(['reading-progress', 'reader-sync-1']);
    const updatedShelf = queryClient.getQueryData<any[]>(['user-bookshelf', 'reader-sync-1']);

    expect(updatedProgress?.[0].current_page).toBe(50);
    expect(updatedShelf?.[0].progress).toBe(50);
    expect(updatedShelf?.[0].status).toBe('reading');
  });

  it('auto-completes status when current page reaches total pages', async () => {
    queryClient.setQueryData(['user-bookshelf', 'reader-sync-1'], [
      { id: 'shelf-1', book_id: 'book-1', status: 'reading', progress: 50 },
    ]);

    const { result } = renderSaveHook();

    await act(async () => {
      await result.current.mutateAsync({
        bookId: 'book-1',
        bookTitle: 'Dune',
        currentPage: 100,
        totalPages: 100,
      });
    });

    const updatedShelf = queryClient.getQueryData<any[]>(['user-bookshelf', 'reader-sync-1']);
    expect(updatedShelf?.[0].progress).toBe(100);
    expect(updatedShelf?.[0].status).toBe('completed');
  });

  it('preserves DNF status without auto-transitioning to reading', async () => {
    queryClient.setQueryData(['user-bookshelf', 'reader-sync-1'], [
      { id: 'shelf-1', book_id: 'book-dnf', status: 'dnf', progress: 30 },
    ]);

    const { result } = renderSaveHook();

    await act(async () => {
      await result.current.mutateAsync({
        bookId: 'book-dnf',
        bookTitle: 'Abandoned Book',
        currentPage: 35,
        totalPages: 100,
      });
    });

    const updatedShelf = queryClient.getQueryData<any[]>(['user-bookshelf', 'reader-sync-1']);
    expect(updatedShelf?.[0].status).toBe('dnf');
  });

  it('rolls back optimistic cache on persistence error', async () => {
    queryClient.setQueryData(['reading-progress', 'reader-sync-1'], [
      { id: 101, book_id: 'book-1', book_title: 'Dune', current_page: 25, total_pages: 100 },
    ]);
    queryClient.setQueryData(['user-bookshelf', 'reader-sync-1'], [
      { id: 'shelf-1', book_id: 'book-1', status: 'reading', progress: 25 },
    ]);

    mocks.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      upsert: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Network timeout') }),
      })),
    }));

    const { result } = renderSaveHook();

    await act(async () => {
      try {
        await result.current.mutateAsync({
          bookId: 'book-1',
          bookTitle: 'Dune',
          currentPage: 75,
          totalPages: 100,
        });
      } catch {
        // Expected network error
      }
    });

    // Cache should be rolled back to initial state
    const rolledBackProgress = queryClient.getQueryData<any[]>(['reading-progress', 'reader-sync-1']);
    const rolledBackShelf = queryClient.getQueryData<any[]>(['user-bookshelf', 'reader-sync-1']);

    expect(rolledBackProgress?.[0].current_page).toBe(25);
    expect(rolledBackShelf?.[0].progress).toBe(25);
  });

  it('handles unknown page count gracefully using percentage basis', async () => {
    const { result } = renderSaveHook();

    await act(async () => {
      const saved = await result.current.mutateAsync({
        bookId: 'book-unknown-pages',
        bookTitle: 'Ancient Scroll',
        percentage: 60,
      });
      expect(saved?.percentage).toBe(60);
      expect(saved?.currentPage).toBe(60);
      expect(saved?.totalPages).toBe(100);
    });
  });

  it('supports update progress by record ID and syncs bookshelf', async () => {
    queryClient.setQueryData(['reading-progress', 'reader-sync-1'], [
      { id: 101, book_id: 'book-1', book_title: 'Dune', current_page: 25, total_pages: 100 },
    ]);

    const { result } = renderUpdateHook();

    await act(async () => {
      await result.current.mutateAsync({
        id: 101,
        current_page: 80,
      });
    });

    expect(mocks.from).toHaveBeenCalledWith('reading_progress');
  });
});
