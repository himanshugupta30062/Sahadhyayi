// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queryOptions: null as any,
  mutationOptions: null as any,
  queryResult: { data: [], error: null } as any,
  singleResult: { data: null, error: null } as any,
  invalidateQueries: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  upsert: vi.fn(),
  in: vi.fn(),
  single: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: (options: any) => {
    mocks.queryOptions = options;
    return { data: [], isLoading: false };
  },
  useMutation: (options: any) => {
    mocks.mutationOptions = options;
    return {
      mutate: vi.fn(),
      mutateAsync: options.mutationFn,
      isPending: false,
    };
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: (...args: any[]) => mocks.toast(...args),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (...args: any[]) => mocks.from(...args),
  },
}));

import {
  useJournalCollections,
  useJournalEntryMappings,
  useCreateJournalCollection,
  useRenameJournalCollection,
  useDeleteJournalCollection,
  useAssignEntryCollection,
  useJournalEntryMeta,
  useUpdateJournalEntryMeta,
  useBulkAssignEntriesCollection,
  useBulkTagEntries,
} from './useJournalCollections';

describe('useJournalCollections and related persistence hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.user = null;
    mocks.queryOptions = null;
    mocks.mutationOptions = null;
    mocks.queryResult = { data: [], error: null };
    mocks.singleResult = { data: null, error: null };

    const chain: any = {};
    chain.select = (...args: unknown[]) => { mocks.select(...args); return chain; };
    chain.eq = (...args: unknown[]) => { mocks.eq(...args); return chain; };
    chain.order = (...args: unknown[]) => {
      mocks.order(...args);
      return Promise.resolve(mocks.queryResult);
    };
    chain.insert = (...args: unknown[]) => { mocks.insert(...args); return chain; };
    chain.update = (...args: unknown[]) => { mocks.update(...args); return chain; };
    chain.delete = (...args: unknown[]) => { mocks.delete(...args); return chain; };
    chain.upsert = (...args: unknown[]) => { mocks.upsert(...args); return chain; };
    chain.in = (...args: unknown[]) => { mocks.in(...args); return chain; };
    chain.single = () => {
      mocks.single();
      return Promise.resolve(mocks.singleResult);
    };
    chain.then = (resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(mocks.queryResult).then(resolve, reject);
    mocks.from.mockImplementation(() => chain);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads guest collections from localStorage and normalizes legacy string entries', async () => {
    localStorage.setItem('journal-collections', JSON.stringify(['Stoicism', 'Novel Ideas']));
    renderHook(() => useJournalCollections());

    expect(mocks.queryOptions.queryKey).toEqual(['journal-collections', 'guest']);
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([
      expect.objectContaining({ id: 'local-stoicism', user_id: 'guest', name: 'Stoicism' }),
      expect.objectContaining({ id: 'local-novel-ideas', user_id: 'guest', name: 'Novel Ideas' }),
    ]);
  });

  it('returns an empty collection list for malformed or non-array local data', async () => {
    renderHook(() => useJournalCollections());
    localStorage.setItem('journal-collections', '{invalid json');
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([]);

    localStorage.setItem('journal-collections', JSON.stringify({ name: 'not-an-array' }));
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([]);
  });

  it('queries Supabase collections for the authenticated reader', async () => {
    mocks.user = { id: 'reader-1' };
    const mockData = [{
      id: 'col-1',
      user_id: 'reader-1',
      name: 'Daily Reflections',
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    }];
    mocks.queryResult = { data: mockData, error: null };

    renderHook(() => useJournalCollections());
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual(mockData);
    expect(mocks.from).toHaveBeenCalledWith('journal_collections');
    expect(mocks.select).toHaveBeenCalledWith('*');
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'reader-1');
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('falls back to local collections when the Supabase collection query fails', async () => {
    mocks.user = { id: 'reader-1' };
    localStorage.setItem('journal-collections', JSON.stringify(['Offline notes']));
    mocks.queryResult = { data: null, error: new Error('network unavailable') };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderHook(() => useJournalCollections());
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([
      expect.objectContaining({ name: 'Offline notes' }),
    ]);
  });

  it('creates a normalized guest collection and invalidates the collection cache on success', async () => {
    const { result } = renderHook(() => useCreateJournalCollection());
    const created = await result.current.mutateAsync({ name: '  Philosophy  ', description: '  Ideas to revisit  ' });

    expect(created).toMatchObject({
      id: expect.stringMatching(/^local-/),
      user_id: 'guest',
      name: 'Philosophy',
      description: 'Ideas to revisit',
    });
    expect(JSON.parse(localStorage.getItem('journal-collections') || '[]')).toEqual([created]);

    mocks.mutationOptions.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journal-collections'] });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Collection Created' }));
  });

  it('rejects blank and duplicate guest collection names', async () => {
    localStorage.setItem('journal-collections', JSON.stringify(['Philosophy']));
    const { result } = renderHook(() => useCreateJournalCollection());

    await expect(result.current.mutateAsync({ name: '   ' })).rejects.toThrow('Collection name cannot be empty');
    await expect(result.current.mutateAsync({ name: ' philosophy ' })).rejects.toThrow('Collection already exists');
  });

  it('creates an authenticated collection with a trimmed description', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.singleResult = {
      data: { id: 'col-db-1', user_id: 'reader-1', name: 'Science', description: 'Experiments' },
      error: null,
    };

    const { result } = renderHook(() => useCreateJournalCollection());
    const created = await result.current.mutateAsync({ name: ' Science ', description: ' Experiments ' });

    expect(mocks.from).toHaveBeenCalledWith('journal_collections');
    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: 'reader-1',
      name: 'Science',
      description: 'Experiments',
    });
    expect(created).toMatchObject({ id: 'col-db-1', name: 'Science' });
  });

  it('surfaces authenticated collection creation errors and invokes the error toast', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.singleResult = { data: null, error: new Error('insert failed') };
    const { result } = renderHook(() => useCreateJournalCollection());

    await expect(result.current.mutateAsync({ name: 'Science' })).rejects.toThrow('insert failed');
    mocks.mutationOptions.onError(new Error('insert failed'));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'insert failed',
      variant: 'destructive',
    }));
  });

  it('renames an authenticated collection and invalidates the list', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.singleResult = { data: { id: 'col-1', name: 'Updated Name' }, error: null };
    const { result } = renderHook(() => useRenameJournalCollection());

    await expect(result.current.mutateAsync({ id: 'col-1', newName: ' Updated Name ' }))
      .resolves.toMatchObject({ id: 'col-1', name: 'Updated Name' });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
    mocks.mutationOptions.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journal-collections'] });
  });

  it('renames a local collection without making a Supabase request', async () => {
    const original = {
      id: 'local-stoicism',
      user_id: 'guest',
      name: 'Stoicism',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    localStorage.setItem('journal-collections', JSON.stringify([original]));
    mocks.user = { id: 'reader-1' };
    const { result } = renderHook(() => useRenameJournalCollection());

    const updated = await result.current.mutateAsync({ id: original.id, newName: 'Wisdom' });
    expect(updated).toMatchObject({ id: original.id, user_id: 'guest', name: 'Wisdom' });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('journal-collections') || '[]')[0].name).toBe('Wisdom');
  });

  it('rejects a blank rename before touching persistence', async () => {
    const { result } = renderHook(() => useRenameJournalCollection());
    await expect(result.current.mutateAsync({ id: 'col-1', newName: '  ' }))
      .rejects.toThrow('Collection name cannot be empty');
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('deletes an authenticated collection and invalidates both collection queries', async () => {
    mocks.user = { id: 'reader-1' };
    const { result } = renderHook(() => useDeleteJournalCollection());

    await expect(result.current.mutateAsync('col-1')).resolves.toBeUndefined();
    expect(mocks.from).toHaveBeenCalledWith('journal_collections');
    expect(mocks.delete).toHaveBeenCalled();
    mocks.mutationOptions.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journal-collections'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journal-entry-collections'] });
  });

  it('deletes a local collection and removes its entry mappings', async () => {
    localStorage.setItem('journal-collections', JSON.stringify([
      { id: 'local-a', name: 'A' },
      { id: 'local-b', name: 'B' },
    ]));
    localStorage.setItem('journal-entry-collections-map', JSON.stringify({
      entry1: 'local-a',
      entry2: 'local-b',
    }));
    const { result } = renderHook(() => useDeleteJournalCollection());

    await result.current.mutateAsync('local-a');
    expect(JSON.parse(localStorage.getItem('journal-collections') || '[]')).toEqual([
      expect.objectContaining({ id: 'local-b' }),
    ]);
    expect(JSON.parse(localStorage.getItem('journal-entry-collections-map') || '{}')).toEqual({
      entry2: 'local-b',
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('assigns and removes a guest entry collection mapping locally', async () => {
    const { result } = renderHook(() => useAssignEntryCollection());

    await result.current.mutateAsync({ entryId: 'entry-1', collectionId: 'local-books' });
    expect(JSON.parse(localStorage.getItem('journal-entry-collections-map') || '{}'))
      .toEqual({ 'entry-1': 'local-books' });

    await result.current.mutateAsync({ entryId: 'entry-1', collectionId: null });
    expect(JSON.parse(localStorage.getItem('journal-entry-collections-map') || '{}')).toEqual({});
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('assigns and removes an authenticated entry collection mapping', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.singleResult = { data: { entry_id: 'entry-1', collection_id: 'col-1' }, error: null };
    const { result } = renderHook(() => useAssignEntryCollection());

    await expect(result.current.mutateAsync({ entryId: 'entry-1', collectionId: 'col-1' }))
      .resolves.toMatchObject({ entry_id: 'entry-1' });
    expect(mocks.upsert).toHaveBeenCalledWith({
      user_id: 'reader-1',
      collection_id: 'col-1',
      entry_id: 'entry-1',
    }, { onConflict: 'collection_id,entry_id' });

    await result.current.mutateAsync({ entryId: 'entry-1', collectionId: null });
    expect(mocks.delete).toHaveBeenCalled();
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'reader-1');
    expect(mocks.eq).toHaveBeenCalledWith('entry_id', 'entry-1');
  });

  it('loads guest entry mappings and safely handles malformed local mappings', async () => {
    localStorage.setItem('journal-entry-collections-map', JSON.stringify({ entry1: 'col1' }));
    renderHook(() => useJournalEntryMappings());
    expect(mocks.queryOptions.queryKey).toEqual(['journal-entry-collections', 'guest']);
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({ entry1: 'col1' });

    localStorage.setItem('journal-entry-collections-map', '{broken');
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({});
  });

  it('maps authenticated entry rows by entry id', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.queryResult = {
      data: [
        { entry_id: 'entry-1', collection_id: 'col-a' },
        { entry_id: 'entry-2', collection_id: 'col-b' },
      ],
      error: null,
    };
    renderHook(() => useJournalEntryMappings());

    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({
      'entry-1': 'col-a',
      'entry-2': 'col-b',
    });
    expect(mocks.from).toHaveBeenCalledWith('journal_entry_collections');
    expect(mocks.select).toHaveBeenCalledWith('entry_id, collection_id');
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'reader-1');
  });

  it('falls back to local mappings when the authenticated mapping query fails', async () => {
    mocks.user = { id: 'reader-1' };
    localStorage.setItem('journal-entry-collections-map', JSON.stringify({ entry1: 'local-col' }));
    mocks.queryResult = { data: null, error: new Error('query failed') };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderHook(() => useJournalEntryMappings());

    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({ entry1: 'local-col' });
  });

  it('loads guest entry metadata and falls back to an empty object for invalid JSON', async () => {
    localStorage.setItem('journal-entry-meta', JSON.stringify({
      entry1: { favorite: true, tags: ['philosophy'] },
    }));
    renderHook(() => useJournalEntryMeta());
    expect(mocks.queryOptions.queryKey).toEqual(['journal-entry-meta', 'guest']);
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({
      entry1: { favorite: true, tags: ['philosophy'] },
    });

    localStorage.setItem('journal-entry-meta', '{invalid');
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({});
  });

  it('merges authenticated metadata with local metadata and normalizes nullable fields', async () => {
    mocks.user = { id: 'reader-1' };
    localStorage.setItem('journal-entry-meta', JSON.stringify({
      entry1: { pinned: true, collection: 'local-col', tags: ['offline'] },
    }));
    mocks.queryResult = {
      data: [
        { entry_id: 'entry1', is_favorite: 1, is_pinned: 0, tags: ['remote'] },
        { entry_id: 'entry2', is_favorite: 0, is_pinned: null, tags: null },
      ],
      error: null,
    };
    renderHook(() => useJournalEntryMeta());

    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({
      entry1: { pinned: false, collection: 'local-col', tags: ['remote'], favorite: true },
      entry2: { favorite: false, pinned: false, tags: [] },
    });
  });

  it('falls back to local metadata when the authenticated metadata query fails', async () => {
    mocks.user = { id: 'reader-1' };
    localStorage.setItem('journal-entry-meta', JSON.stringify({ entry1: { favorite: true } }));
    mocks.queryResult = { data: null, error: new Error('metadata unavailable') };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderHook(() => useJournalEntryMeta());

    await expect(mocks.queryOptions.queryFn()).resolves.toEqual({ entry1: { favorite: true } });
  });

  it('updates guest metadata by merging fields and persists the local cache', async () => {
    localStorage.setItem('journal-entry-meta', JSON.stringify({
      entry1: { favorite: true, tags: ['classic'] },
    }));
    const { result } = renderHook(() => useUpdateJournalEntryMeta());
    await expect(result.current.mutateAsync({
      entryId: 'entry1',
      meta: { pinned: true, tags: ['classic', 'history'] },
    })).resolves.toEqual({ favorite: true, tags: ['classic', 'history'], pinned: true });

    expect(JSON.parse(localStorage.getItem('journal-entry-meta') || '{}').entry1)
      .toEqual({ favorite: true, tags: ['classic', 'history'], pinned: true });
    mocks.mutationOptions.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journal-entry-meta'] });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('upserts authenticated metadata while retaining local changes when persistence reports an error', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.singleResult = { data: null, error: new Error('write failed') };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useUpdateJournalEntryMeta());

    await expect(result.current.mutateAsync({
      entryId: 'entry-1',
      meta: { favorite: true, tags: ['science'] },
    })).resolves.toBeNull();

    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'reader-1',
      entry_id: 'entry-1',
      is_favorite: true,
      is_pinned: false,
      tags: ['science'],
    }), { onConflict: 'user_id,entry_id' });
    expect(JSON.parse(localStorage.getItem('journal-entry-meta') || '{}')['entry-1'])
      .toMatchObject({ favorite: true, tags: ['science'] });
  });

  it('bulk-assigns guest entries and removes selected local mappings', async () => {
    localStorage.setItem('journal-entry-collections-map', JSON.stringify({
      existing: 'local-a',
      removeMe: 'local-a',
    }));
    const { result } = renderHook(() => useBulkAssignEntriesCollection());

    await result.current.mutateAsync({ entryIds: ['entry-1', 'entry-2'], collectionId: 'local-b' });
    expect(JSON.parse(localStorage.getItem('journal-entry-collections-map') || '{}'))
      .toEqual({ existing: 'local-a', removeMe: 'local-a', 'entry-1': 'local-b', 'entry-2': 'local-b' });

    await result.current.mutateAsync({ entryIds: ['removeMe', 'entry-1'], collectionId: null });
    expect(JSON.parse(localStorage.getItem('journal-entry-collections-map') || '{}'))
      .toEqual({ existing: 'local-a', 'entry-2': 'local-b' });
    await result.current.mutateAsync({ entryIds: [], collectionId: 'local-c' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('bulk-assigns and removes authenticated entries through Supabase', async () => {
    mocks.user = { id: 'reader-1' };
    const { result } = renderHook(() => useBulkAssignEntriesCollection());

    await result.current.mutateAsync({ entryIds: ['entry-1', 'entry-2'], collectionId: 'col-1' });
    expect(mocks.upsert).toHaveBeenCalledWith([
      { user_id: 'reader-1', collection_id: 'col-1', entry_id: 'entry-1' },
      { user_id: 'reader-1', collection_id: 'col-1', entry_id: 'entry-2' },
    ], { onConflict: 'collection_id,entry_id' });

    await result.current.mutateAsync({ entryIds: ['entry-1', 'entry-2'], collectionId: null });
    expect(mocks.delete).toHaveBeenCalled();
    expect(mocks.in).toHaveBeenCalledWith('entry_id', ['entry-1', 'entry-2']);
  });

  it('bulk-tags guest entries with normalized, unique tags and enforces the tag cap', async () => {
    localStorage.setItem('journal-entry-meta', JSON.stringify({
      entry1: { favorite: true, tags: ['existing'] },
    }));
    const { result } = renderHook(() => useBulkTagEntries());
    const tags = [' #new ', 'new', '  ', '#history'];

    await result.current.mutateAsync({ entryIds: ['entry1', 'entry2'], tagsToAdd: tags });
    const saved = JSON.parse(localStorage.getItem('journal-entry-meta') || '{}');
    expect(saved.entry1).toEqual({ favorite: true, tags: ['existing', 'new', 'history'] });
    expect(saved.entry2).toEqual({ tags: ['new', 'history'] });

    const manyTags = Array.from({ length: 20 }, (_, index) => `tag-${index}`);
    await result.current.mutateAsync({ entryIds: ['entry2'], tagsToAdd: manyTags });
    expect(JSON.parse(localStorage.getItem('journal-entry-meta') || '{}').entry2.tags).toHaveLength(15);
    await result.current.mutateAsync({ entryIds: [], tagsToAdd: ['ignored'] });
    await result.current.mutateAsync({ entryIds: ['entry2'], tagsToAdd: [] });
  });

  it('persists bulk tags for authenticated entries and preserves existing metadata flags', async () => {
    mocks.user = { id: 'reader-1' };
    localStorage.setItem('journal-entry-meta', JSON.stringify({
      entry1: { favorite: true, pinned: true, tags: ['existing'] },
    }));
    const { result } = renderHook(() => useBulkTagEntries());

    await result.current.mutateAsync({ entryIds: ['entry1'], tagsToAdd: ['#new'] });
    expect(mocks.from).toHaveBeenCalledWith('journal_entry_metadata');
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'reader-1',
      entry_id: 'entry1',
      is_favorite: true,
      is_pinned: true,
      tags: ['existing', 'new'],
    }), { onConflict: 'user_id,entry_id' });
    mocks.mutationOptions.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['journal-entry-meta'] });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tags Applied' }));
  });
});
