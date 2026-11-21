// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  from: vi.fn(),
  rpc: vi.fn(),
  invoke: vi.fn(),
  queryResults: {} as Record<string, { data: any; error: any }>,
  singleResults: {} as Record<string, { data: any; error: any }>,
  updateResult: { data: null as any, error: null as any },
  rpcResult: { data: [], error: null as any },
  functionResult: { data: { dna: null }, error: null as any },
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
  invalidations: [] as unknown[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
    rpc: (...args: unknown[]) => mocks.rpc(...args),
    functions: { invoke: (...args: unknown[]) => mocks.invoke(...args) },
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

import {
  useReadingDna,
  useDnaMatch,
  useUserShelfForCompare,
  useGenerateReadingDna,
  useDiscoverableReaders,
  useUpdateReadingDnaVisibility,
} from './useReadingDna';

const createHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async (filters: any) => {
    mocks.invalidations.push(filters);
    return undefined as any;
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
};

const makeQuery = (table: string) => {
  const filters: Record<string, unknown> = {};
  let operation = 'select';
  const query: Record<string, any> = {};

  for (const method of ['select', 'eq', 'neq', 'limit', 'in']) {
    query[method] = vi.fn((...args: unknown[]) => {
      mocks.calls.push({ table, method, args });
      if (method === 'eq' || method === 'neq') filters[String(args[0])] = args[1];
      return query;
    });
  }

  query.update = vi.fn((...args: unknown[]) => {
    operation = 'update';
    mocks.calls.push({ table, method: 'update', args });
    return query;
  });

  query.maybeSingle = vi.fn(() => Promise.resolve(
    mocks.singleResults[String(filters.user_id)] ??
    mocks.singleResults[table] ??
    mocks.queryResults[table] ??
    { data: null, error: null },
  ));

  query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
    const result = operation === 'update'
      ? mocks.updateResult
      : mocks.queryResults[table] ?? { data: [], error: null };
    return Promise.resolve(result).then(resolve, reject);
  };

  return query;
};

const dna = (user_id: string) => ({
  user_id,
  genres: [{ name: 'History', weight: 0.8 }, { name: 'Philosophy', weight: 0.6 }],
  moods: ['reflective', 'hopeful'],
  pace: 'steady',
  themes: ['identity', 'courage'],
  summary: 'A thoughtful reader',
  signature_color: '#315b45',
  generated_at: '2026-11-20T10:00:00.000Z',
  visibility: 'public' as const,
});

