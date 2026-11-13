// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queryOptions: null as any,
  mutationOptions: null as any,
  invalidateQueries: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  upsert: vi.fn(),
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
} from './useJournalCollections';

describe('useJournalCollections', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.user = null;

    mocks.from.mockReturnValue({
      select: mocks.select,
      insert: mocks.insert,
      update: mocks.update,
      delete: mocks.delete,
      upsert: mocks.upsert,
    });
    mocks.select.mockReturnValue({
      eq: mocks.eq,
      order: mocks.order,
      single: mocks.single,
    });
    mocks.eq.mockReturnValue({
      order: mocks.order,
      single: mocks.single,
      eq: mocks.eq,
      select: mocks.select,
    });
    mocks.insert.mockReturnValue({
      select: mocks.select,
    });
    mocks.update.mockReturnValue({
      eq: mocks.eq,
    });
    mocks.delete.mockReturnValue({
      eq: mocks.eq,
    });
    mocks.upsert.mockReturnValue({
      select: mocks.select,
    });
    mocks.order.mockResolvedValue({ data: [], error: null });
    mocks.single.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('falls back to localStorage collections when user is not signed in', async () => {
    localStorage.setItem(
      'journal-collections',
      JSON.stringify(['Stoicism', 'Novel Ideas'])
    );

    renderHook(() => useJournalCollections());
    expect(mocks.queryOptions).toBeDefined();

    const collections = await mocks.queryOptions.queryFn();
    expect(collections).toHaveLength(2);
    expect(collections[0].name).toBe('Stoicism');
    expect(collections[1].name).toBe('Novel Ideas');
  });

  it('queries Supabase for journal collections when user is logged in', async () => {
    mocks.user = { id: 'reader-1' };
    const mockData = [
      {
        id: 'col-1',
        user_id: 'reader-1',
        name: 'Daily Reflections',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    mocks.order.mockResolvedValue({ data: mockData, error: null });

    renderHook(() => useJournalCollections());
    const collections = await mocks.queryOptions.queryFn();

    expect(mocks.from).toHaveBeenCalledWith('journal_collections');
    expect(collections).toEqual(mockData);
  });

  it('creates collection in localStorage when guest and creates in Supabase when signed in', async () => {
    // 1. Guest creation
    mocks.user = null;
    const { result: guestResult } = renderHook(() => useCreateJournalCollection());
    await guestResult.current.mutateAsync({ name: 'Philosophy' });

    const localSaved = JSON.parse(localStorage.getItem('journal-collections') || '[]');
    expect(localSaved).toHaveLength(1);
    expect(localSaved[0].name).toBe('Philosophy');

    // 2. Signed-in creation
    mocks.user = { id: 'reader-1' };
    mocks.single.mockResolvedValue({
      data: { id: 'col-db-1', user_id: 'reader-1', name: 'Science', description: null },
      error: null,
    });

    const { result: authResult } = renderHook(() => useCreateJournalCollection());
    const created = await authResult.current.mutateAsync({ name: 'Science' });

    expect(mocks.from).toHaveBeenCalledWith('journal_collections');
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'reader-1',
        name: 'Science',
      })
    );
    expect(created.name).toBe('Science');
  });

  it('renames a collection', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.single.mockResolvedValue({
      data: { id: 'col-1', user_id: 'reader-1', name: 'Updated Name' },
      error: null,
    });

    const { result } = renderHook(() => useRenameJournalCollection());
    const updated = await result.current.mutateAsync({ id: 'col-1', newName: 'Updated Name' });

    expect(mocks.from).toHaveBeenCalledWith('journal_collections');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Name' })
    );
    expect(updated.name).toBe('Updated Name');
  });

  it('deletes a collection', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.eq.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useDeleteJournalCollection());
    await result.current.mutateAsync('col-1');

    expect(mocks.from).toHaveBeenCalledWith('journal_collections');
    expect(mocks.delete).toHaveBeenCalled();
  });

  it('assigns and removes journal entry from collection', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.single.mockResolvedValue({
      data: { user_id: 'reader-1', collection_id: 'col-1', entry_id: 'hl-123' },
      error: null,
    });

    const { result } = renderHook(() => useAssignEntryCollection());

    // Assign
    await result.current.mutateAsync({ entryId: 'hl-123', collectionId: 'col-1' });
    expect(mocks.from).toHaveBeenCalledWith('journal_entry_collections');
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'reader-1',
        collection_id: 'col-1',
        entry_id: 'hl-123',
      }),
      { onConflict: 'collection_id,entry_id' }
    );

    // Remove
    mocks.eq.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await result.current.mutateAsync({ entryId: 'hl-123', collectionId: null });
    expect(mocks.delete).toHaveBeenCalled();
  });
});
