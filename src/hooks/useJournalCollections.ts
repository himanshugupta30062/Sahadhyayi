import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/components/ui/use-toast';

export interface JournalCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCollectionMap {
  [entryId: string]: string; // entryId -> collectionId
}

const LOCAL_COLLECTIONS_KEY = 'journal-collections';
const LOCAL_MAPPINGS_KEY = 'journal-entry-collections-map';

function getLocalCollections(): JournalCollection[] {
  try {
    const raw = localStorage.getItem(LOCAL_COLLECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any, idx: number) => {
        if (typeof item === 'string') {
          return {
            id: `local-${item.toLowerCase().replace(/\s+/g, '-')}`,
            user_id: 'guest',
            name: item,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
          };
        }
        return item as JournalCollection;
      });
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalCollections(cols: JournalCollection[]): void {
  try {
    localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(cols));
  } catch {
    // ignore
  }
}

function getLocalMappings(): JournalEntryCollectionMap {
  try {
    const raw = localStorage.getItem(LOCAL_MAPPINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalMappings(map: JournalEntryCollectionMap): void {
  try {
    localStorage.setItem(LOCAL_MAPPINGS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function useJournalCollections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journal-collections', user?.id || 'guest'],
    queryFn: async (): Promise<JournalCollection[]> => {
      if (!user) {
        return getLocalCollections();
      }

      const { data, error } = await supabase
        .from('journal_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not load journal collections from Supabase:', error);
        return getLocalCollections();
      }

      return (data || []) as JournalCollection[];
    },
  });
}

export function useJournalEntryMappings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journal-entry-collections', user?.id || 'guest'],
    queryFn: async (): Promise<JournalEntryCollectionMap> => {
      if (!user) {
        return getLocalMappings();
      }

      const { data, error } = await supabase
        .from('journal_entry_collections')
        .select('entry_id, collection_id')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Could not load entry collection mappings:', error);
        return getLocalMappings();
      }

      const map: JournalEntryCollectionMap = {};
      data?.forEach((row: { entry_id: string; collection_id: string }) => {
        map[row.entry_id] = row.collection_id;
      });
      return map;
    },
  });
}

export function useCreateJournalCollection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const cleanName = name.trim();
      if (!cleanName) throw new Error('Collection name cannot be empty');

      if (!user) {
        const local = getLocalCollections();
        if (local.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
          throw new Error('Collection already exists');
        }
        const newCol: JournalCollection = {
          id: `local-${Date.now()}`,
          user_id: 'guest',
          name: cleanName,
          description: description?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveLocalCollections([...local, newCol]);
        return newCol;
      }

      const { data, error } = await supabase
        .from('journal_collections')
        .insert({
          user_id: user.id,
          name: cleanName,
          description: description?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as JournalCollection;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal-collections'] });
      toast({ title: 'Collection Created', description: 'New reading journal collection added.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create collection',
        variant: 'destructive',
      });
    },
  });
}

export function useRenameJournalCollection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const cleanName = newName.trim();
      if (!cleanName) throw new Error('Collection name cannot be empty');

      if (!user || id.startsWith('local-')) {
        const local = getLocalCollections();
        const updated = local.map((c) => (c.id === id ? { ...c, name: cleanName, updated_at: new Date().toISOString() } : c));
        saveLocalCollections(updated);
        return updated.find((c) => c.id === id);
      }

      const { data, error } = await supabase
        .from('journal_collections')
        .update({ name: cleanName, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JournalCollection;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal-collections'] });
      toast({ title: 'Collection Renamed', description: 'Updated collection title.' });
    },
  });
}

export function useDeleteJournalCollection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || id.startsWith('local-')) {
        const local = getLocalCollections();
        saveLocalCollections(local.filter((c) => c.id !== id));
        const mappings = getLocalMappings();
        const newMappings = { ...mappings };
        Object.keys(newMappings).forEach((entryId) => {
          if (newMappings[entryId] === id) {
            delete newMappings[entryId];
          }
        });
        saveLocalMappings(newMappings);
        return;
      }

      const { error } = await supabase
        .from('journal_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal-collections'] });
      void queryClient.invalidateQueries({ queryKey: ['journal-entry-collections'] });
      toast({ title: 'Collection Deleted', description: 'Collection removed from journal.' });
    },
  });
}

export function useAssignEntryCollection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, collectionId }: { entryId: string; collectionId: string | null }) => {
      if (!user) {
        const mappings = getLocalMappings();
        if (!collectionId) {
          delete mappings[entryId];
        } else {
          mappings[entryId] = collectionId;
        }
        saveLocalMappings(mappings);
        return null;
      }

      if (!collectionId) {
        // Remove from collection
        const { error } = await supabase
          .from('journal_entry_collections')
          .delete()
          .eq('user_id', user.id)
          .eq('entry_id', entryId);

        if (error) throw error;
        return null;
      }

      // Upsert collection assignment
      const { data, error } = await supabase
        .from('journal_entry_collections')
        .upsert(
          {
            user_id: user.id,
            collection_id: collectionId,
            entry_id: entryId,
          },
          { onConflict: 'collection_id,entry_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal-entry-collections'] });
      toast({ title: 'Collection Updated', description: 'Entry collection assignment saved.' });
    },
  });
}

