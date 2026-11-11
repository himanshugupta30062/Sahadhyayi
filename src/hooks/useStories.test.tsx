// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; email?: string; user_metadata?: Record<string, any> },
  queries: [] as Array<Record<string, any>>,
  mutations: [] as Array<Record<string, any>>,
  responses: {} as Record<string, Array<{ data?: any; error?: any; count?: number | null }>>,
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
  tableCalls: {} as Record<string, number>,
  from: vi.fn(),
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: Record<string, any>) => {
    mocks.queries.push(options);
    return { data: undefined, isLoading: false, error: null };
  },
  useMutation: (options: Record<string, any>) => {
    mocks.mutations.push(options);
    return { ...options, mutateAsync: options.mutationFn };
  },
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));

import {
  useStories,
  useContinueReadingStories,
  useStoryDetails,
  useStoryPart,
  useDeleteStory,
  useSaveStoryProgress,
  useCreateStory,
  useStoryComments,
  useAddStoryComment,
} from './useStories';
import { STARTER_STORIES, STARTER_STORY_PARTS } from '@/data/starterStories';

function configureResponses(responses: typeof mocks.responses = {}) {
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
    for (const method of ['select', 'eq', 'order', 'or', 'limit', 'in', 'insert', 'update', 'delete', 'upsert']) {
      builder[method] = chain(method);
    }
    builder.single = () => Promise.resolve(response);
    builder.maybeSingle = () => Promise.resolve(response);
    builder.then = (resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject);
    return builder;
  });
}

const story = (overrides: Record<string, any> = {}) => ({
  id: 'story-1', title: 'A story', description: 'Description', cover_image_url: null,
  genre: 'Fiction', tags: [], user_id: 'writer-1', author_name: 'Writer',
  story_type: 'series', status: 'published', completion_status: 'ongoing',
  published_at: '2026-01-01', updated_at: '2026-01-01', views_count: 0,
  reads_count: 0, likes_count: 0, bookmarks_count: 0, follows_count: 0,
  parts_count: 1, reading_time_minutes: 1, ...overrides,
});

