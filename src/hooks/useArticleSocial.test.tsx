// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queries: [] as Array<Record<string, any>>,
  mutation: null as null | Record<string, any>,
  responses: {} as Record<string, Array<{ data?: any; count?: number | null; error?: any }>>,
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
  tableCalls: {} as Record<string, number>,
  from: vi.fn(),
  invalidateQueries: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: Record<string, any>) => {
    mocks.queries.push(options);
    return { data: undefined, isLoading: false, error: null };
  },
  useMutation: (options: Record<string, any>) => {
    mocks.mutation = options;
    return { ...options, mutateAsync: options.mutationFn };
  },
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => mocks.toast(...args) }));

import {
  useArticleLikes,
  useToggleArticleLike,
  useArticleComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useAuthorFollowStatus,
  useToggleFollowAuthor,
} from './useArticleSocial';

function setResponses(responses: Record<string, Array<{ data?: any; count?: number | null; error?: any }>>) {
  mocks.responses = responses;
  mocks.calls = [];
  mocks.tableCalls = {};
  mocks.from.mockImplementation((table: string) => {
    const index = mocks.tableCalls[table] || 0;
    mocks.tableCalls[table] = index + 1;
    const response = mocks.responses[table]?.[index] ?? { data: [], error: null };
    const builder: any = {};
    const chain = (method: string) => (...args: unknown[]) => {
      mocks.calls.push({ table, method, args });
      return builder;
    };
    builder.select = chain('select');
    builder.eq = chain('eq');
    builder.order = chain('order');
    builder.in = chain('in');
    builder.insert = chain('insert');
    builder.update = chain('update');
    builder.delete = chain('delete');
    builder.maybeSingle = () => Promise.resolve(response);
    builder.single = () => Promise.resolve(response);
    builder.then = (resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject);
    return builder;
  });
}

