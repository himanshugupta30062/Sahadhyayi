// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; email?: string; user_metadata?: Record<string, any> },
  hookPosts: [] as any[],
  queryOptions: null as null | Record<string, any>,
  responses: {} as Record<string, Array<{ data?: any; error?: any }>>,
  tableCalls: {} as Record<string, number>,
  insertCalls: [] as Array<{ table: string; args: unknown[] }>,
  upsertCalls: [] as Array<{ table: string; args: unknown[] }>,
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: Record<string, any>) => {
    mocks.queryOptions = options;
    return {
      data: mocks.hookPosts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useMutation: (options: Record<string, any>) => ({ ...options, mutate: vi.fn(), mutateAsync: vi.fn() }),
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
    setQueryData: mocks.setQueryData,
  }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
    channel: (...args: unknown[]) => mocks.channel(...args),
    removeChannel: (...args: unknown[]) => mocks.removeChannel(...args),
    storage: { from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({ error: null }) })) },
  },
}));

vi.mock('@/lib/realtime', () => ({
  uniqueChannelName: (name: string) => name,
}));

vi.mock('@/lib/socialPostMedia', () => ({
  getPrivateSocialPostMediaPath: vi.fn(),
  resolveSocialPostImages: async (posts: any[]) => posts,
}));

import { useSocialPosts, useCreatePost, useTogglePostLike, usePostComments, useCreateComment, useToggleRepost, useToggleCommentLike, useDeletePost } from './useSocialPosts';