describe('useStories hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1', email: 'reader@example.com', user_metadata: { full_name: 'Reader' } };
    mocks.queries = [];
    mocks.mutations = [];
    mocks.from.mockReset();
    configureResponses();
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('applies discovery filters, trending sort and reader interaction flags', async () => {
    renderHook(() => useStories({ filter: 'trending', genre: 'Fiction', search: '  moon  ' }));
    mocks.responses = {
      stories: [{ data: [story(), story({ id: 'story-2' })], error: null }],
      story_likes: [{ data: [{ story_id: 'story-1' }], error: null }],
      story_bookmarks: [{ data: [{ story_id: 'story-2' }], error: null }],
      story_follows: [{ data: [], error: null }],
      story_reading_progress: [{ data: [{ story_id: 'story-1', last_read_part_number: 3 }], error: null }],
    };
    const result = await mocks.queries[0].queryFn();
    expect(result).toEqual([
      expect.objectContaining({ id: 'story-1', user_liked: true, user_bookmarked: false, user_following: false, last_read_part_number: 3 }),
      expect.objectContaining({ id: 'story-2', user_liked: false, user_bookmarked: true, user_following: false, last_read_part_number: 1 }),
    ]);
    expect(mocks.calls).toContainEqual({ table: 'stories', method: 'eq', args: ['status', 'published'] });
    expect(mocks.calls).toContainEqual({ table: 'stories', method: 'eq', args: ['genre', 'Fiction'] });
    expect(mocks.calls).toContainEqual({ table: 'stories', method: 'or', args: ['title.ilike.%moon%,description.ilike.%moon%,author_name.ilike.%moon%'] });
    expect(mocks.calls).toContainEqual({ table: 'stories', method: 'order', args: ['views_count', { ascending: false }] });
  });

  it('uses curated starter stories for empty public feeds and never exposes unauthenticated drafts', async () => {
    renderHook(() => useStories({ filter: 'recent', genre: 'All' }));
    mocks.responses = { stories: [{ data: [], error: null }] };
    const curated = await mocks.queries[0].queryFn();
    expect(curated.length).toBeGreaterThan(0);
    expect(curated.every((item: any) => item.id.startsWith('starter-'))).toBe(true);

    mocks.user = null;
    mocks.from.mockClear();
    mocks.queries = [];
    configureResponses();
    renderHook(() => useStories({ filter: 'my-stories' }));
    await expect(mocks.queries[0].queryFn()).resolves.toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.calls).not.toContainEqual(expect.objectContaining({ table: 'stories', method: 'eq' }));
  });

  it('loads continue-reading stories and restores each progress position', async () => {
    renderHook(() => useContinueReadingStories());
    mocks.responses = {
      story_reading_progress: [{ data: [{ story_id: 'story-1', last_read_part_number: 4, updated_at: 'today' }], error: null }],
      stories: [{ data: [story()], error: null }],
    };
    await expect(mocks.queries[0].queryFn()).resolves.toEqual([
      expect.objectContaining({ id: 'story-1', last_read_part_number: 4 }),
    ]);
    expect(mocks.queries[0].enabled).toBe(true);
  });

  it('returns starter story details and its built-in parts without database calls', async () => {
    const starter = STARTER_STORIES[0];
    renderHook(() => useStoryDetails(starter.id));
    const result = await mocks.queries[0].queryFn();
    expect(result).toMatchObject({ id: starter.id, isAuthor: false, parts: STARTER_STORY_PARTS[starter.id] || [] });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loads starter comments locally and rejects empty or anonymous comment writes', async () => {
    renderHook(() => useStoryComments('starter-example'));
    const comments = await mocks.queries[0].queryFn();
    expect(comments).toHaveLength(2);
    expect(comments[0]).toMatchObject({ story_id: 'starter-example', profiles: { full_name: 'Priya Sharma' } });
    renderHook(() => useAddStoryComment());
    await expect(mocks.mutations[0].mutationFn({ storyId: 'story-1', content: '   ' })).rejects.toThrow('Comment cannot be empty.');
    mocks.user = null;
    renderHook(() => useAddStoryComment());
    await expect(mocks.mutations[1].mutationFn({ storyId: 'story-1', content: 'Hello' })).rejects.toThrow('Sign in to leave a comment.');
  });

  it('creates a story and its initial part, then invalidates the feed', async () => {
    renderHook(() => useCreateStory());
    const created = story({ id: 'new-story', title: 'New Story' });
    mocks.responses = {
      stories: [{ data: created, error: null }],
      story_parts: [{ data: null, error: null }],
    };
    await expect(mocks.mutations[0].mutationFn({
      title: ' New Story ', genre: 'Fiction', tags: ['test'], story_type: 'series',
      status: 'published', initial_part: { title: ' Chapter 1 ', content: ' words ', status: 'published' },
    })).resolves.toEqual(created);
    expect(mocks.calls).toContainEqual({ table: 'stories', method: 'insert', args: [expect.objectContaining({
      user_id: 'reader-1', title: 'New Story', author_name: 'Reader', status: 'published',
      parts_count: 1, reading_time_minutes: 1,
    })] });
    expect(mocks.calls).toContainEqual({ table: 'story_parts', method: 'insert', args: [expect.objectContaining({
      story_id: 'new-story', part_number: 1, title: 'Chapter 1', content: 'words', status: 'published',
    })] });
    await mocks.mutations[0].onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['stories'] });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Story saved successfully!');
  });

  it('requires auth and ownership for deleting stories and reports absent deletions', async () => {
    mocks.user = null;
    renderHook(() => useDeleteStory());
    await expect(mocks.mutations[0].mutationFn('story-1')).rejects.toThrow('Authentication required');
    mocks.user = { id: 'reader-1' };
    renderHook(() => useDeleteStory());
    mocks.responses = { stories: [{ data: null, error: null }] };
    await expect(mocks.mutations[1].mutationFn('story-1')).rejects.toThrow('You may not own this story');
    mocks.tableCalls = {};
    mocks.responses = { stories: [{ data: { id: 'story-1' }, error: null }] };
    await expect(mocks.mutations[1].mutationFn('story-1')).resolves.toBe('story-1');
    expect(mocks.calls).toContainEqual({ table: 'stories', method: 'eq', args: ['user_id', 'reader-1'] });
    await mocks.mutations[0].onSuccess('story-1');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Short story deleted.');
  });

  it('hydrates database story details with published parts and reader interaction state', async () => {
    const dbStory = story({ user_id: 'writer-1', views_count: 9 });
    const publishedPart = { id: 'part-1', story_id: 'story-1', part_number: 1, title: 'Chapter', status: 'published' };
    renderHook(() => useStoryDetails('story-1'));
    configureResponses({
      stories: [{ data: dbStory, error: null }, { data: null, error: null }],
      story_parts: [{ data: [publishedPart], error: null }],
      story_likes: [{ data: { id: 'like-1' }, error: null }],
      story_bookmarks: [{ data: null, error: null }],
      story_follows: [{ data: { id: 'follow-1' }, error: null }],
      story_reading_progress: [{ data: { last_read_part_number: 3 }, error: null }],
    });

    const result = await mocks.queries[0].queryFn();
    expect(result).toMatchObject({
      story: { id: 'story-1', user_liked: true, user_bookmarked: false, user_following: true, last_read_part_number: 3 },
      parts: [publishedPart],
      isAuthor: false,
    });
    expect(mocks.calls).toContainEqual({ table: 'story_parts', method: 'eq', args: ['status', 'published'] });
    expect(mocks.calls).toContainEqual({ table: 'stories', method: 'update', args: [{ views_count: 10 }] });
  });

  it('loads database story parts for authors without hiding drafts', async () => {
    mocks.user = { id: 'writer-1', email: 'writer@example.com' };
    const dbStory = story({ user_id: 'writer-1' });
    const draftPart = { id: 'draft-1', part_number: 2, title: 'Draft', status: 'draft' };
    renderHook(() => useStoryPart('story-1', 2));
    configureResponses({
      stories: [{ data: dbStory, error: null }],
      story_parts: [{ data: draftPart, error: null }, { data: [draftPart], error: null }],
    });

    const result = await mocks.queries[0].queryFn();
    expect(result).toMatchObject({ story: dbStory, part: draftPart, allParts: [draftPart], isAuthor: true });
    expect(mocks.calls).not.toContainEqual({ table: 'story_parts', method: 'eq', args: ['status', 'published'] });
  });

  it('clamps reading progress and invalidates continue-reading and story detail caches', async () => {
    renderHook(() => useSaveStoryProgress());
    await mocks.mutations[0].mutationFn({ storyId: 'story-1', partId: 'part-2', partNumber: 2, percentage: 140 });
    expect(mocks.calls).toContainEqual({
      table: 'story_reading_progress', method: 'upsert',
      args: [expect.objectContaining({ story_id: 'story-1', user_id: 'reader-1', last_read_part_number: 2, progress_percentage: 100 })],
    });
    await mocks.mutations[0].onSuccess(undefined, { storyId: 'story-1' });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['continue-reading-stories'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['story-details', 'story-1'] });
  });

});
