// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queryOptions: null as any,
  mutations: [] as any[],
  responses: [] as Array<{ data?: any; error?: any }>,
  from: vi.fn(),
  invalidateQueries: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => { mocks.queryOptions = options; return { data: undefined, isLoading: false, error: null }; },
  useMutation: (options: any) => { mocks.mutations.push(options); return { ...options, mutateAsync: options.mutationFn }; },
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => mocks.toast(...args) }));

import { useAddComment, useComments, useDeleteComment, useUpdateComment } from './useComments';

const setResponses = (...responses: Array<{ data?: any; error?: any }>) => {
  mocks.responses = responses;
  let index = 0;
  mocks.from.mockImplementation((table: string) => {
    const response = mocks.responses[index++] ?? { data: [], error: null };
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      single: vi.fn(() => Promise.resolve(response)),
      then: (resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(response).then(resolve, reject),
    };
    return builder;
  });
};

describe('post comment hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queryOptions = null;
    mocks.mutations = [];
    mocks.responses = [];
    mocks.from.mockReset();
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    mocks.toast.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads comments, enriches profiles, and groups replies beneath parents', async () => {
    const rows = [
      { id: 'parent', post_id: 'post-1', content: 'Root', user_id: 'reader-1', parent_comment_id: null, created_at: '1' },
      { id: 'reply', post_id: 'post-1', content: 'Reply', user_id: 'reader-2', parent_comment_id: 'parent', created_at: '2' },
      { id: 'orphan', post_id: 'post-1', content: 'Orphan', user_id: 'missing', parent_comment_id: 'unknown-parent', created_at: '3' },
    ];
    setResponses(
      { data: rows, error: null },
      { data: [{ id: 'reader-1', full_name: 'Reader One', profile_photo_url: 'photo' }, { id: 'reader-2', full_name: 'Reader Two' }], error: null },
    );
    renderHook(() => useComments('post-1'));
    const result = await mocks.queryOptions.queryFn();

    expect(mocks.queryOptions.queryKey).toEqual(['comments', 'post-1']);
    expect(mocks.from).toHaveBeenNthCalledWith(1, 'post_comments');
    expect(mocks.from).toHaveBeenNthCalledWith(2, 'public_profiles');
    expect(result).toHaveLength(1);
    expect(result[0].user).toMatchObject({ full_name: 'Reader One', profile_photo_url: 'photo' });
    expect(result[0].replies).toEqual([expect.objectContaining({
      id: 'reply', user: expect.objectContaining({ full_name: 'Reader Two' }),
    })]);
  });

  it('falls back to profiles when public profile data is unavailable and supplies unknown users', async () => {
    setResponses(
      { data: [{ id: 'c1', user_id: 'reader-1', parent_comment_id: null }], error: null },
      { data: [], error: null },
      { data: [{ id: 'reader-1', full_name: 'Fallback Profile' }], error: null },
    );
    renderHook(() => useComments('post-2'));
    const result = await mocks.queryOptions.queryFn();
    expect(mocks.from).toHaveBeenNthCalledWith(3, 'profiles');
    expect(result[0].user.full_name).toBe('Fallback Profile');

    setResponses(
      { data: [{ id: 'c2', user_id: 'absent', parent_comment_id: null }], error: null },
      { data: null, error: new Error('public profiles unavailable') },
      { data: [], error: null },
    );
    renderHook(() => useComments('post-3'));
    const unknown = await mocks.queryOptions.queryFn();
    expect(unknown[0].user).toEqual({ full_name: 'Unknown User', profile_photo_url: null });
  });

  it('propagates the primary comments query error', async () => {
    const error = new Error('comments unavailable');
    setResponses({ data: null, error });
    renderHook(() => useComments('post-1'));
    await expect(mocks.queryOptions.queryFn()).rejects.toBe(error);
  });

  it('adds a comment with the authenticated user and invalidates the post thread', async () => {
    const inserted = { id: 'comment-1', content: 'hello' };
    setResponses({ data: inserted, error: null });
    renderHook(() => useAddComment());
    await expect(mocks.mutations[0].mutationFn({
      postId: 'post-1', content: 'hello', parentCommentId: 'parent-1',
    })).resolves.toEqual(inserted);
    await mocks.mutations[0].onSuccess(undefined, { postId: 'post-1' });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['comments', 'post-1'] });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Comment added successfully!' });

    mocks.user = null;
    renderHook(() => useAddComment());
    await expect(mocks.mutations[1].mutationFn({ postId: 'post-1', content: 'x' })).rejects.toThrow('User not authenticated');
    await mocks.mutations[1].onError();
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Failed to add comment', variant: 'destructive' });
  });

  it('updates and deletes comments while invalidating their thread', async () => {
    setResponses({ data: { id: 'comment-1', content: 'edited' }, error: null });
    renderHook(() => useUpdateComment());
    const updated = await mocks.mutations[0].mutationFn({ id: 'comment-1', content: 'edited', postId: 'post-1' });
    expect(updated).toEqual({ data: { id: 'comment-1', content: 'edited' }, postId: 'post-1' });
    await mocks.mutations[0].onSuccess(updated);
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Comment updated successfully!' });

    setResponses({ data: null, error: null });
    renderHook(() => useDeleteComment());
    const deleted = await mocks.mutations[1].mutationFn({ id: 'comment-1', postId: 'post-1' });
    await mocks.mutations[1].onSuccess(deleted);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['comments', 'post-1'] });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Comment deleted successfully!' });
  });

  it('shows mutation failure toasts for update and delete errors', async () => {
    const failure = new Error('write failed');
    setResponses({ data: null, error: failure });
    renderHook(() => useUpdateComment());
    await expect(mocks.mutations[0].mutationFn({ id: 'c', content: 'x', postId: 'p' })).rejects.toBe(failure);
    await mocks.mutations[0].onError();
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Failed to update comment', variant: 'destructive' });

    setResponses({ data: null, error: failure });
    renderHook(() => useDeleteComment());
    await expect(mocks.mutations[1].mutationFn({ id: 'c', postId: 'p' })).rejects.toBe(failure);
    await mocks.mutations[1].onError();
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Failed to delete comment', variant: 'destructive' });
  });
});