describe('Reading DNA hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queryResults = {};
    mocks.singleResults = {};
    mocks.updateResult = { data: null, error: null };
    mocks.rpcResult = { data: [], error: null };
    mocks.functionResult = { data: { dna: dna('reader-1') }, error: null };
    mocks.calls = [];
    mocks.invalidations = [];
    mocks.from.mockReset().mockImplementation((table: string) => makeQuery(table));
    mocks.rpc.mockReset().mockImplementation(() => Promise.resolve(mocks.rpcResult));
    mocks.invoke.mockReset().mockImplementation(() => Promise.resolve(mocks.functionResult));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads the requested reader DNA instead of silently switching to the signed-in reader', async () => {
    mocks.singleResults['reader-2'] = { data: dna('reader-2'), error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useReadingDna('reader-2'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(dna('reader-2'));
    expect(mocks.from).toHaveBeenCalledWith('reading_dna');
    expect(mocks.calls).toContainEqual({
      table: 'reading_dna',
      method: 'eq',
      args: ['user_id', 'reader-2'],
    });
  });

  it('does not query Reading DNA when neither an explicit nor authenticated user exists', async () => {
    mocks.user = null;
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useReadingDna(), { wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('returns null when the reader has not generated DNA yet', async () => {
    mocks.singleResults['reader-1'] = { data: null, error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useReadingDna(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('surfaces errors from the Reading DNA row query', async () => {
    mocks.singleResults['reader-1'] = { data: null, error: new Error('DNA query failed') };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useReadingDna(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('DNA query failed'));
  });

  it('computes compatibility only after both readers have generated DNA', async () => {
    mocks.singleResults['reader-1'] = { data: dna('reader-1'), error: null };
    mocks.singleResults['reader-2'] = { data: dna('reader-2'), error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useDnaMatch('reader-2'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.myDna).toEqual(dna('reader-1'));
    expect(result.current.targetDna).toEqual(dna('reader-2'));
    expect(result.current.score).toBe(100);
  });

  it('keeps the DNA match score null when the target is not selected or the reader is signed out', async () => {
    mocks.user = null;
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useDnaMatch('reader-2'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.score).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loads a reader shelf scoped to that user and defaults a missing shelf to an empty list', async () => {
    const shelf = [{ book_id: 'book-1', status: 'read', rating: 5 }];
    mocks.queryResults.user_bookshelf = { data: shelf, error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useUserShelfForCompare('reader-2'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(shelf);
    expect(mocks.calls).toContainEqual({
      table: 'user_bookshelf',
      method: 'eq',
      args: ['user_id', 'reader-2'],
    });
  });

  it('surfaces shelf comparison query failures', async () => {
    mocks.queryResults.user_bookshelf = { data: null, error: new Error('shelf unavailable') };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useUserShelfForCompare('reader-2'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('shelf unavailable'));
  });

  it('does not query a comparison shelf until a user id is provided', async () => {
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useUserShelfForCompare(), { wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('invokes DNA generation and invalidates the reader and friend DNA queries', async () => {
    const generated = dna('reader-1');
    mocks.functionResult = { data: { dna: generated }, error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useGenerateReadingDna(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mocks.invoke).toHaveBeenCalledWith('generate-reading-dna', { body: {} });
    expect(result.current.data).toEqual(generated);
    await waitFor(() => expect(mocks.invalidations).toEqual(expect.arrayContaining([
      { queryKey: ['reading-dna', 'reader-1'] },
      { queryKey: ['friend-dna'] },
    ])));
  });

  it('surfaces errors from the DNA generation function', async () => {
    mocks.functionResult = { data: null, error: new Error('generation unavailable') };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useGenerateReadingDna(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('generation unavailable');
    });
  });

  it('loads discoverable readers through the RPC with normalized search and pagination', async () => {
    const readers = [{ user_id: 'reader-2', username: 'reader-two' }];
    mocks.rpcResult = { data: readers, error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useDiscoverableReaders({
      search: '  history  ',
      limit: 10,
      offset: 20,
    }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(readers);
    expect(mocks.rpc).toHaveBeenCalledWith('get_discoverable_readers', {
      p_limit: 10,
      p_offset: 20,
      p_search: 'history',
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('returns an empty discoverable-reader list when the RPC succeeds without rows', async () => {
    mocks.rpcResult = { data: null, error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useDiscoverableReaders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('does not run discoverable-reader queries when signed out or explicitly disabled', async () => {
    mocks.user = null;
    const first = createHarness();
    const signedOut = renderHook(() => useDiscoverableReaders(), { wrapper: first.wrapper });
    await waitFor(() => expect(signedOut.result.current.fetchStatus).toBe('idle'));
    signedOut.unmount();

    mocks.user = { id: 'reader-1' };
    const second = createHarness();
    const disabled = renderHook(() => useDiscoverableReaders({ enabled: false }), { wrapper: second.wrapper });
    await waitFor(() => expect(disabled.result.current.fetchStatus).toBe('idle'));
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('falls back to public Reading DNA rows and hydrates profile details when the RPC fails', async () => {
    const publicRows = [{
      user_id: 'reader-2',
      genres: [{ name: 'History', weight: 1 }],
      moods: ['curious'],
      themes: ['memory'],
      generated_at: '2026-11-19T00:00:00.000Z',
    }];
    const profiles = [{
      id: 'reader-2',
      username: 'reader-two',
      full_name: 'Reader Two',
      profile_photo_url: '/reader.png',
      bio: 'History fan',
    }];
    mocks.rpcResult = { data: null, error: { message: 'RPC unavailable' } };
    mocks.queryResults.reading_dna = { data: publicRows, error: null };
    mocks.queryResults.profiles = { data: profiles, error: null };
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useDiscoverableReaders({ search: '  history ' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(warning).toHaveBeenCalledWith('[useDiscoverableReaders] RPC fallback:', 'RPC unavailable');
    expect(result.current.data).toEqual([{
      user_id: 'reader-2',
      username: 'reader-two',
      full_name: 'Reader Two',
      profile_photo_url: '/reader.png',
      bio: 'History fan',
      genres: publicRows[0].genres,
      moods: ['curious'],
      pace: null,
      themes: ['memory'],
      summary: null,
      signature_color: null,
      generated_at: publicRows[0].generated_at,
      friend_request_status: 'none',
    }]);
    expect(mocks.calls).toContainEqual({
      table: 'reading_dna',
      method: 'neq',
      args: ['user_id', 'reader-1'],
    });
    expect(mocks.calls).toContainEqual({
      table: 'profiles',
      method: 'in',
      args: ['id', ['reader-2']],
    });
  });

  it('skips profile hydration when the fallback has no public DNA rows', async () => {
    mocks.rpcResult = { data: null, error: { message: 'RPC unavailable' } };
    mocks.queryResults.reading_dna = { data: [], error: null };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useDiscoverableReaders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it('returns an empty list and logs when both the RPC and public DNA fallback fail', async () => {
    mocks.rpcResult = { data: null, error: { message: 'RPC unavailable' } };
    mocks.queryResults.reading_dna = { data: null, error: new Error('fallback unavailable') };
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useDiscoverableReaders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(error).toHaveBeenCalledWith('Failed to load discoverable readers', expect.any(Error));
  });

  it('updates visibility and invalidates personal, friend, and discovery caches', async () => {
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useUpdateReadingDnaVisibility(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('friends')).resolves.toBe('friends');
    });

    expect(mocks.from).toHaveBeenCalledWith('reading_dna');
    expect(mocks.calls).toContainEqual({
      table: 'reading_dna',
      method: 'update',
      args: [{ visibility: 'friends' }],
    });
    await waitFor(() => expect(mocks.invalidations).toEqual(expect.arrayContaining([
      { queryKey: ['reading-dna', 'reader-1'] },
      { queryKey: ['friend-dna'] },
      { queryKey: ['discoverable-readers'] },
    ])));
  });

  it('rejects a visibility update for signed-out readers', async () => {
    mocks.user = null;
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useUpdateReadingDnaVisibility(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('private')).rejects.toThrow(
        'Sign in to change Reading DNA privacy.',
      );
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('surfaces database errors when changing Reading DNA visibility', async () => {
    mocks.updateResult = { data: null, error: new Error('privacy update failed') };
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useUpdateReadingDnaVisibility(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('private')).rejects.toThrow('privacy update failed');
    });
    expect(mocks.invalidations).toEqual([]);
  });
});
