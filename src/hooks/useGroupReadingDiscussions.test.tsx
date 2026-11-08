// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as { id: string } | null,
  rpc: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc: mocks.rpc },
}));

import {
  useCreateGroupReadingDiscussion,
  useCreateGroupReadingDiscussionComment,
  useDeleteGroupReadingDiscussion,
  useDeleteGroupReadingDiscussionComment,
  useGroupReadingDiscussions,
  useGroupReadingDiscussionComments,
} from '@/hooks/useGroupReadingDiscussions';

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateQueries, queryClient };
};

describe('useGroupReadingDiscussions RPC hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'reader-1' };
    mocks.rpc.mockResolvedValue({ data: 'result-1', error: null });
  });

  afterEach(() => cleanup());

  it('loads group discussions through the safe RPC and returns no rows for null data', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useGroupReadingDiscussions('group-1', true), {
      wrapper: makeWrapper().wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mocks.rpc).toHaveBeenCalledWith('list_group_reading_discussions', {
      p_group_id: 'group-1',
      p_limit: 60,
    });
  });

  it('does not load discussions for an empty group id or disabled query', () => {
    const emptyGroup = renderHook(() => useGroupReadingDiscussions('', true), {
      wrapper: makeWrapper().wrapper,
    });
    const disabled = renderHook(() => useGroupReadingDiscussions('group-1', false), {
      wrapper: makeWrapper().wrapper,
    });
    expect(emptyGroup.result.current.fetchStatus).toBe('idle');
    expect(disabled.result.current.fetchStatus).toBe('idle');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('isolates spoiler-sensitive discussion caches when the active reader changes', async () => {
    const context = makeWrapper();
    const first = renderHook(() => useGroupReadingDiscussions('group-1', true), {
      wrapper: context.wrapper,
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    mocks.user = { id: 'reader-2' };
    const second = renderHook(() => useGroupReadingDiscussions('group-1', true), {
      wrapper: context.wrapper,
    });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    const cachedKeys = context.queryClient
      .getQueryCache()
      .findAll({ queryKey: ['group-reading-discussions', 'group-1'] })
      .map((query) => query.queryKey);
    expect(cachedKeys).toEqual(expect.arrayContaining([
      ['group-reading-discussions', 'group-1', 'reader-1'],
      ['group-reading-discussions', 'group-1', 'reader-2'],
    ]));
  });

  it('isolates spoiler-sensitive reply caches when the active reader changes', async () => {
    const context = makeWrapper();
    const first = renderHook(() => useGroupReadingDiscussionComments('discussion-1', true), {
      wrapper: context.wrapper,
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    mocks.user = { id: 'reader-2' };
    const second = renderHook(() => useGroupReadingDiscussionComments('discussion-1', true), {
      wrapper: context.wrapper,
    });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    const cachedKeys = context.queryClient
      .getQueryCache()
      .findAll({ queryKey: ['group-reading-discussion-comments', 'discussion-1'] })
      .map((query) => query.queryKey);
    expect(cachedKeys).toEqual(expect.arrayContaining([
      ['group-reading-discussion-comments', 'discussion-1', 'reader-1'],
      ['group-reading-discussion-comments', 'discussion-1', 'reader-2'],
    ]));
  });

  it('surfaces group discussion errors with a safe fallback', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'active member required' } });
    const first = renderHook(() => useGroupReadingDiscussions('group-1', true), {
      wrapper: makeWrapper().wrapper,
    });
    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect(first.result.current.error?.message).toBe('active member required');
    first.unmount();

    mocks.rpc.mockResolvedValueOnce({ data: null, error: {} });
    const second = renderHook(() => useGroupReadingDiscussions('group-2', true), {
      wrapper: makeWrapper().wrapper,
    });
    await waitFor(() => expect(second.result.current.isError).toBe(true));
    expect(second.result.current.error?.message).toBe('Could not load group discussions.');
  });

  it('loads replies only when the thread is expanded', async () => {
    const { result } = renderHook(() => useGroupReadingDiscussionComments('discussion-1', true), {
      wrapper: makeWrapper().wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.rpc).toHaveBeenCalledWith('list_group_reading_discussion_comments', {
      p_discussion_id: 'discussion-1',
      p_limit: 100,
    });
  });

  it('does not load replies without a discussion id or when collapsed', () => {
    const noId = renderHook(() => useGroupReadingDiscussionComments('', true), {
      wrapper: makeWrapper().wrapper,
    });
    const collapsed = renderHook(() => useGroupReadingDiscussionComments('discussion-1', false), {
      wrapper: makeWrapper().wrapper,
    });
    expect(noId.result.current.fetchStatus).toBe('idle');
    expect(collapsed.result.current.fetchStatus).toBe('idle');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('surfaces safe reply-list errors', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'reply access denied' } });
    const { result } = renderHook(() => useGroupReadingDiscussionComments('discussion-1', true), {
      wrapper: makeWrapper().wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('reply access denied');
  });

  it('creates a discussion with book, chapter, spoiler level, type and trimmed text', async () => {
    const context = makeWrapper();
    const { result } = renderHook(() => useCreateGroupReadingDiscussion(), {
      wrapper: context.wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      groupReadingBookId: 'group-book-1',
      chapterNumber: 4,
      spoilerChapter: 6,
      topicType: 'question',
      title: '  Why does the character leave?  ',
      body: '  I want to discuss this decision.  ',
    })).resolves.toBe('result-1');

    expect(mocks.rpc).toHaveBeenCalledWith('create_group_reading_discussion', {
      p_group_id: 'group-1',
      p_group_reading_book_id: 'group-book-1',
      p_chapter_number: 4,
      p_spoiler_chapter: 6,
      p_topic_type: 'question',
      p_title: 'Why does the character leave?',
      p_body: 'I want to discuss this decision.',
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-discussions', 'group-1', 'reader-1'],
    }));
  });

  it('surfaces discussion creation errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'reading-list membership required' } });
    const { result } = renderHook(() => useCreateGroupReadingDiscussion(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      groupReadingBookId: 'book-1',
      chapterNumber: 0,
      spoilerChapter: 0,
      topicType: 'discussion',
      title: 'A good question',
      body: 'Some discussion text',
    })).rejects.toThrow('reading-list membership required');
  });

  it('creates a reply with an explicit spoiler level and invalidates both caches', async () => {
    const context = makeWrapper();
    const { result } = renderHook(() => useCreateGroupReadingDiscussionComment(), {
      wrapper: context.wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-2',
      discussionId: 'discussion-2',
      body: 'A reply',
      spoilerChapter: 8,
    })).resolves.toBe('result-1');
    expect(mocks.rpc).toHaveBeenCalledWith('create_group_reading_discussion_comment', {
      p_discussion_id: 'discussion-2',
      p_body: 'A reply',
      p_spoiler_chapter: 8,
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-discussion-comments', 'discussion-2', 'reader-1'],
    }));
    expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-discussions', 'group-2', 'reader-1'],
    });
  });

  it('surfaces reply creation errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'finish the spoiler chapter first' } });
    const { result } = renderHook(() => useCreateGroupReadingDiscussionComment(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      discussionId: 'discussion-1',
      body: 'My reply',
      spoilerChapter: 0,
    })).rejects.toThrow('finish the spoiler chapter first');
  });

  it('deletes a discussion and refreshes its group list', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const context = makeWrapper();
    const { result } = renderHook(() => useDeleteGroupReadingDiscussion(), {
      wrapper: context.wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-3',
      discussionId: 'discussion-3',
    })).resolves.toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledWith('delete_group_reading_discussion', {
      p_discussion_id: 'discussion-3',
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-discussions', 'group-3', 'reader-1'],
    }));
  });

  it('surfaces discussion deletion errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const { result } = renderHook(() => useDeleteGroupReadingDiscussion(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      discussionId: 'discussion-1',
    })).rejects.toThrow('permission denied');
  });

  it('deletes a reply and invalidates replies plus the group discussion list', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const context = makeWrapper();
    const { result } = renderHook(() => useDeleteGroupReadingDiscussionComment(), {
      wrapper: context.wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-4',
      discussionId: 'discussion-4',
      commentId: 'comment-4',
    })).resolves.toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledWith('delete_group_reading_discussion_comment', {
      p_comment_id: 'comment-4',
    });
    await waitFor(() => expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-discussion-comments', 'discussion-4', 'reader-1'],
    }));
    expect(context.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group-reading-discussions', 'group-4', 'reader-1'],
    });
  });

  it('surfaces reply deletion errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'reply removal denied' } });
    const { result } = renderHook(() => useDeleteGroupReadingDiscussionComment(), {
      wrapper: makeWrapper().wrapper,
    });
    await expect(result.current.mutateAsync({
      groupId: 'group-1',
      discussionId: 'discussion-1',
      commentId: 'comment-1',
    })).rejects.toThrow('reply removal denied');
  });
});
