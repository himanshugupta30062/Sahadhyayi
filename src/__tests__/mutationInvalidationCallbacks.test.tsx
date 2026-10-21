/** @vitest-environment jsdom */

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mutationConfigs,
  invalidateQueries,
  setQueryData,
  setQueriesData,
  toast,
  sonnerToast,
  mockAuthUser,
} = vi.hoisted(() => ({
  mutationConfigs: [] as any[],
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  setQueryData: vi.fn(),
  setQueriesData: vi.fn(),
  toast: vi.fn(),
  sonnerToast: { success: vi.fn(), error: vi.fn() },
  mockAuthUser: { user: { id: 'reader-1', email: 'reader@example.com', user_metadata: { full_name: 'Reader' } } as any },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries, setQueryData, setQueriesData }),
  useQuery: vi.fn(() => ({ data: [], isLoading: false, isPending: false, error: null, refetch: vi.fn() })),
  useMutation: vi.fn((config: any) => {
    mutationConfigs.push(config);
    return {
      ...config,
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      isLoading: false,
      isSuccess: false,
      isError: false,
      reset: vi.fn(),
    };
  }),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => mockAuthUser,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), auth: { getUser: vi.fn() } },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: { getUser: vi.fn() },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/hooks/use-toast', () => ({ toast }));
vi.mock('sonner', () => ({ toast: sonnerToast }));

import {
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from '@/hooks/useArticles';
import {
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/useComments';
import {
  useCreateMarginNoteReply,
  useCreateMarginNote,
  useDeleteMarginNote,
  useToggleMarginReaction,
} from '@/hooks/useMarginNotes';
import {
  useCreateSpoilerThreadComment,
  useUnlockChapter,
} from '@/hooks/useSpoilerThreads';
import {
  useCreatePost,
  useCreateComment,
  useToggleRepost,
  useDeletePost,
} from '@/hooks/useSocialPosts';

async function invokeSuccess(
  hook: () => unknown,
  args: unknown[] = [],
): Promise<void> {
  mutationConfigs.length = 0;
  const { unmount } = renderHook(hook);
  expect(mutationConfigs).toHaveLength(1);
  const callback = mutationConfigs[0].onSuccess;
  expect(callback).toBeTypeOf('function');
  await act(async () => {
    await callback(...args);
  });
  unmount();
}

describe('mutation success callbacks safely invalidate caches', () => {
  beforeEach(() => {
    mutationConfigs.length = 0;
    invalidateQueries.mockClear();
    setQueryData.mockClear();
    setQueriesData.mockClear();
    toast.mockClear();
    sonnerToast.success.mockClear();
    sonnerToast.error.mockClear();
    mockAuthUser.user = { id: 'reader-1', email: 'reader@example.com', user_metadata: { full_name: 'Reader' } };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates article list after create, update, and delete', async () => {
    for (const hook of [useCreateArticle, useUpdateArticle, useDeleteArticle]) {
      await invokeSuccess(hook);
    }

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['articles'] }],
      [{ queryKey: ['articles'] }],
      [{ queryKey: ['articles'] }],
    ]);
  });

  it('invalidates the matching comment list after add, update, and delete', async () => {
    await invokeSuccess(useAddComment, [undefined, { postId: 'post-1' }]);
    await invokeSuccess(useUpdateComment, [{ postId: 'post-1' }]);
    await invokeSuccess(useDeleteComment, [{ postId: 'post-1' }]);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['comments', 'post-1'] }],
      [{ queryKey: ['comments', 'post-1'] }],
      [{ queryKey: ['comments', 'post-1'] }],
    ]);
  });

  it('refreshes margin-note replies and note feeds after successful mutations', async () => {
    await invokeSuccess(useCreateMarginNoteReply, [undefined, { noteId: 'note-1' }]);
    await invokeSuccess(useCreateMarginNote);
    await invokeSuccess(useDeleteMarginNote);
    await invokeSuccess(useToggleMarginReaction);

    expect(invalidateQueries).toHaveBeenCalledTimes(5);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['margin-note-replies', 'note-1'] }],
      [{ queryKey: ['margin-notes'] }],
      [{ queryKey: ['margin-notes'] }],
      [{ queryKey: ['margin-notes'] }],
      [{ queryKey: ['margin-notes'] }],
    ]);
  });

  it('refreshes spoiler comments and thread feeds after successful mutations', async () => {
    await invokeSuccess(useCreateSpoilerThreadComment, [undefined, { thread_id: 'thread-1' }]);
    await invokeSuccess(useUnlockChapter);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['spoiler-thread-comments', 'thread-1'] }],
      [{ queryKey: ['spoiler-threads'] }],
    ]);
  });

  it('refreshes social feeds after post, comment, repost, and delete success callbacks', async () => {
    await invokeSuccess(useCreatePost, [{ id: 'post-1', user_id: 'reader-1' }]);
    await invokeSuccess(useCreateComment, [undefined, { postId: 'post-1' }]);
    await invokeSuccess(useToggleRepost, [{ isReposted: true }]);
    await invokeSuccess(useDeletePost, ['post-1']);

    expect(invalidateQueries).toHaveBeenCalledTimes(5);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['social-posts'] }],
      [{ queryKey: ['post-comments', 'post-1'] }],
      [{ queryKey: ['social-posts'] }],
      [{ queryKey: ['social-posts'] }],
      [{ queryKey: ['social-posts'] }],
    ]);
    expect(setQueryData).toHaveBeenCalled();
    expect(setQueriesData).toHaveBeenCalled();
  });
});
