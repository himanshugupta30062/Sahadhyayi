// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as null | { id: string },
  upsert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));

import { useSaveReadingProgress } from './useReadingProgress';

const renderProgressHook = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useSaveReadingProgress(), { wrapper });
};

describe('useSaveReadingProgress', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.single.mockReset().mockResolvedValue({ data: { id: 1 }, error: null });
    mocks.select.mockReset().mockReturnValue({ single: mocks.single });
    mocks.upsert.mockReset().mockReturnValue({ select: mocks.select });
    mocks.from.mockReset().mockReturnValue({ upsert: mocks.upsert });
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('trims book ID and title and clamps the page to the total', async () => {
    const { result } = renderProgressHook();
    await act(async () => {
      await result.current.mutateAsync({
        bookId: ' book-1 ', bookTitle: '  Example Book  ',
        currentPage: 120, totalPages: 100, coverImageUrl: 'cover.jpg',
      });
    });
    expect(mocks.from).toHaveBeenCalledWith('reading_progress');
    expect(mocks.upsert).toHaveBeenCalledWith({
      user_id: 'reader-1', book_id: 'book-1', book_title: 'Example Book',
      current_page: 100, total_pages: 100, cover_image_url: 'cover.jpg',
    }, { onConflict: 'user_id,book_id' });
  });

  it('rejects a blank book ID or title before writing', async () => {
    const { result } = renderProgressHook();
    await expect(result.current.mutateAsync({
      bookId: '  ', bookTitle: 'Book', currentPage: 1, totalPages: 10,
    })).rejects.toThrow('Book ID is required');
    await expect(result.current.mutateAsync({
      bookId: 'book-1', bookTitle: '  ', currentPage: 1, totalPages: 10,
    })).rejects.toThrow('Book title is required');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('rejects non-finite page values and missing authentication', async () => {
    const { result } = renderProgressHook();
    await expect(result.current.mutateAsync({
      bookId: 'book-1', bookTitle: 'Book', currentPage: Number.NaN, totalPages: 10,
    })).rejects.toThrow('Current page must be a positive number');
    mocks.user = null;
    await expect(result.current.mutateAsync({
      bookId: 'book-1', bookTitle: 'Book', currentPage: 1, totalPages: 10,
    })).rejects.toThrow('Sign in to save reading progress');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('surfaces Supabase write errors', async () => {
    mocks.single.mockResolvedValue({ data: null, error: new Error('Write failed') });
    const { result } = renderProgressHook();
    await expect(result.current.mutateAsync({
      bookId: 'book-1', bookTitle: 'Book', currentPage: 1, totalPages: 10,
    })).rejects.toThrow('Write failed');
  });
});
