// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc: mocks.rpc },
}));

import {
  useAddGroupReadingBook,
  useGroupReadingBooks,
  useRemoveGroupReadingBook,
  useSaveGroupReadingProgress,
  useSetGroupReadingBookStatus,
} from '@/hooks/useGroupReadingBoard';

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateQueries };
};

describe('useGroupReadingBoard RPC hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: 'result-1', error: null });
  });

  afterEach(() => cleanup());

  it('loads the shared list for an enabled member query and returns an empty list for null data', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useGroupReadingBooks('group-1', true), {
      wrapper: makeWrapper().wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mocks.rpc).toHaveBeenCalledWith('list_reading_group_books', { p_group_id: 'group-1' });
  });

  it('does not query when the group id is empty or the query is disabled', () => {
    const { result: emptyGroup } = renderHook(() => useGroupReadingBooks('', true), {
      wrapper: makeWrapper().wrapper,
    });
    expect(emptyGroup.current.fetchStatus).toBe('idle');

    const { result: disabled } = renderHook(() => useGroupReadingBooks('group-1', false), {
      wrapper: makeWrapper().wrapper,
    });
    expect(disabled.current.fetchStatus).toBe('idle');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('surfaces list RPC errors with the database message and a safe fallback', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'membership required' } });
    const first = renderHook(() => useGroupReadingBooks('group-1', true), {
      wrapper: makeWrapper().wrapper,
    });
    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect(first.result.current.error?.message).toBe('membership required');
    first.unmount();

    mocks.rpc.mockResolvedValueOnce({ data: null, error: {} });
    const second = renderHook(() => useGroupReadingBooks('group-2', true), {
      wrapper: makeWrapper().wrapper,
    });
    await waitFor(() => expect(second.result.current.isError).toBe(true));
    expect(second.result.current.error?.message).toBe('Could not load the group reading list.');
  });

  it('adds a book with a target date and invalidates only that group list', async () => {
    const context = makeWrapper();
    const { result } = renderHook(() => useAddGroupReadingBook(), { wrapper: context.wrapper });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      bookId: 'book-1',
      targetDate: '2026-12-01',
    })).resolves.toBe('result-1');
    expect(mocks.rpc).toHaveBeenCalledWith('add_reading_group_book', {
      p_group_id: 'group-1',
      p_book_id: 'book-1',
      p_target_date: '2026-12-01',
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-books', 'group-1'],
    }));
  });

  it('uses a null target date by default and propagates add errors', async () => {
    const { result } = renderHook(() => useAddGroupReadingBook(), {
      wrapper: makeWrapper().wrapper,
    });
    await result.current.mutateAsync({ groupId: 'group-2', bookId: 'book-2' });
    expect(mocks.rpc).toHaveBeenCalledWith('add_reading_group_book', {
      p_group_id: 'group-2',
      p_book_id: 'book-2',
      p_target_date: null,
    });

    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'duplicate title' } });
    await expect(result.current.mutateAsync({ groupId: 'group-2', bookId: 'book-3' }))
      .rejects.toThrow('duplicate title');
  });

  it('updates a book status and invalidates the corresponding group query', async () => {
    const context = makeWrapper();
    const { result } = renderHook(() => useSetGroupReadingBookStatus(), { wrapper: context.wrapper });
    await expect(result.current.mutateAsync({
      groupId: 'group-3',
      readingBookId: 'reading-1',
      status: 'completed',
    })).resolves.toBe('result-1');
    expect(mocks.rpc).toHaveBeenCalledWith('set_reading_group_book_status', {
      p_group_reading_book_id: 'reading-1',
      p_status: 'completed',
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-books', 'group-3'],
    }));
  });

  it('surfaces status-update RPC errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'moderator permission required' } });
    const { result } = renderHook(() => useSetGroupReadingBookStatus(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      readingBookId: 'reading-1',
      status: 'up_next',
    })).rejects.toThrow('moderator permission required');
  });

  it('removes a book and invalidates its reading list', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const context = makeWrapper();
    const { result } = renderHook(() => useRemoveGroupReadingBook(), { wrapper: context.wrapper });
    await expect(result.current.mutateAsync({
      groupId: 'group-4',
      readingBookId: 'reading-2',
    })).resolves.toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledWith('remove_reading_group_book', {
      p_group_reading_book_id: 'reading-2',
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-books', 'group-4'],
    }));
  });

  it('surfaces removal errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'not allowed' } });
    const { result } = renderHook(() => useRemoveGroupReadingBook(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      readingBookId: 'reading-2',
    })).rejects.toThrow('not allowed');
  });

  it('saves a validated page and sharing preference for the signed-in member', async () => {
    const context = makeWrapper();
    const { result } = renderHook(() => useSaveGroupReadingProgress(), { wrapper: context.wrapper });
    await expect(result.current.mutateAsync({
      groupId: 'group-5',
      readingBookId: 'reading-5',
      currentPage: 55,
      isShared: true,
    })).resolves.toBe('result-1');
    expect(mocks.rpc).toHaveBeenCalledWith('save_reading_group_progress', {
      p_group_reading_book_id: 'reading-5',
      p_current_page: 55,
      p_is_shared: true,
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-books', 'group-5'],
    }));
  });

  it('rejects negative and fractional page numbers before calling the RPC', async () => {
    const { result } = renderHook(() => useSaveGroupReadingProgress(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1', readingBookId: 'reading-1', currentPage: -1, isShared: false,
    })).rejects.toThrow('Enter a valid page number.');
    await expect(result.current.mutateAsync({
      groupId: 'group-1', readingBookId: 'reading-1', currentPage: 1.5, isShared: false,
    })).rejects.toThrow('Enter a valid page number.');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('surfaces progress RPC errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'progress update denied' } });
    const { result } = renderHook(() => useSaveGroupReadingProgress(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1', readingBookId: 'reading-1', currentPage: 10, isShared: false,
    })).rejects.toThrow('progress update denied');
  });
});
