// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queries: [] as Array<Record<string, any>>,
  mutations: [] as Array<Record<string, any>>,
  responses: {} as Record<string, Array<{ data?: any; error?: any }>>,
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
    mocks.mutations.push(options);
    return { ...options, mutateAsync: options.mutationFn };
  },
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => mocks.toast(...args) }));

import {
  usePublishedArticles,
  useMyArticles,
  useArticleBySlug,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from './useArticles';

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
    builder.select = chain('select');
    builder.eq = chain('eq');
    builder.order = chain('order');
    builder.in = chain('in');
    builder.insert = chain('insert');
    builder.update = chain('update');
    builder.delete = chain('delete');
    builder.single = () => Promise.resolve(response);
    builder.maybeSingle = () => Promise.resolve(response);
    builder.then = (resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject);
    return builder;
  });
}

const article = (overrides: Record<string, any> = {}) => ({
  id: 'article-1', user_id: 'writer-1', title: 'A title', subtitle: null, content: 'body',
  cover_image_url: null, tags: [], is_published: true, reading_time_minutes: 1,
  likes_count: 0, views_count: 0, slug: 'a-title', created_at: '2026-01-01',
  updated_at: '2026-01-01', published_at: '2026-01-01', ...overrides,
});

describe('useArticles hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queries = [];
    mocks.mutations = [];
    mocks.from.mockReset();
    configureResponses();
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    mocks.toast.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads published articles and enriches authors from public profiles', async () => {
    renderHook(() => usePublishedArticles());
    mocks.responses = {
      articles: [{ data: [article(), article({ id: 'article-2', user_id: 'writer-2' })], error: null }],
      public_profiles: [{ data: [
        { id: 'writer-1', full_name: 'Writer One', profile_photo_url: 'one.png' },
        { id: 'writer-2', full_name: 'Writer Two', profile_photo_url: 'two.png' },
      ], error: null }],
    };
    const result = await mocks.queries[0].queryFn();
    expect(result).toEqual([
      expect.objectContaining({ id: 'article-1', author_name: 'Writer One', author_avatar: 'one.png' }),
      expect.objectContaining({ id: 'article-2', author_name: 'Writer Two', author_avatar: 'two.png' }),
    ]);
    expect(mocks.calls).toContainEqual({ table: 'articles', method: 'eq', args: ['is_published', true] });
    expect(mocks.calls).toContainEqual({ table: 'articles', method: 'order', args: ['published_at', { ascending: false }] });
  });

  it('falls back to profiles when public profile data is unavailable', async () => {
    renderHook(() => usePublishedArticles());
    mocks.responses = {
      articles: [{ data: [article()], error: null }],
      public_profiles: [{ data: null, error: { message: 'view unavailable' } }],
      profiles: [{ data: [{ id: 'writer-1', full_name: 'Private Profile', profile_photo_url: 'p.png' }], error: null }],
    };
    await expect(mocks.queries[0].queryFn()).resolves.toEqual([
      expect.objectContaining({ author_name: 'Private Profile', author_avatar: 'p.png' }),
    ]);
  });

  it('returns an empty published list and propagates article query errors', async () => {
    renderHook(() => usePublishedArticles());
    mocks.responses = { articles: [{ data: [], error: null }] };
    mocks.tableCalls = {};
    await expect(mocks.queries[0].queryFn()).resolves.toEqual([]);
    const failure = new Error('articles unavailable');
    mocks.responses = { articles: [{ data: null, error: failure }] };
    mocks.tableCalls = {};
    await expect(mocks.queries[0].queryFn()).rejects.toBe(failure);
  });

  it('gates my-articles query on authentication and orders by update time', async () => {
    mocks.user = null;
    const { rerender } = renderHook(({ userId }) => useMyArticles(), { initialProps: { userId: null } });
    expect(mocks.queries[0].enabled).toBe(false);
    mocks.queries = [];
    mocks.user = { id: 'reader-1' };
    rerender({ userId: 'reader-1' });
    expect(mocks.queries[0].enabled).toBe(true);
    mocks.responses = { articles: [{ data: [article({ user_id: 'reader-1' })], error: null }] };
    await expect(mocks.queries[0].queryFn()).resolves.toEqual([article({ user_id: 'reader-1' })]);
    expect(mocks.calls).toContainEqual({ table: 'articles', method: 'eq', args: ['user_id', 'reader-1'] });
    expect(mocks.calls).toContainEqual({ table: 'articles', method: 'order', args: ['updated_at', { ascending: false }] });
  });

  it('loads an article by slug with public author profile and anonymous fallback', async () => {
    renderHook(() => useArticleBySlug(undefined));
    expect(mocks.queries[0].enabled).toBe(false);
    mocks.queries = [];
    renderHook(() => useArticleBySlug('a-title'));
    mocks.responses = {
      articles: [{ data: article(), error: null }],
      public_profiles: [{ data: { id: 'writer-1', full_name: 'Writer', profile_photo_url: 'writer.png' }, error: null }],
    };
    await expect(mocks.queries[0].queryFn()).resolves.toEqual(
      expect.objectContaining({ id: 'article-1', author_name: 'Writer', author_avatar: 'writer.png' }),
    );
    mocks.tableCalls = {};
    mocks.responses = {
      articles: [{ data: article(), error: null }],
      public_profiles: [{ data: null, error: null }],
      profiles: [{ data: null, error: null }],
    };
    await expect(mocks.queries[0].queryFn()).resolves.toEqual(
      expect.objectContaining({ author_name: 'Anonymous', author_avatar: '' }),
    );
  });

  it('creates draft or published articles with a slug and estimated reading time', async () => {
    renderHook(() => useCreateArticle());
    const created = article({ title: 'Hello, World!', slug: 'hello-world-fixed', reading_time_minutes: 2 });
    mocks.responses = { articles: [{ data: created, error: null }] };
    vi.spyOn(Date, 'now').mockReturnValue(123456789);
    await expect(mocks.mutations[0].mutationFn({
      title: 'Hello, World!', content: Array(401).fill('word').join(' '), is_published: true,
    })).resolves.toEqual(created);
    const insert = mocks.calls.find((call) => call.table === 'articles' && call.method === 'insert');
    expect(insert?.args[0]).toMatchObject({
      user_id: 'reader-1', title: 'Hello, World!', is_published: true,
      reading_time_minutes: 2, slug: expect.stringMatching(/^hello-world-[a-z0-9]+$/),
    });
    expect(insert?.args[0]).toHaveProperty('published_at');
    await mocks.mutations[0].onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['articles'] });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Article saved!' });
  });

  it('updates content/publish metadata and handles errors', async () => {
    renderHook(() => useUpdateArticle());
    mocks.responses = { articles: [{ data: article({ content: 'updated', reading_time_minutes: 1 }), error: null }] };
    await mocks.mutations[0].mutationFn({ id: 'article-1', content: 'updated', is_published: true });
    const update = mocks.calls.find((call) => call.table === 'articles' && call.method === 'update');
    expect(update?.args[0]).toMatchObject({ content: 'updated', reading_time_minutes: 1, published_at: expect.any(String) });
    await mocks.mutations[0].onSuccess();
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Article updated!' });
    await mocks.mutations[0].onError(new Error('save failed'));
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Error updating article', description: 'save failed', variant: 'destructive' });
  });

  it('deletes articles and invalidates article lists', async () => {
    renderHook(() => useDeleteArticle());
    mocks.responses = { articles: [{ data: null, error: null }] };
    await expect(mocks.mutations[0].mutationFn('article-1')).resolves.toBeUndefined();
    expect(mocks.calls).toContainEqual({ table: 'articles', method: 'delete', args: [] });
    await mocks.mutations[0].onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['articles'] });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Article deleted' });
  });
});