// -------------------------------------------------------------
// Entry Metadata (Favorites, Pins, Tags) Persistence Hooks
// -------------------------------------------------------------

export interface JournalEntryMeta {
  favorite?: boolean;
  pinned?: boolean;
  tags?: string[];
  collection?: string;
}

const LOCAL_META_KEY = 'journal-entry-meta';

function getLocalMeta(): Record<string, JournalEntryMeta> {
  try {
    const raw = localStorage.getItem(LOCAL_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalMeta(meta: Record<string, JournalEntryMeta>): void {
  try {
    localStorage.setItem(LOCAL_META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

export function useJournalEntryMeta() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journal-entry-meta', user?.id || 'guest'],
    queryFn: async (): Promise<Record<string, JournalEntryMeta>> => {
      if (!user) {
        return getLocalMeta();
      }

      const { data, error } = await supabase
        .from('journal_entry_metadata')
        .select('entry_id, is_favorite, is_pinned, tags')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Could not load entry metadata from Supabase, falling back to local storage:', error);
        return getLocalMeta();
      }

      const metaMap: Record<string, JournalEntryMeta> = getLocalMeta();
      data?.forEach((row: { entry_id: string; is_favorite?: boolean; is_pinned?: boolean; tags?: string[] }) => {
        metaMap[row.entry_id] = {
          ...metaMap[row.entry_id],
          favorite: Boolean(row.is_favorite),
          pinned: Boolean(row.is_pinned),
          tags: row.tags || [],
        };
      });

      return metaMap;
    },
  });
}

export function useUpdateJournalEntryMeta() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      meta,
    }: {
      entryId: string;
      meta: Partial<JournalEntryMeta>;
    }) => {
      // Always update local cache
      const local = getLocalMeta();
      const updatedItem = { ...(local[entryId] || {}), ...meta };
      local[entryId] = updatedItem;
      saveLocalMeta(local);

      if (!user) return updatedItem;

      const { data, error } = await supabase
        .from('journal_entry_metadata')
        .upsert(
          {
            user_id: user.id,
            entry_id: entryId,
            is_favorite: updatedItem.favorite ?? false,
            is_pinned: updatedItem.pinned ?? false,
            tags: updatedItem.tags || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,entry_id' }
        )
        .select()
        .single();

      if (error) {
        console.warn('Could not persist entry metadata to Supabase:', error);
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal-entry-meta'] });
    },
  });
}

// -------------------------------------------------------------
// Bulk Actions
// -------------------------------------------------------------

export function useBulkAssignEntriesCollection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryIds,
      collectionId,
    }: {
      entryIds: string[];
      collectionId: string | null;
    }) => {
      if (entryIds.length === 0) return;

      if (!user) {
        const mappings = getLocalMappings();
        entryIds.forEach((id) => {
          if (!collectionId) {
            delete mappings[id];
          } else {
            mappings[id] = collectionId;
          }
        });
        saveLocalMappings(mappings);
        return;
      }

      if (!collectionId) {
        const { error } = await supabase
          .from('journal_entry_collections')
          .delete()
          .eq('user_id', user.id)
          .in('entry_id', entryIds);

        if (error) throw error;
      } else {
        const rows = entryIds.map((id) => ({
          user_id: user.id,
          collection_id: collectionId,
          entry_id: id,
        }));

        const { error } = await supabase
          .from('journal_entry_collections')
          .upsert(rows, { onConflict: 'collection_id,entry_id' });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal-entry-collections'] });
      toast({
        title: 'Bulk Assignment Complete',
        description: 'Selected entries updated.',
      });
    },
  });
}

export function useBulkTagEntries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryIds,
      tagsToAdd,
    }: {
      entryIds: string[];
      tagsToAdd: string[];
    }) => {
      if (entryIds.length === 0 || tagsToAdd.length === 0) return;

      const local = getLocalMeta();
      const sanitizedTags = tagsToAdd.map((t) => t.trim().replace(/^#/, '')).filter(Boolean);

      for (const id of entryIds) {
        const currentTags = local[id]?.tags || [];
        const merged = Array.from(new Set([...currentTags, ...sanitizedTags])).slice(0, 15);
        local[id] = { ...(local[id] || {}), tags: merged };

        if (user) {
          await supabase.from('journal_entry_metadata').upsert(
            {
              user_id: user.id,
              entry_id: id,
              is_favorite: local[id]?.favorite ?? false,
              is_pinned: local[id]?.pinned ?? false,
              tags: merged,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,entry_id' }
          );
        }
      }

      saveLocalMeta(local);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal-entry-meta'] });
      toast({
        title: 'Tags Applied',
        description: 'Applied tags to selected journal entries.',
      });
    },
  });
}

