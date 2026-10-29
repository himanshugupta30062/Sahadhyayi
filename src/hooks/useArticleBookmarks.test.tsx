// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queryOptions: null as null | Record<string, any>,
  mutationOptions: null as null | Record<string, any>,
  responses: [] as Array<{ data?: any; error?: any }>,
  from: vi.fn(),
  invalidateQueries: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: Record<string, any>) => {
    mocks.queryOptions = options;
    return { data: undefined, isLoading: false, error: null };
  },
  useMutation: (options: Record<string, any>) => {
    mocks.mutationOptions = options;
    return { ...options, mutateAsync: options.mutationFn };
  },
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => mocks.toast(...args) }));

import { useIsBookmarked, useMyBookmarks, useToggleBookmark } from './useArticleBookmarks';

const setResponses = (...responses: Array<{ data?: any; error?: any }>) => {
  mocks.responses = responses;
  let callIndex = 0;
  mocks.from.mockImplementation((table: string) => {
    const response = mocks.responses[callIndex++] ?? { data: [], error: null };
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      maybeSingle: vi.fn(() => Promise.resolve(response)),
      then: (resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(response).then(resolve, reject),
    };
    return builder;
  });
};

describe('article bookmark hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queryOptions = null;
    mocks.mutationOptions = null;
    mocks.responses = [];
    mocks.from.mockReset();
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    mocks.toast.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('disables the bookmark query when the article id or signed-in user is missing', () => {
    const { rerender } = renderHook(({ id }) => useIsBookmarked(id), { initialProps: { id: undefined as string | undefined } });
    expect(mocks.queryOptions?.enabled).toBe(false);

    mocks.user = null;
    rerender({ id: 'article-1' });
    expect(mocks.queryOptions?.enabled).toBe(false);
    expect(mocks.queryOptions?.queryKey).toEqual(['article-bookmark', 'article-1', undefined]);
  });

  it('checks bookmark existence for the current reader and propagates query errors', async () => {
    setResponses({ data: { id: 'bookmark-1' }, error: null });
    renderHook(() => useIsBookmarked('article-1'));
    await expect(mocks.queryOptions?.queryFn()).resolves.toBe(true);
    expect(mocks.from).toHaveBeenCalledWith('article_bookmarks');

    setResponses({ data: null, error: null });
    renderHook(() => useIsBookmarked('article-2'));
    await expect(mocks.queryOptions?.queryFn()).resolves.toBe(false);

    const failure = new Error('bookmark query failed');
    setResponses({ data: null, error: failure });
    renderHook(() => useIsBookmarked('article-3'));
    await expect(mocks.queryOptions?.queryFn()).rejects.toBe(failure);
  });

  it('inserts a bookmark and invalidates both bookmark caches on success', async () => {
    setResponses({ data: null, error: null });
    renderHook(() => useToggleBookmark());
    await mocks.mutationOptions?.mutationFn({ articleId: 'article-1', isBookmarked: false });
    await mocks.mutationOptions?.onSuccess(undefined, { articleId: 'article-1', isBookmarked: false });

    expect(mocks.from).toHaveBeenCalledWith('article_bookmarks');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['article-bookmark', 'article-1'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['my-bookmarks'] });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Saved to bookmarks' });
  });

  it('removes an existing bookmark and reports mutation failures', async () => {
    setResponses({ data: null, error: null });
    renderHook(() => useToggleBookmark());
    await mocks.mutationOptions?.mutationFn({ articleId: 'article-2', isBookmarked: true });
    await mocks.mutationOptions?.onSuccess(undefined, { articleId: 'article-2', isBookmarked: true });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Removed from bookmarks' });

    mocks.user = null;
    renderHook(() => useToggleBookmark());
    await expect(mocks.mutationOptions?.mutationFn({ articleId: 'article-2', isBookmarked: false }))
      .rejects.toThrow('Sign in to bookmark articles');

    await mocks.mutationOptions?.onError(new Error('write failed'));
    expect(mocks.toast).toHaveBeenLastCalledWith({
      title: 'Error', description: 'write failed', variant: 'destructive',
    });
  });

  it('returns no bookmarks without querying articles when the user has none', async () => {
    setResponses({ data: [], error: null });
    renderHook(() => useMyBookmarks());
    await expect(mocks.queryOptions?.queryFn()).resolves.toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith('article_bookmarks');
  });

  it('filters unpublished articles, enriches authors and preserves bookmark order', async () => {
    setResponses(
      { data: [{ article_id: 'article-2' }, { article_id: 'article-1' }], error: null },
      { data: [
        { id: 'article-1', user_id: 'author-1', title: 'First', is_published: true },
        { id: 'article-2', user_id: 'author-2', title: 'Second', is_published: true },
      ], error: null },
      { data: [
        { id: 'author-1', full_name: 'Author One', profile_photo_url: 'one.png' },
      ], error: null },
    );
    renderHook(() => useMyBookmarks());
    const result = await mocks.queryOptions?.queryFn();

    expect(result.map((article: any) => article.id)).toEqual(['article-2', 'article-1']);
    expect(result[0]).toMatchObject({ author_name: 'Anonymous', author_avatar: '' });
    expect(result[1]).toMatchObject({ author_name: 'Author One', author_avatar: 'one.png' });
    expect(mocks.from).toHaveBeenNthCalledWith(1, 'article_bookmarks');
    expect(mocks.from).toHaveBeenNthCalledWith(2, 'articles');
    expect(mocks.from).toHaveBeenNthCalledWith(3, 'profiles');
  });

  it('propagates bookmark-list and article-fetch errors', async () => {
    const bookmarkError = new Error('bookmark list failed');
    setResponses({ data: null, error: bookmarkError });
    renderHook(() => useMyBookmarks());
    await expect(mocks.queryOptions?.queryFn()).rejects.toBe(bookmarkError);

    const articleError = new Error('article fetch failed');
    setResponses(
      { data: [{ article_id: 'article-1' }], error: null },
      { data: null, error: articleError },
    );
    renderHook(() => useMyBookmarks());
    await expect(mocks.queryOptions?.queryFn()).rejects.toBe(articleError);
  });
});
