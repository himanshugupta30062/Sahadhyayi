// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queryOptions: null as any,
  mutationOptions: null as any,
  invalidateQueries: vi.fn(),
  removeChannel: vi.fn().mockResolvedValue(undefined),
  channelOn: vi.fn(),
  subscribe: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  single: vi.fn(),
  toast: vi.fn(),
  rows: [] as any[],
  result: { data: { id: 'shelf-1', user_id: 'reader-1', book_id: 'book-1', status: 'reading' }, error: null } as any,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: (options: any) => {
    mocks.queryOptions = options;
    return { data: mocks.rows, isLoading: false };
  },
  useMutation: (options: any) => {
    mocks.mutationOptions = options;
    return { mutate: vi.fn(), isPending: false };
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: (options: any) => mocks.toast(options),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (table: string) => mocks.from(table),
    channel: (...args: unknown[]) => {
      const channel = {
        on: (...onArgs: unknown[]) => {
          mocks.channelOn(...onArgs);
          return channel;
        },
        subscribe: () => {
          mocks.subscribe();
          return channel;
        },
      };
      return channel;
    },
    removeChannel: (...args: unknown[]) => mocks.removeChannel(...args),
  },
}));

import {
  useUserBookshelf,
  useAddToBookshelf,
  useUpdateBookshelfItem,
  useRemoveFromBookshelf,
} from '@/hooks/useUserBookshelf';

const makeQuery = () => {
  const query: any = {
    select: (...args: unknown[]) => { mocks.select(...args); return query; },
    eq: (...args: unknown[]) => { mocks.eq(...args); return query; },
    order: (...args: unknown[]) => { mocks.order(...args); return Promise.resolve(mocks.result); },
    insert: (...args: unknown[]) => { mocks.insert(...args); return query; },
    update: (...args: unknown[]) => { mocks.update(...args); return query; },
    delete: (...args: unknown[]) => { mocks.remove(...args); return query; },
    single: () => mocks.single(),
    then: (resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(mocks.result).then(resolve, reject),
  };
  return query;
};

describe('useUserBookshelf', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queryOptions = null;
    mocks.mutationOptions = null;
    mocks.rows = [];
    mocks.result = { data: [{ id: 'shelf-1', user_id: 'reader-1', book_id: 'book-1' }], error: null };
    for (const fn of [mocks.invalidateQueries, mocks.removeChannel, mocks.channelOn, mocks.subscribe, mocks.from, mocks.select, mocks.eq, mocks.order, mocks.insert, mocks.update, mocks.remove, mocks.single, mocks.toast]) fn.mockClear();
    mocks.removeChannel.mockResolvedValue(undefined);
    mocks.from.mockImplementation((table: string) => {
      expect(table).toBe('user_bookshelf');
      return makeQuery();
    });
    mocks.single.mockResolvedValue({ data: { id: 'shelf-1', user_id: 'reader-1', book_id: 'book-1', status: 'reading' }, error: null });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads the signed-in reader shelf with newest items first', async () => {
    renderHook(() => useUserBookshelf());
    expect(mocks.queryOptions.queryKey).toEqual(['user-bookshelf', 'reader-1']);
    expect(mocks.queryOptions.enabled).toBe(true);
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual(mocks.result.data);
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'reader-1');
    expect(mocks.order).toHaveBeenCalledWith('added_at', { ascending: false });
  });

  it('returns an empty shelf when the query runs without a user', async () => {
    mocks.user = null;
    renderHook(() => useUserBookshelf());
    expect(mocks.queryOptions.enabled).toBe(false);
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([]);
  });

  it('subscribes to realtime and browser shelf changes, then cleans up listeners', async () => {
    const { unmount } = renderHook(() => useUserBookshelf());
    expect(mocks.channelOn).toHaveBeenCalledWith('postgres_changes', expect.objectContaining({
      table: 'user_bookshelf',
      filter: 'user_id=eq.reader-1',
    }), expect.any(Function));

    window.dispatchEvent(new StorageEvent('storage', { key: 'sahadhyayi_shelf_sync' }));
    window.dispatchEvent(new Event('shelfUpdated'));
    await waitFor(() => expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user-bookshelf', 'reader-1'] }));

    unmount();
    expect(mocks.removeChannel).toHaveBeenCalled();
  });

  it('adds a book and invalidates shelf, challenge and badge caches on success', async () => {
    renderHook(() => useAddToBookshelf());
    await expect(mocks.mutationOptions.mutationFn({ bookId: 'book-1', status: 'want_to_read' })).resolves.toMatchObject({ id: 'shelf-1' });
    expect(mocks.insert).toHaveBeenCalledWith({ user_id: 'reader-1', book_id: 'book-1', status: 'want_to_read' });
    mocks.mutationOptions.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user-bookshelf'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user-challenges'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user-badges'] });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
  });

  it('rejects adding a book for a guest and reports the error', async () => {
    mocks.user = null;
    renderHook(() => useAddToBookshelf());
    await expect(mocks.mutationOptions.mutationFn({ bookId: 'book-1' })).rejects.toThrow('User not authenticated');
    mocks.mutationOptions.onError(new Error('User not authenticated'));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'User not authenticated',
      variant: 'destructive',
    }));
  });

  it('updates a shelf item and notifies dependent features', async () => {
    renderHook(() => useUpdateBookshelfItem());
    await expect(mocks.mutationOptions.mutationFn({ id: 'shelf-1', updates: { status: 'completed', rating: 5 } })).resolves.toMatchObject({ id: 'shelf-1' });
    expect(mocks.update).toHaveBeenCalledWith({ status: 'completed', rating: 5 });
    mocks.mutationOptions.onSuccess();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Book updated!' }));
  });

  it('removes a shelf item and reports successful removal', async () => {
    renderHook(() => useRemoveFromBookshelf());
    await expect(mocks.mutationOptions.mutationFn('shelf-1')).resolves.toBeUndefined();
    expect(mocks.remove).toHaveBeenCalled();
    mocks.mutationOptions.onSuccess();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Book removed from shelf!' }));
  });

  it('throws Supabase errors rather than silently accepting failed mutations', async () => {
    mocks.single.mockReturnValue({ data: null, error: new Error('database unavailable') });
    renderHook(() => useUpdateBookshelfItem());
    await expect(mocks.mutationOptions.mutationFn({ id: 'shelf-1', updates: { status: 'completed' } })).rejects.toThrow('database unavailable');
  });
});
