// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as null | { id: string },
  upsert: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  lookupEq: vi.fn(),
  lookupSelect: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
    auth: { getUser: vi.fn().mockImplementation(async () => ({ data: { user: mocks.user } })) },
  },
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
    mocks.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
    mocks.lookupEq.mockReset().mockReturnValue({ eq: mocks.lookupEq, maybeSingle: mocks.maybeSingle });
    mocks.lookupSelect.mockReset().mockReturnValue({ eq: mocks.lookupEq });
    mocks.select.mockReset().mockReturnValue({ single: mocks.single });
    mocks.upsert.mockReset().mockReturnValue({ select: mocks.select });
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.update.mockReset().mockReturnValue({ eq: mocks.lookupEq, error: null });
    mocks.from.mockReset().mockImplementation(() => ({
      upsert: mocks.upsert,
      insert: mocks.insert,
      update: mocks.update,
      select: mocks.lookupSelect,
    }));
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
      started_at: expect.any(String), completed_at: expect.any(String),
    }, { onConflict: 'user_id,book_id' });
  });

  it('preserves the original start and completion timestamps for an existing completed book', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { started_at: '2026-01-01T00:00:00Z', completed_at: '2026-02-01T00:00:00Z' }, error: null });
    const { result } = renderProgressHook();
    await act(async () => {
      await result.current.mutateAsync({ bookId: 'book-1', bookTitle: 'Book', currentPage: 10, totalPages: 10 });
    });
    const payload = mocks.upsert.mock.calls[0][0];
    expect(payload.started_at).toBe('2026-01-01T00:00:00Z');
    expect(payload.completed_at).toBe('2026-02-01T00:00:00Z');
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
    const { result: unauthResult } = renderProgressHook();
    await expect(unauthResult.current.mutateAsync({
      bookId: 'book-1', bookTitle: 'Book', currentPage: 1, totalPages: 10,
    })).rejects.toThrow('Sign in to save reading progress');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('rejects invalid total pages before looking up or writing progress', async () => {
    const { result } = renderProgressHook();
    for (const totalPages of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(result.current.mutateAsync({
        bookId: 'book-1', bookTitle: 'Book', currentPage: 1, totalPages,
      })).rejects.toThrow('Total pages must be a positive number');
    }
    expect(mocks.lookupSelect).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('normalizes fractional page inputs to positive whole pages', async () => {
    const { result } = renderProgressHook();
    await act(async () => {
      await result.current.mutateAsync({
        bookId: 'book-2', bookTitle: 'Book', currentPage: 0.8, totalPages: 5.9,
      });
    });
    const payload = mocks.upsert.mock.calls[0][0];
    expect(payload.current_page).toBe(1);
    expect(payload.total_pages).toBe(5);
    expect(payload.completed_at).toBeNull();
  });

  it('surfaces Supabase write errors', async () => {
    mocks.single.mockResolvedValue({ data: null, error: new Error('Write failed') });
    const { result } = renderProgressHook();
    await expect(result.current.mutateAsync({
      bookId: 'book-1', bookTitle: 'Book', currentPage: 1, totalPages: 10,
    })).rejects.toThrow('Write failed');
  });
});