describe('article social hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queries = [];
    mocks.mutation = null;
    mocks.responses = {};
    mocks.calls = [];
    mocks.tableCalls = {};
    mocks.from.mockReset();
    setResponses({});
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    mocks.toast.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('gates article like queries and resolves count plus current-reader state', async () => {
    const { rerender } = renderHook(({ id }) => useArticleLikes(id), {
      initialProps: { id: undefined as string | undefined },
    });
    expect(mocks.queries).toHaveLength(2);
    expect(mocks.queries.every((query) => query.enabled === false)).toBe(true);

    mocks.queries = [];
    rerender({ id: 'article-1' });
    expect(mocks.queries[0].enabled).toBe(true);
    expect(mocks.queries[1].enabled).toBe(true);
    mocks.responses = { article_likes: [{ count: 7, error: null }, { data: { id: 'like-1' }, error: null }] };
    await expect(mocks.queries[0].queryFn()).resolves.toBe(7);
    await expect(mocks.queries[1].queryFn()).resolves.toBe(true);
    expect(mocks.calls).toContainEqual({ table: 'article_likes', method: 'eq', args: ['article_id', 'article-1'] });
    expect(mocks.calls).toContainEqual({ table: 'article_likes', method: 'eq', args: ['user_id', 'reader-1'] });
  });

  it('returns zero and false for absent like data and propagates query errors', async () => {
    mocks.user = null;
    renderHook(() => useArticleLikes('article-1'));
    expect(mocks.queries[1].enabled).toBe(false);
    mocks.responses = { article_likes: [{ count: null, error: null }] };
    await expect(mocks.queries[0].queryFn()).resolves.toBe(0);
    const failure = new Error('likes unavailable');
    mocks.responses = { article_likes: [{ count: null, error: failure }] };\n    mocks.tableCalls = {};
    await expect(mocks.queries[0].queryFn()).rejects.toBe(failure);
  });

  it('requires authentication and toggles article likes in both directions', async () => {
    renderHook(() => useToggleArticleLike());
    await expect(mocks.mutation?.mutationFn({ articleId: 'a-1', hasLiked: false }))
      .rejects.toThrow('Sign in to like articles');

    mocks.user = { id: 'reader-1' };
    mocks.responses = { article_likes: [{ data: null, error: null }, { data: null, error: null }] };
    await mocks.mutation?.mutationFn({ articleId: 'a-1', hasLiked: false });
    await mocks.mutation?.mutationFn({ articleId: 'a-1', hasLiked: true });
    expect(mocks.calls).toContainEqual({ table: 'article_likes', method: 'insert', args: [{ article_id: 'a-1', user_id: 'reader-1' }] });
    expect(mocks.calls).toContainEqual({ table: 'article_likes', method: 'delete', args: [] });
    await mocks.mutation?.onSuccess(undefined, { articleId: 'a-1', hasLiked: true });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['article-likes', 'a-1'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['articles'] });
    await mocks.mutation?.onError(new Error('like failed'));
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Error', description: 'like failed', variant: 'destructive' });
  });

  it('loads comments with profile names and anonymous fallbacks', async () => {
    renderHook(() => useArticleComments('article-1'));
    mocks.responses = {
      article_comments: [{ data: [
        { id: 'c-1', user_id: 'u-1', content: 'Hello' },
        { id: 'c-2', user_id: 'u-2', content: 'Hi' },
      ], error: null }],
      profiles: [{ data: [{ id: 'u-1', full_name: 'Reader One', profile_photo_url: 'one.png' }], error: null }],
    };
    const comments = await mocks.queries[0].queryFn();
    expect(comments).toEqual([
      expect.objectContaining({ id: 'c-1', author_name: 'Reader One', author_avatar: 'one.png' }),
      expect.objectContaining({ id: 'c-2', author_name: 'Anonymous', author_avatar: '' }),
    ]);
    expect(mocks.calls).toContainEqual({ table: 'profiles', method: 'in', args: ['id', ['u-1', 'u-2']] });
  });

  it('returns an empty comment list without a profile query and propagates comment errors', async () => {
    renderHook(() => useArticleComments(undefined));
    expect(mocks.queries[0].enabled).toBe(false);
    mocks.responses = { article_comments: [{ data: [], error: null }] };
    await expect(mocks.queries[0].queryFn()).resolves.toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    const failure = new Error('comments unavailable');
    mocks.responses = { article_comments: [{ data: null, error: failure }] };\n    mocks.tableCalls = {};
    await expect(mocks.queries[0].queryFn()).rejects.toBe(failure);
  });

  it('creates comments, rejects anonymous writes and invalidates the article comment cache', async () => {
    renderHook(() => useCreateComment());
    await expect(mocks.mutation?.mutationFn({ articleId: 'a-1', content: 'Hello' }))
      .rejects.toThrow('Sign in to comment');
    mocks.user = { id: 'reader-1' };
    const created = { id: 'c-1', article_id: 'a-1', content: 'Hello' };
    mocks.responses = { article_comments: [{ data: created, error: null }] };
    await expect(mocks.mutation?.mutationFn({ articleId: 'a-1', content: 'Hello', parentId: 'c-0' }))
      .resolves.toEqual(created);
    expect(mocks.calls).toContainEqual({
      table: 'article_comments', method: 'insert',
      args: [{ article_id: 'a-1', user_id: 'reader-1', content: 'Hello', parent_id: 'c-0' }],
    });
    await mocks.mutation?.onSuccess(undefined, { articleId: 'a-1' });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['article-comments', 'a-1'] });
    await mocks.mutation?.onError(new Error('post failed'));
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Error posting comment', description: 'post failed', variant: 'destructive' });
  });

  it('updates and deletes comments then invalidates their article cache', async () => {
    renderHook(() => useUpdateComment());
    mocks.responses = { article_comments: [{ data: null, error: null }] };
    await expect(mocks.mutation?.mutationFn({ commentId: 'c-1', articleId: 'a-1', content: 'Edited' }))
      .resolves.toBe('a-1');
    expect(mocks.calls).toContainEqual({ table: 'article_comments', method: 'update', args: [{ content: 'Edited', updated_at: expect.any(String) }] });
    await mocks.mutation?.onSuccess('a-1');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['article-comments', 'a-1'] });
    await mocks.mutation?.onError(new Error('edit failed'));
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Error updating comment', description: 'edit failed', variant: 'destructive' });

    renderHook(() => useDeleteComment());
    await mocks.mutation?.mutationFn({ commentId: 'c-1', articleId: 'a-1' });
    await mocks.mutation?.onSuccess('a-1');
    expect(mocks.calls).toContainEqual({ table: 'article_comments', method: 'delete', args: [] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['article-comments', 'a-1'] });
  });

  it('gates author-follow queries and reads follower count and follow state', async () => {
    mocks.user = null;
    const { rerender } = renderHook(({ id }) => useAuthorFollowStatus(id), {
      initialProps: { id: undefined as string | undefined },
    });
    expect(mocks.queries.every((query) => !query.enabled)).toBe(true);
    mocks.queries = [];
    mocks.user = { id: 'reader-1' };
    rerender({ id: 'author-1' });
    mocks.responses = { article_author_followers: [{ count: 4, error: null }, { data: { id: 'f-1' }, error: null }] };
    await expect(mocks.queries[0].queryFn()).resolves.toBe(4);
    await expect(mocks.queries[1].queryFn()).resolves.toBe(true);
  });

  it('requires authentication to follow and supports unfollow, cache invalidation and errors', async () => {
    renderHook(() => useToggleFollowAuthor());
    await expect(mocks.mutation?.mutationFn({ authorUserId: 'author-1', isFollowing: false }))
      .rejects.toThrow('Sign in to follow authors');
    mocks.user = { id: 'reader-1' };
    mocks.responses = { article_author_followers: [{ data: null, error: null }, { data: null, error: null }] };
    await mocks.mutation?.mutationFn({ authorUserId: 'author-1', isFollowing: false });
    await mocks.mutation?.mutationFn({ authorUserId: 'author-1', isFollowing: true });
    expect(mocks.calls).toContainEqual({
      table: 'article_author_followers', method: 'insert',
      args: [{ author_user_id: 'author-1', follower_user_id: 'reader-1' }],
    });
    await mocks.mutation?.onSuccess(undefined, { authorUserId: 'author-1' });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['author-followers', 'author-1'] });
    await mocks.mutation?.onError(new Error('follow failed'));
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Error', description: 'follow failed', variant: 'destructive' });
  });
});