const setResponses = (responses: Record<string, Array<{ data?: any; error?: any }>>) => {
  mocks.responses = responses;
  mocks.tableCalls = {};
  mocks.insertCalls = [];
  mocks.upsertCalls = [];
  mocks.from.mockImplementation((table: string) => {
    const index = mocks.tableCalls[table] || 0;
    mocks.tableCalls[table] = index + 1;
    const response = mocks.responses[table]?.[index] ?? { data: [], error: null };
    const builder: any = {
      select: () => builder,
      insert: (...args: unknown[]) => { mocks.insertCalls.push({ table, args }); return builder; },
      upsert: (...args: unknown[]) => { mocks.upsertCalls.push({ table, args }); return builder; },
      delete: () => builder,
      update: () => builder,
      maybeSingle: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => builder,
      not: () => builder,
      or: () => builder,
      single: () => Promise.resolve(response),
      then: (resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(response).then(resolve, reject),
    };
    return builder;
  });
};

const post = (overrides: Record<string, any> = {}) => ({
  id: 'post-1',
  user_id: 'author-1',
  content: 'A thoughtful note about books',
  created_at: '2026-10-29T09:00:00.000Z',
  updated_at: '2026-10-29T09:00:00.000Z',
  likes_count: 0,
  comments_count: 0,
  profiles: { id: 'author-1', full_name: 'Reader One', username: 'readerone' },
  books_library: null,
  repost_of_id: null,
  ...overrides,
});

describe('useSocialPosts', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.hookPosts = [];
    mocks.queryOptions = null;
    mocks.responses = {};
    mocks.tableCalls = {};
    mocks.from.mockReset();
    mocks.channel.mockReset().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    });
    mocks.removeChannel.mockReset().mockResolvedValue(undefined);
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    mocks.setQueryData.mockReset();
    mocks.toast.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('returns an empty following feed without querying posts when the reader follows nobody', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({ user_follows: [{ data: [], error: null }] });
    renderHook(() => useSocialPosts('following'));

    await expect(mocks.queryOptions?.queryFn()).resolves.toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith('user_follows');
  });

  it('returns community posts enriched with the signed-in reader’s like and repost state', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({
      posts: [
        { data: [post()], error: null },
        { data: [{ repost_of_id: 'post-1' }], error: null },
      ],
      post_likes: [{ data: [{ post_id: 'post-1' }], error: null }],
    });
    renderHook(() => useSocialPosts('community'));

    const result = await mocks.queryOptions?.queryFn();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'post-1',
      profiles: { full_name: 'Reader One' },
      user_liked: true,
      user_reposted: true,
    });
    expect(mocks.from).toHaveBeenCalledWith('posts');
    expect(mocks.from).toHaveBeenCalledWith('post_likes');
  });

  it('returns an empty community feed without issuing enrichment queries', async () => {
    setResponses({ posts: [{ data: [], error: null }] });
    renderHook(() => useSocialPosts('community'));

    await expect(mocks.queryOptions?.queryFn()).resolves.toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it('uses the plain-post fallback when relational embeds fail', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setResponses({
      posts: [
        { data: null, error: new Error('relationship embed unavailable') },
        { data: [post({ profiles: null })], error: null },
      ],
      public_profiles: [{ data: [{ id: 'author-1', full_name: 'Fallback Reader' }], error: null }],
    });
    renderHook(() => useSocialPosts('community'));

    const result = await mocks.queryOptions?.queryFn();

    expect(warning).toHaveBeenCalledWith(
      'Posts fetch with relations failed, attempting plain fallback:',
      expect.any(Error),
    );
    expect(result[0].profiles).toMatchObject({ full_name: 'Fallback Reader' });
  });

  it('throws when both relational and plain post queries fail', async () => {
    const error = new Error('posts unavailable');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    setResponses({
      posts: [
        { data: null, error: new Error('relationship embed unavailable') },
        { data: null, error },
      ],
    });
    renderHook(() => useSocialPosts('community'));

    await expect(mocks.queryOptions?.queryFn()).rejects.toThrow('posts unavailable');
    expect(log).toHaveBeenCalledWith('Plain posts fallback also failed:', error);
    expect(log).toHaveBeenCalledWith('Unexpected error fetching social posts:', error);
  });

  it('stops load-more immediately when the current feed is empty', async () => {
    const { result } = renderHook(() => useSocialPosts('community'));

    await result.current.loadMore();

    expect(mocks.from).not.toHaveBeenCalled();
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('normalizes and creates a post with safe nullable fields', async () => {
    mocks.user = { id: 'reader-1', email: 'reader@example.com', user_metadata: {} };
    const created = post({ id: 'created-1', content: 'Hello community' });
    setResponses({
      profiles: [{ data: { id: 'reader-1' }, error: null }],
      posts: [{ data: created, error: null }],
    });
    const { result } = renderHook(() => useCreatePost());

    const createdPost = await (result.current as any).mutationFn({
      content: '  Hello community  ',
      book_id: '  ',
      image_url: ' ',
      image_alt: ' cover description ',
      audience: undefined,
    });

    expect(createdPost.id).toBe('created-1');
    const insert = mocks.insertCalls.find((call) => call.table === 'posts');
    expect(insert?.args[0]).toMatchObject({
      content: 'Hello community',
      user_id: 'reader-1',
      post_kind: 'post',
      book_id: null,
      image_url: null,
      image_alt: 'cover description',
      audience: 'friends',
    });
  });

  it('rejects quote cards with missing or oversized quotations', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({ profiles: [{ data: { id: 'reader-1' }, error: null }] });
    const { result } = renderHook(() => useCreatePost());

    await expect((result.current as any).mutationFn({
      content: 'A quote',
      post_kind: 'quote',
      quote_text: '   ',
    })).rejects.toThrow('A quote card needs a quotation between 1 and 500 characters.');
    await expect((result.current as any).mutationFn({
      content: 'A quote',
      post_kind: 'quote',
      quote_text: 'q'.repeat(501),
    })).rejects.toThrow('A quote card needs a quotation between 1 and 500 characters.');
    expect(mocks.insertCalls).toHaveLength(0);
  });

  it('rejects post creation and likes when there is no signed-in reader', async () => {
    setResponses({});
    const create = renderHook(() => useCreatePost());
    await expect((create.result.current as any).mutationFn({ content: 'Hello' })).rejects.toThrow('Not authenticated');
    create.unmount();

    const like = renderHook(() => useTogglePostLike());
    await expect((like.result.current as any).mutationFn({ postId: 'post-1', isLiked: false })).rejects.toThrow('Not authenticated');
  });

  it('counts comment likes and marks the current reader’s liked comments', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({
      post_comments: [{ data: [{ id: 'comment-1', content: 'Nice thought' }], error: null }],
      post_comment_likes: [
        { data: [{ comment_id: 'comment-1' }, { comment_id: 'comment-1' }], error: null },
        { data: [{ comment_id: 'comment-1' }], error: null },
      ],
    });
    renderHook(() => usePostComments('post-1'));

    const comments = await mocks.queryOptions?.queryFn();

    expect(comments).toEqual([{
      id: 'comment-1',
      content: 'Nice thought',
      likes_count: 2,
      user_liked: true,
    }]);
  });

  it('creates a comment and stores its parent reply reference', async () => {
    mocks.user = { id: 'reader-1' };
    const created = { id: 'comment-2', post_id: 'post-1', parent_comment_id: 'comment-1', content: 'Reply' };
    setResponses({ post_comments: [{ data: created, error: null }] });
    const { result } = renderHook(() => useCreateComment());

    await expect((result.current as any).mutationFn({
      postId: 'post-1',
      content: 'Reply',
      parentCommentId: 'comment-1',
    })).resolves.toEqual(created);
    expect(mocks.insertCalls[0]).toMatchObject({
      table: 'post_comments',
      args: [[{
        post_id: 'post-1',
        content: 'Reply',
        user_id: 'reader-1',
        parent_comment_id: 'comment-1',
      }]],
    });
  });

  it('creates a repost of the original post and trims optional commentary', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({ posts: [{ data: null, error: null }] });
    const { result } = renderHook(() => useToggleRepost());

    await expect((result.current as any).mutationFn({
      post: post({ repost_of_id: 'original-1' }),
      isReposted: false,
      comment: '  Worth reading  ',
    })).resolves.toEqual({ targetId: 'original-1', isReposted: true });
    expect(mocks.insertCalls[0]).toMatchObject({
      table: 'posts',
      args: [{
        user_id: 'reader-1',
        content: 'Worth reading',
        repost_of_id: 'original-1',
      }],
    });
  });

  it('toggles comment likes and deletes a post only after confirming ownership', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({ post_comment_likes: [{ data: null, error: null }] });
    const commentLike = renderHook(() => useToggleCommentLike('post-1'));
    await expect((commentLike.result.current as any).mutationFn({
      commentId: 'comment-1',
      isLiked: false,
    })).resolves.toEqual({ commentId: 'comment-1', isLiked: true });
    commentLike.unmount();

    setResponses({
      posts: [
        { data: { image_url: null }, error: null },
        { data: null, error: null },
      ],
    });
    const deletion = renderHook(() => useDeletePost());
    await expect((deletion.result.current as any).mutationFn('post-1')).resolves.toBe('post-1');
    expect(mocks.from).toHaveBeenCalledWith('posts');
  });

});
