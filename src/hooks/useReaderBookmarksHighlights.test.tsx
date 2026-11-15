import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAddReaderBookmark, useDeleteReaderBookmark, useReaderBookmarks } from './useReaderBookmarks';
import {
  useAddReaderHighlight, useDeleteReaderHighlight, useReaderHighlights, useUpdateReaderHighlight,
} from './useReaderHighlights';

const mocks = vi.hoisted(() => ({ user: null as { id: string } | null, from: vi.fn(), builder: {} as any }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('reader bookmark and highlight hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'user-1' };
    const b: any = {};
    for (const method of ['select', 'eq', 'order', 'upsert', 'insert', 'delete', 'update']) {
      b[method] = vi.fn(() => b);
    }
    b.order.mockResolvedValue({ data: [], error: null });
    b.single = vi.fn().mockResolvedValue({ data: { id: 'row-1' }, error: null });
    b.eq.mockImplementation(() => b);
    mocks.builder = b;
    mocks.from.mockReturnValue(b);
  });
  afterEach(() => vi.clearAllMocks());

  it('loads bookmarks for a signed-in user and book; disables without required inputs', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useReaderBookmarks('book-a'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.from).toHaveBeenCalledWith('reader_bookmarks');
    expect(mocks.builder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-1');
    expect(mocks.builder.eq).toHaveBeenNthCalledWith(2, 'book_id', 'book-a');

    mocks.user = null;
    const guest = renderHook(() => useReaderBookmarks('book-a'), { wrapper });
    expect(guest.result.current.fetchStatus).toBe('idle');
  });

  it('adds bookmark with normalized page and trimmed label, then invalidates book query', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useAddReaderBookmark(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ bookId: 'book-a', location: 'loc-1', page: 0, label: '  Important  ' });
    });
    expect(mocks.builder.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1', book_id: 'book-a', location: 'loc-1', page: 1, label: 'Important',
    }), { onConflict: 'user_id,book_id,location' });
  });

  it('rejects bookmark writes when signed out and deletes only the current user row', async () => {
    const wrapper = makeWrapper();
    mocks.user = null;
    const add = renderHook(() => useAddReaderBookmark(), { wrapper });
    await expect(add.result.current.mutateAsync({ bookId: 'b', location: 'l', page: 1 })).rejects.toThrow('Sign in to sync bookmarks across devices.');
    mocks.user = { id: 'user-1' };
    const remove = renderHook(() => useDeleteReaderBookmark(), { wrapper });
    await act(async () => { await remove.result.current.mutateAsync({ id: 'bookmark-1', bookId: 'b' }); });
    expect(mocks.builder.delete).toHaveBeenCalled();
    expect(mocks.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('loads highlights and filters the requested book client-side', async () => {
    mocks.builder.order.mockResolvedValue({ data: [
      { id: 'h1', book_id: 'book-a' }, { id: 'h2', book_id: 'book-b' },
    ], error: null });
    const { result } = renderHook(() => useReaderHighlights('book-a'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'h1', book_id: 'book-a' }]);
  });

  it('validates highlight text and inserts trimmed content with safe page/color defaults', async () => {
    const { result } = renderHook(() => useAddReaderHighlight(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync({ bookId: 'b', text: '   ', page: 2 })).rejects.toThrow('Highlight text must be between 1 and 10,000 characters.');
    await expect(result.current.mutateAsync({ bookId: 'b', text: 'x'.repeat(10001), page: 2 })).rejects.toThrow('Highlight text must be between 1 and 10,000 characters.');
    await act(async () => { await result.current.mutateAsync({ bookId: 'b', text: '  quote  ', page: 0 }); });
    expect(mocks.builder.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1', book_id: 'b', text: 'quote', page: 1, location: null, color: 'yellow',
    }));
  });

  it('requires authentication for highlight mutations and normalizes updates', async () => {
    const wrapper = makeWrapper();
    mocks.user = null;
    const add = renderHook(() => useAddReaderHighlight(), { wrapper });
    await expect(add.result.current.mutateAsync({ bookId: 'b', text: 'quote', page: 1 })).rejects.toThrow('Sign in to save and sync reader highlights.');
    const remove = renderHook(() => useDeleteReaderHighlight(), { wrapper });
    await expect(remove.result.current.mutateAsync({ id: 'h1', bookId: 'b' })).rejects.toThrow('Sign in first.');
    const update = renderHook(() => useUpdateReaderHighlight(), { wrapper });
    await expect(update.result.current.mutateAsync({ id: 'h1', text: '' })).rejects.toThrow('Highlight text must be between 1 and 10,000 characters.');
    mocks.user = { id: 'user-1' };
    await act(async () => { await update.result.current.mutateAsync({ id: 'h1', bookId: 'b', text: '  edited ', page: 0, color: 'blue' }); });
    expect(mocks.builder.update).toHaveBeenCalledWith({ text: 'edited', page: 1, color: 'blue' });
    expect(mocks.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
