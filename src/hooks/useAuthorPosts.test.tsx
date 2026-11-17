// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queryResults: {} as Record<string, { data: any; error: any }>,
  mutationResults: {} as Record<string, Record<string, { data: any; error: any }>>,
  singleResult: { data: null as any, error: null as any },
  existingReactionResult: { data: null as any, error: null as any },
  from: vi.fn(),
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
  invalidations: [] as unknown[],
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (table: string) => mocks.from(table) },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import {
  useAuthorPosts,
  useFollowedAuthorsPosts,
  useCreatePost,
  usePostComments,
  useAddComment,
  usePostReactions,
  useToggleReaction,
} from './useAuthorPosts';

function renderWithClient<T,>(callback: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = queryClient.invalidateQueries.bind(queryClient);
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation((...args: any[]) => {
    mocks.invalidations.push(args[0]);
    return invalidate(args[0]);
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(callback, { wrapper });
}

describe('author post hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'author-1' };
    mocks.queryResults = {};
    mocks.mutationResults = {};
    mocks.singleResult = { data: { id: 'created-1' }, error: null };
    mocks.existingReactionResult = { data: null, error: null };
    mocks.calls = [];
    mocks.invalidations = [];
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();

    mocks.from.mockReset().mockImplementation((table: string) => {
      let operation: string | null = null;
      const builder: Record<string, any> = {};
      for (const method of ['select', 'eq', 'order', 'in', 'limit']) {
        builder[method] = vi.fn((...args: unknown[]) => {
          mocks.calls.push({ table, method, args });
          return builder;
        });
      }
      for (const method of ['insert', 'update', 'delete']) {
        builder[method] = vi.fn((...args: unknown[]) => {
          mocks.calls.push({ table, method, args });
          operation = method;
          return builder;
        });
      }
      builder.single = vi.fn(async () => (
        table === 'author_post_reactions'
          ? mocks.existingReactionResult
          : mocks.singleResult
      ));
      builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
        const result = operation
          ? mocks.mutationResults[table]?.[operation] ?? { data: null, error: null }
          : mocks.queryResults[table] ?? { data: [], error: null };
        return Promise.resolve(result).then(resolve, reject);
      };
      return builder;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not fetch a single-author feed until an author ID is provided', async () => {
    const { result } = renderWithClient(() => useAuthorPosts());

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(result.current.data).toBeUndefined();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loads only published posts for the selected author, newest first', async () => {
    const posts = [{ id: 'post-1', author_id: 'author-1', content: 'Hello', is_published: true }];
    mocks.queryResults.author_posts = { data: posts, error: null };
    const { result } = renderWithClient(() => useAuthorPosts('author-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(posts);
    expect(mocks.calls).toEqual(expect.arrayContaining([
      { table: 'author_posts', method: 'eq', args: ['author_id', 'author-1'] },
      { table: 'author_posts', method: 'eq', args: ['is_published', true] },
      { table: 'author_posts', method: 'order', args: ['created_at', { ascending: false }] },
    ]));
  });

  it('surfaces errors loading an author feed', async () => {
    mocks.queryResults.author_posts = { data: null, error: new Error('posts unavailable') };
    const { result } = renderWithClient(() => useAuthorPosts('author-1'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('posts unavailable'));
  });

  it('does not query followed-author posts while signed out', async () => {
    mocks.user = null;
    const { result } = renderWithClient(() => useFollowedAuthorsPosts());

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('returns an empty feed without querying posts when the reader follows no authors', async () => {
    mocks.queryResults.author_followers = { data: [], error: null };
    const { result } = renderWithClient(() => useFollowedAuthorsPosts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith('author_followers');
  });

  it('loads a recent feed scoped to followed authors', async () => {
    mocks.queryResults.author_followers = {
      data: [{ author_id: 'author-2' }, { author_id: 'author-3' }],
      error: null,
    };
    const posts = [{ id: 'post-2', author_id: 'author-2' }];
    mocks.queryResults.author_posts = { data: posts, error: null };
    const { result } = renderWithClient(() => useFollowedAuthorsPosts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(posts);
    expect(mocks.calls).toContainEqual({
      table: 'author_posts',
      method: 'in',
      args: ['author_id', ['author-2', 'author-3']],
    });
    expect(mocks.calls).toContainEqual({
      table: 'author_posts',
      method: 'limit',
      args: [20],
    });
  });

  it('surfaces errors loading the followed-author list', async () => {
    mocks.queryResults.author_followers = { data: null, error: new Error('follows unavailable') };
    const { result } = renderWithClient(() => useFollowedAuthorsPosts());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('follows unavailable'));
  });

  it('rejects post creation when there is no authenticated author', async () => {
    mocks.user = null;
    const { result } = renderWithClient(() => useCreatePost());

    await act(async () => {
      await expect(result.current.mutateAsync({ content: 'A post' })).rejects.toThrow('User not authenticated');
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('creates a post and invalidates author and follower feeds', async () => {
    const { result } = renderWithClient(() => useCreatePost());
    let created;
    await act(async () => {
      created = await result.current.mutateAsync({
        title: 'A title',
        content: 'A post',
        post_type: 'blog_post',
        allow_comments: true,
      });
    });

    expect(created).toEqual(mocks.singleResult.data);
    expect(mocks.calls).toContainEqual({
      table: 'author_posts',
      method: 'insert',
      args: [expect.objectContaining({ author_id: 'author-1', title: 'A title', content: 'A post' })],
    });
    expect(mocks.invalidations).toEqual(expect.arrayContaining([
      { queryKey: ['author-posts'] },
      { queryKey: ['followed-authors-posts'] },
    ]));
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Post created successfully!');
  });

  it('reports post creation failures through logging and toast feedback', async () => {
    const error = new Error('insert failed');
    mocks.singleResult = { data: null, error };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderWithClient(() => useCreatePost());

    await act(async () => {
      await expect(result.current.mutateAsync({ content: 'A post' })).rejects.toThrow('insert failed');
    });
    expect(consoleError).toHaveBeenCalledWith('Error creating post:', error);
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to create post');
  });

  it('keeps comments disabled without a post ID and builds threaded replies', async () => {
    const disabled = renderWithClient(() => usePostComments());
    await waitFor(() => expect(disabled.result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
    disabled.unmount();

    mocks.queryResults.author_post_comments = {
      data: [
        { id: 'root', post_id: 'post-1', content: 'Root', parent_comment_id: null },
        { id: 'reply', post_id: 'post-1', content: 'Reply', parent_comment_id: 'root' },
        { id: 'orphan', post_id: 'post-1', content: 'Orphan', parent_comment_id: 'missing' },
      ],
      error: null,
    };
    const { result } = renderWithClient(() => usePostComments('post-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      expect.objectContaining({
        id: 'root',
        replies: [expect.objectContaining({ id: 'reply', replies: [] })],
      }),
    ]);
  });

  it('adds a comment with its optional parent and invalidates only that post thread', async () => {
    const { result } = renderWithClient(() => useAddComment());
    let created;
    await act(async () => {
      created = await result.current.mutateAsync({
        postId: 'post-1',
        content: 'A reply',
        parentCommentId: 'comment-parent',
      });
    });

    expect(created).toEqual(mocks.singleResult.data);
    expect(mocks.calls).toContainEqual({
      table: 'author_post_comments',
      method: 'insert',
      args: [expect.objectContaining({
        post_id: 'post-1',
        user_id: 'author-1',
        content: 'A reply',
        parent_comment_id: 'comment-parent',
      })],
    });
    expect(mocks.invalidations).toContainEqual({ queryKey: ['post-comments', 'post-1'] });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Comment added successfully!');
  });

  it('rejects comments from signed-out readers', async () => {
    mocks.user = null;
    const { result } = renderWithClient(() => useAddComment());

    await act(async () => {
      await expect(result.current.mutateAsync({ postId: 'post-1', content: 'Hello' }))
        .rejects.toThrow('User not authenticated');
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loads post reactions and returns an empty result when no rows exist', async () => {
    const { result } = renderWithClient(() => usePostReactions('post-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mocks.from).toHaveBeenCalledWith('author_post_reactions');
  });

  it('adds a new reaction when the reader has not reacted yet', async () => {
    mocks.existingReactionResult = { data: null, error: null };
    const { result } = renderWithClient(() => useToggleReaction());

    await act(async () => {
      await expect(result.current.mutateAsync({ postId: 'post-1', reactionType: 'like' }))
        .resolves.toEqual({ action: 'added' });
    });
    expect(mocks.calls).toContainEqual({
      table: 'author_post_reactions',
      method: 'insert',
      args: [{ post_id: 'post-1', user_id: 'author-1', reaction_type: 'like' }],
    });
    expect(mocks.invalidations).toContainEqual({ queryKey: ['post-reactions', 'post-1'] });
  });

  it('updates an existing reaction when the reader chooses a different type', async () => {
    mocks.existingReactionResult = {
      data: { id: 'reaction-1', reaction_type: 'like' },
      error: null,
    };
    const { result } = renderWithClient(() => useToggleReaction());

    await act(async () => {
      await expect(result.current.mutateAsync({ postId: 'post-1', reactionType: 'love' }))
        .resolves.toEqual({ action: 'updated' });
    });
    expect(mocks.calls).toContainEqual({
      table: 'author_post_reactions',
      method: 'update',
      args: [{ reaction_type: 'love' }],
    });
  });

  it('removes an existing reaction when the reader selects the same type again', async () => {
    mocks.existingReactionResult = {
      data: { id: 'reaction-1', reaction_type: 'like' },
      error: null,
    };
    const { result } = renderWithClient(() => useToggleReaction());

    await act(async () => {
      await expect(result.current.mutateAsync({ postId: 'post-1', reactionType: 'like' }))
        .resolves.toEqual({ action: 'removed' });
    });
    expect(mocks.calls).toContainEqual({
      table: 'author_post_reactions',
      method: 'delete',
      args: [],
    });
  });

  it('rejects unauthenticated reactions and reports database errors', async () => {
    mocks.user = null;
    const unauthenticated = renderWithClient(() => useToggleReaction());
    await act(async () => {
      await expect(unauthenticated.result.current.mutateAsync({ postId: 'post-1', reactionType: 'like' }))
        .rejects.toThrow('User not authenticated');
    });
    unauthenticated.unmount();

    mocks.user = { id: 'author-1' };
    mocks.mutationResults.author_post_reactions = {
      insert: { data: null, error: new Error('reaction unavailable') },
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failed = renderWithClient(() => useToggleReaction());
    await act(async () => {
      await expect(failed.result.current.mutateAsync({ postId: 'post-1', reactionType: 'like' }))
        .rejects.toThrow('reaction unavailable');
    });
    expect(consoleError).toHaveBeenCalledWith('Error toggling reaction:', new Error('reaction unavailable'));
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to update reaction');
  });
});
