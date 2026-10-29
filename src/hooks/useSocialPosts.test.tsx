// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  hookPosts: [] as any[],
  queryOptions: null as null | Record<string, any>,
  responses: {} as Record<string, Array<{ data?: any; error?: any }>>,
  tableCalls: {} as Record<string, number>,
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
  },
}));

vi.mock('@/lib/realtime', () => ({
  uniqueChannelName: (name: string) => name,
}));

vi.mock('@/lib/socialPostMedia', () => ({
  getPrivateSocialPostMediaPath: vi.fn(),
  resolveSocialPostImages: async (posts: any[]) => posts,
}));

import { useSocialPosts } from './useSocialPosts';

const setResponses = (responses: Record<string, Array<{ data?: any; error?: any }>>) => {
  mocks.responses = responses;
  mocks.tableCalls = {};
  mocks.from.mockImplementation((table: string) => {
    const index = mocks.tableCalls[table] || 0;
    mocks.tableCalls[table] = index + 1;
    const response = mocks.responses[table]?.[index] ?? { data: [], error: null };
    const builder: any = {
      select: () => builder,
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
});
