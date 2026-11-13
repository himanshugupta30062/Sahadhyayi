// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; email?: string; user_metadata?: Record<string, any> },
  hookPosts: [] as any[],
  queryOptions: null as null | Record<string, any>,
  responses: {} as Record<string, Array<{ data?: any; error?: any }>>,
  tableCalls: {} as Record<string, number>,
  insertCalls: [] as Array<{ table: string; args: unknown[] }>,
  upsertCalls: [] as Array<{ table: string; args: unknown[] }>,
  filterCalls: [] as Array<{ table: string; method: string; args: unknown[] }>,
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
  mocks.filterCalls = [];
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
      eq: (...args: unknown[]) => { mocks.filterCalls.push({ table, method: 'eq', args }); return builder; },
      in: (...args: unknown[]) => { mocks.filterCalls.push({ table, method: 'in', args }); return builder; },
      or: (...args: unknown[]) => { mocks.filterCalls.push({ table, method: 'or', args }); return builder; },
      order: () => builder,
      range: (...args: unknown[]) => { mocks.filterCalls.push({ table, method: 'range', args }); return builder; },
      limit: () => builder,
      not: () => builder,
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

  it('builds For You from followed readers and books on the reader shelf', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({
      user_follows: [{ data: [{ following_id: 'reader-2' }], error: null }],
      user_bookshelf: [{ data: [{ book_id: 'book-1' }], error: null }],
      posts: [{ data: [post({ book_id: 'book-1' })], error: null }],
      post_likes: [{ data: [], error: null }],
    });
    renderHook(() => useSocialPosts('for_you'));

    const result = await mocks.queryOptions?.queryFn();

    expect(result).toHaveLength(1);
    expect(mocks.from).toHaveBeenCalledWith('user_follows');
    expect(mocks.from).toHaveBeenCalledWith('user_bookshelf');
    expect(mocks.filterCalls).toContainEqual({
      table: 'posts',
      method: 'or',
      args: ['user_id.eq.reader-1,user_id.in.(reader-2),book_id.in.(book-1)'],
    });
  });

  it('loads every follow page for For You instead of silently truncating at 500', async () => {
    mocks.user = { id: 'reader-1' };
    const firstFollowPage = Array.from({ length: 500 }, (_, index) => ({
      following_id: `reader-${String(index + 2).padStart(4, '0')}`,
    }));
    const lastFollowPage = [
      { following_id: 'reader-0502' },
      { following_id: 'reader-0503' },
    ];
    setResponses({
      user_follows: [
        { data: firstFollowPage, error: null },
        { data: lastFollowPage, error: null },
      ],
      user_bookshelf: [{ data: [], error: null }],
      posts: [{ data: [], error: null }],
    });
    renderHook(() => useSocialPosts('for_you'));

    await expect(mocks.queryOptions?.queryFn()).resolves.toEqual([]);

    expect(mocks.filterCalls).toContainEqual({
      table: 'user_follows',
      method: 'range',
      args: [0, 499],
    });
    expect(mocks.filterCalls).toContainEqual({
      table: 'user_follows',
      method: 'range',
      args: [500, 999],
    });
    const postFilter = mocks.filterCalls.find(
      (call) => call.table === 'posts' && call.method === 'or',
    )?.args[0] as string;
    expect(postFilter).toContain('reader-0503');
  });

  it('keeps a reader’s own posts eligible when they have no follow or shelf signals', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({
      user_follows: [{ data: [], error: null }],
      user_bookshelf: [{ data: [], error: null }],
      posts: [{ data: [], error: null }],
    });
    renderHook(() => useSocialPosts('for_you'));

    await expect(mocks.queryOptions?.queryFn()).resolves.toEqual([]);
    expect(mocks.from).toHaveBeenCalledWith('posts');
    expect(mocks.filterCalls).toContainEqual({
      table: 'posts',
      method: 'or',
      args: ['user_id.eq.reader-1'],
    });
  });

  it('applies For You match signals and the stable cursor together when loading older posts', async () => {
    mocks.user = { id: 'reader-1' };
    const firstPage = Array.from({ length: 25 }, (_, index) =>
      post({
        id: `post-${index + 1}`,
        created_at: new Date(Date.UTC(2026, 10, 8, 0, 0, 25 - index)).toISOString(),
      }),
    );
    mocks.hookPosts = firstPage;
    const cursor = firstPage[firstPage.length - 1];
    const olderPost = post({
      id: 'post-26',
      user_id: 'reader-2',
      book_id: 'book-1',
      created_at: '2026-11-07T23:59:00.000Z',
    });

    setResponses({
      user_follows: [{ data: [{ following_id: 'reader-2' }], error: null }],
      user_bookshelf: [{ data: [{ book_id: 'book-1' }], error: null }],
      posts: [
        { data: [olderPost], error: null },
        { data: [], error: null },
      ],
      post_likes: [{ data: [], error: null }],
    });

    const { result } = renderHook(() => useSocialPosts('for_you'));
    await result.current.loadMore();

    const pageFilter = mocks.filterCalls.find(
      (call) => call.table === 'posts' && call.method === 'or',
    )?.args[0] as string;

    expect(pageFilter).toContain('and(or(user_id.eq.reader-1,user_id.in.(reader-2),book_id.in.(book-1))');
    expect(pageFilter).toContain(`created_at.lt.${cursor.created_at}`);
    expect(pageFilter).toContain(`id.lt.${cursor.id}`);
    expect(mocks.setQueryData).toHaveBeenCalled();
  });

  it('keeps Latest chronological and does not query personalization signals', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({ posts: [{ data: [post()], error: null }] });
    renderHook(() => useSocialPosts('latest'));

    await mocks.queryOptions?.queryFn();

    expect(mocks.from).toHaveBeenCalledWith('posts');
    expect(mocks.from).not.toHaveBeenCalledWith('user_follows');
    expect(mocks.from).not.toHaveBeenCalledWith('user_bookshelf');
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

  it('attaches a book when book_id is a valid UUID and supports public visibility', async () => {
    mocks.user = { id: 'reader-1' };
    const validBookUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const created = post({ id: 'created-2', content: 'Reading this masterpiece', book_id: validBookUuid, audience: 'public' });
    setResponses({
      profiles: [{ data: { id: 'reader-1' }, error: null }],
      posts: [{ data: created, error: null }],
    });
    const { result } = renderHook(() => useCreatePost());

    const createdPost = await (result.current as any).mutationFn({
      content: 'Reading this masterpiece',
      book_id: validBookUuid,
      audience: 'public',
    });

    expect(createdPost.id).toBe('created-2');
    const insert = mocks.insertCalls.find((call) => call.table === 'posts');
    expect(insert?.args[0]).toMatchObject({
      content: 'Reading this masterpiece',
      user_id: 'reader-1',
      book_id: validBookUuid,
      audience: 'public',
    });
  });

  it('omits non-UUID book IDs to protect against PostgreSQL UUID syntax errors', async () => {
    mocks.user = { id: 'reader-1' };
    const nonUuidGoogleBooksId = 'zyTCAlFPjgYC';
    const created = post({ id: 'created-3', content: 'External search book', book_id: null });
    setResponses({
      profiles: [{ data: { id: 'reader-1' }, error: null }],
      posts: [{ data: created, error: null }],
    });
    const { result } = renderHook(() => useCreatePost());

    const createdPost = await (result.current as any).mutationFn({
      content: 'External search book',
      book_id: nonUuidGoogleBooksId,
      audience: 'friends',
    });

    expect(createdPost.id).toBe('created-3');
    const insert = mocks.insertCalls.find((call) => call.table === 'posts');
    expect(insert?.args[0]).toMatchObject({
      content: 'External search book',
      book_id: null,
      audience: 'friends',
    });
  });

  it('retries with baseline columns and formats quote text when DB lacks extended columns (42703)', async () => {
    mocks.user = { id: 'reader-1' };
    const createdFallback = post({
      id: 'created-fallback',
      content: '“Never forget what you are.” — Tyrion Lannister\n\nDeeply moving passage',
    });

    setResponses({
      profiles: [{ data: { id: 'reader-1' }, error: null }],
      posts: [
        { data: null, error: { code: '42703', message: 'column posts.post_kind does not exist' } },
        { data: createdFallback, error: null },
      ],
    });
    const { result } = renderHook(() => useCreatePost());

    const createdPost = await (result.current as any).mutationFn({
      content: 'Deeply moving passage',
      post_kind: 'quote',
      quote_text: 'Never forget what you are.',
      quote_author: 'Tyrion Lannister',
    });

    expect(createdPost.id).toBe('created-fallback');
    expect(mocks.insertCalls.filter((c) => c.table === 'posts')).toHaveLength(2);
    const retryInsert = mocks.insertCalls.filter((c) => c.table === 'posts')[1];
    expect(retryInsert.args[0]).toMatchObject({
      content: '“Never forget what you are.” — Tyrion Lannister\n\nDeeply moving passage',
      user_id: 'reader-1',
    });
    expect((retryInsert.args[0] as any).post_kind).toBeUndefined();
  });

  it('normalizes foreign key violation error into a helpful user message', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({
      profiles: [{ data: { id: 'reader-1' }, error: null }],
      posts: [{ data: null, error: { code: '23503', message: 'violates foreign key constraint' } }],
    });
    const { result } = renderHook(() => useCreatePost());

    await expect((result.current as any).mutationFn({
      content: 'Post with missing reference',
    })).rejects.toThrow('The referenced book or profile could not be found. Please try again.');
  });

  it('useTogglePostLike toggles like and unlike states properly', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({
      post_likes: [
        { data: null, error: null }, // for like insert
        { data: null, error: null }, // for unlike delete
      ],
    });

    const { result } = renderHook(() => useTogglePostLike());

    // 1. Like post (isLiked is false -> likes it)
    const likeRes = await (result.current as any).mutationFn({ postId: 'post-1', isLiked: false });
    expect(likeRes).toEqual({ postId: 'post-1', isLiked: true });

    // 2. Unlike post (isLiked is true -> unlikes it)
    const unlikeRes = await (result.current as any).mutationFn({ postId: 'post-1', isLiked: true });
    expect(unlikeRes).toEqual({ postId: 'post-1', isLiked: false });
  });

  it('useToggleRepost handles reposting and removing repost', async () => {
    mocks.user = { id: 'reader-1' };
    setResponses({
      posts: [
        { data: { id: 'repost-1', user_id: 'reader-1', repost_of_id: 'post-1' }, error: null }, // insert repost
        { data: { id: 'repost-existing' }, error: null }, // find existing for deletion
      ],
    });

    const { result } = renderHook(() => useToggleRepost());

    // 1. Repost when not yet reposted
    const repostRes = await (result.current as any).mutationFn({
      post: { id: 'post-1' },
      isReposted: false,
      comment: 'Must read!',
    });
    expect(repostRes).toEqual({ targetId: 'post-1', isReposted: true });

    // 2. Undo repost when already reposted
    const undoRes = await (result.current as any).mutationFn({
      post: { id: 'post-1' },
      isReposted: true,
    });
    expect(undoRes).toEqual({ targetId: 'post-1', isReposted: false });
  });

  it('usePostComments queries comments for a given post', async () => {
    const mockComments = [
      { id: 'c1', post_id: 'post-1', user_id: 'user-2', content: 'Great review!', created_at: '2026-01-01' },
    ];
    setResponses({
      post_comments: [{ data: mockComments, error: null }],
      comment_likes: [{ data: [], error: null }],
    });

    renderHook(() => usePostComments('post-1'));
    const comments = await mocks.queryOptions?.queryFn();
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Great review!');
  });

  it('resolves reposted posts in social feed when present', async () => {
    mocks.user = { id: 'reader-1' };
    const origPost = post({ id: 'orig-1', user_id: 'orig-user', content: 'Original thought' });
    const repostPost = post({ id: 'repost-1', user_id: 'reader-1', content: 'Check this out', repost_of_id: 'orig-1' });

    setResponses({
      posts: [
        { data: [repostPost], error: null },
        { data: [origPost], error: null },
      ],
      profiles: [{ data: [{ id: 'orig-user', full_name: 'Author Reader' }], error: null }],
      books_library: [{ data: [], error: null }],
    });

    renderHook(() => useSocialPosts('latest'));
    const feed = await mocks.queryOptions?.queryFn();
    expect(feed[0].reposted_post).toBeDefined();
    expect(feed[0].reposted_post?.content).toBe('Original thought');
  });

});
