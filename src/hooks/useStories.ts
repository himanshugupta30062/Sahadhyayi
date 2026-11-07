import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';
import { estimateReadingMinutes } from '@/lib/storyValidation';

export interface Story {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  genre: string;
  tags: string[];
  user_id: string;
  author_name: string | null;
  story_type: 'standalone' | 'series';
  status: 'draft' | 'published' | 'archived';
  completion_status: 'ongoing' | 'completed';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  reads_count: number;
  likes_count: number;
  bookmarks_count: number;
  follows_count: number;
  parts_count: number;
  reading_time_minutes: number;
  user_liked?: boolean;
  user_bookmarked?: boolean;
  user_following?: boolean;
  last_read_part_number?: number;
  profiles?: {
    full_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}

export interface StoryPart {
  id: string;
  story_id: string;
  part_number: number;
  title: string;
  content: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  part_id?: string | null;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}

export interface StoryFilterOptions {
  filter?: 'all' | 'trending' | 'recent' | 'updated' | 'completed' | 'my-stories';
  genre?: string;
  search?: string;
}

/**
 * Fetch stories feed with filtering, search and sorting.
 */
export const useStories = (options?: StoryFilterOptions) => {
  const { user } = useAuth();
  const filter = options?.filter || 'all';
  const genre = options?.genre && options.genre !== 'All' ? options.genre : null;
  const search = options?.search?.trim() || null;

  return useQuery({
    queryKey: ['stories', filter, genre, search, user?.id],
    queryFn: async (): Promise<Story[]> => {
      let query = supabase.from('stories').select(`
        *,
        profiles:user_id (
          full_name,
          username,
          profile_photo_url
        )
      `);

      if (filter === 'my-stories') {
        if (!user) return [];
        query = query.eq('user_id', user.id);
      } else {
        // Only published stories for discovery feed
        query = query.eq('status', 'published');
      }

      if (genre) {
        query = query.eq('genre', genre);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author_name.ilike.%${search}%`);
      }

      switch (filter) {
        case 'trending':
          query = query.order('views_count', { ascending: false });
          break;
        case 'updated':
          query = query.order('updated_at', { ascending: false });
          break;
        case 'completed':
          query = query.eq('completion_status', 'completed').order('published_at', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);
      if (error) {
        console.error('Failed to load stories feed:', error);
        return [];
      }

      const stories = (data || []) as unknown as Story[];

      // If user is logged in, attach their interaction flags
      if (user?.id && stories.length > 0) {
        const storyIds = stories.map((s) => s.id);
        const [likesRes, bookmarksRes, followsRes, progressRes] = await Promise.all([
          supabase.from('story_likes').select('story_id').eq('user_id', user.id).in('story_id', storyIds),
          supabase.from('story_bookmarks').select('story_id').eq('user_id', user.id).in('story_id', storyIds),
          supabase.from('story_follows').select('story_id').eq('user_id', user.id).in('story_id', storyIds),
          supabase.from('story_reading_progress').select('story_id, last_read_part_number').eq('user_id', user.id).in('story_id', storyIds),
        ]);

        const likedSet = new Set((likesRes.data || []).map((l: any) => l.story_id));
        const bookmarkedSet = new Set((bookmarksRes.data || []).map((b: any) => b.story_id));
        const followedSet = new Set((followsRes.data || []).map((f: any) => f.story_id));
        const progressMap = new Map((progressRes.data || []).map((p: any) => [p.story_id, p.last_read_part_number]));

        return stories.map((s) => ({
          ...s,
          user_liked: likedSet.has(s.id),
          user_bookmarked: bookmarkedSet.has(s.id),
          user_following: followedSet.has(s.id),
          last_read_part_number: progressMap.get(s.id) || 1,
        }));
      }

      return stories;
    },
  });
};

/**
 * Fetch stories the user has active reading progress on ("Continue Reading").
 */
export const useContinueReadingStories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['continue-reading-stories', user?.id],
    queryFn: async (): Promise<Story[]> => {
      if (!user) return [];

      const { data: progressRows, error: progressErr } = await supabase
        .from('story_reading_progress')
        .select('story_id, last_read_part_number, progress_percentage, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (progressErr || !progressRows || progressRows.length === 0) return [];

      const storyIds = progressRows.map((r: any) => r.story_id);
      const { data: storiesData, error: storiesErr } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            profile_photo_url
          )
        `)
        .in('id', storyIds)
        .eq('status', 'published');

      if (storiesErr || !storiesData) return [];

      const progressMap = new Map(progressRows.map((r: any) => [r.story_id, r.last_read_part_number]));
      return (storiesData as unknown as Story[]).map((s) => ({
        ...s,
        last_read_part_number: progressMap.get(s.id) || 1,
      }));
    },
    enabled: !!user,
  });
};

/**
 * Fetch single story details with all published parts.
 */
export const useStoryDetails = (storyId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['story-details', storyId, user?.id],
    queryFn: async () => {
      if (!storyId) throw new Error('Story ID required');

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            username,
            profile_photo_url,
            bio
          )
        `)
        .eq('id', storyId)
        .maybeSingle();

      if (storyError) throw storyError;
      if (!storyData) throw new Error('Story not found');

      const isAuthor = user?.id === storyData.user_id;

      // Parts query: author sees all parts, public sees published parts only
      let partsQuery = supabase
        .from('story_parts')
        .select('*')
        .eq('story_id', storyId)
        .order('part_number', { ascending: true });

      if (!isAuthor) {
        partsQuery = partsQuery.eq('status', 'published');
      }

      const { data: partsData, error: partsError } = await partsQuery;
      if (partsError) throw partsError;

      let user_liked = false;
      let user_bookmarked = false;
      let user_following = false;
      let last_read_part_number = 1;

      if (user?.id) {
        const [like, bmark, follow, prog] = await Promise.all([
          supabase.from('story_likes').select('id').eq('story_id', storyId).eq('user_id', user.id).maybeSingle(),
          supabase.from('story_bookmarks').select('id').eq('story_id', storyId).eq('user_id', user.id).maybeSingle(),
          supabase.from('story_follows').select('id').eq('story_id', storyId).eq('user_id', user.id).maybeSingle(),
          supabase.from('story_reading_progress').select('last_read_part_number').eq('story_id', storyId).eq('user_id', user.id).maybeSingle(),
        ]);

        user_liked = Boolean(like.data);
        user_bookmarked = Boolean(bmark.data);
        user_following = Boolean(follow.data);
        last_read_part_number = prog.data?.last_read_part_number || 1;
      }

      // Increment view count asynchronously
      void supabase
        .from('stories')
        .update({ views_count: (storyData.views_count || 0) + 1 })
        .eq('id', storyId);

      return {
        story: {
          ...storyData,
          user_liked,
          user_bookmarked,
          user_following,
          last_read_part_number,
        } as Story,
        parts: (partsData || []) as StoryPart[],
        isAuthor,
      };
    },
    enabled: !!storyId,
  });
};

/**
 * Fetch a specific story part for the reader.
 */
export const useStoryPart = (storyId?: string, partNumber?: number) => {
  const { user } = useAuth();
  const num = partNumber || 1;

  return useQuery({
    queryKey: ['story-part', storyId, num, user?.id],
    queryFn: async () => {
      if (!storyId) throw new Error('Story ID required');

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          genre,
          user_id,
          author_name,
          story_type,
          status,
          completion_status,
          parts_count,
          reading_time_minutes,
          profiles:user_id (
            full_name,
            username,
            profile_photo_url
          )
        `)
        .eq('id', storyId)
        .maybeSingle();

      if (storyError) throw storyError;
      if (!storyData) throw new Error('Story not found');

      const isAuthor = user?.id === storyData.user_id;

      // Query requested part
      let partQuery = supabase
        .from('story_parts')
        .select('*')
        .eq('story_id', storyId)
        .eq('part_number', num);

      if (!isAuthor) {
        partQuery = partQuery.eq('status', 'published');
      }

      const { data: partData, error: partError } = await partQuery.maybeSingle();
      if (partError) throw partError;
      if (!partData) throw new Error(`Part ${num} not found or not published yet.`);

      // Query all parts headers (for drawer chapter selection)
      let allPartsQuery = supabase
        .from('story_parts')
        .select('id, part_number, title, status')
        .eq('story_id', storyId)
        .order('part_number', { ascending: true });

      if (!isAuthor) {
        allPartsQuery = allPartsQuery.eq('status', 'published');
      }

      const { data: allParts } = await allPartsQuery;

      return {
        story: storyData as unknown as Story,
        part: partData as StoryPart,
        allParts: (allParts || []) as Array<{ id: string; part_number: number; title: string; status: string }>,
        isAuthor,
      };
    },
    enabled: !!storyId && num > 0,
  });
};

/**
 * Story Mutations
 */
export const useCreateStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string | null;
      cover_image_url?: string | null;
      genre: string;
      tags: string[];
      story_type: 'standalone' | 'series';
      status?: 'draft' | 'published';
      completion_status?: 'ongoing' | 'completed';
      initial_part?: {
        title: string;
        content: string;
        status?: 'draft' | 'published';
      };
    }) => {
      if (!user) throw new Error('Authentication required');

      const authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Reader';
      const isPublished = payload.status === 'published';
      const initialMinutes = payload.initial_part?.content ? estimateReadingMinutes(payload.initial_part.content) : 1;

      const { data: story, error: storyErr } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: payload.title.trim(),
          description: payload.description?.trim() || null,
          cover_image_url: payload.cover_image_url || null,
          genre: payload.genre || 'General',
          tags: payload.tags || [],
          author_name: authorName,
          story_type: payload.story_type,
          status: payload.status || 'draft',
          completion_status: payload.completion_status || (payload.story_type === 'standalone' ? 'completed' : 'ongoing'),
          published_at: isPublished ? new Date().toISOString() : null,
          parts_count: payload.initial_part ? 1 : 0,
          reading_time_minutes: initialMinutes,
        })
        .select()
        .single();

      if (storyErr) throw storyErr;

      // If an initial part was provided, create part 1
      if (payload.initial_part) {
        const { error: partErr } = await supabase.from('story_parts').insert({
          story_id: story.id,
          part_number: 1,
          title: payload.initial_part.title.trim(),
          content: payload.initial_part.content.trim(),
          status: payload.initial_part.status || payload.status || 'draft',
          published_at: isPublished ? new Date().toISOString() : null,
        });

        if (partErr) throw partErr;
      }

      return story;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story saved successfully!');
    },
  });
};

export const useUpdateStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      storyId: string;
      title?: string;
      description?: string | null;
      cover_image_url?: string | null;
      genre?: string;
      tags?: string[];
      status?: 'draft' | 'published' | 'archived';
      completion_status?: 'ongoing' | 'completed';
    }) => {
      if (!user) throw new Error('Authentication required');

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.title !== undefined) updates.title = payload.title.trim();
      if (payload.description !== undefined) updates.description = payload.description?.trim() || null;
      if (payload.cover_image_url !== undefined) updates.cover_image_url = payload.cover_image_url;
      if (payload.genre !== undefined) updates.genre = payload.genre;
      if (payload.tags !== undefined) updates.tags = payload.tags;
      if (payload.status !== undefined) {
        updates.status = payload.status;
        if (payload.status === 'published') {
          updates.published_at = new Date().toISOString();
        }
      }
      if (payload.completion_status !== undefined) {
        updates.completion_status = payload.completion_status;
      }

      const { data, error } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', payload.storyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['stories'] });
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      toast.success('Story updated.');
    },
  });
};

export const useCreateStoryPart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      storyId: string;
      partNumber: number;
      title: string;
      content: string;
      status?: 'draft' | 'published';
    }) => {
      if (!user) throw new Error('Authentication required');

      const isPublished = payload.status === 'published';
      const { data, error } = await supabase
        .from('story_parts')
        .insert({
          story_id: payload.storyId,
          part_number: payload.partNumber,
          title: payload.title.trim(),
          content: payload.content.trim(),
          status: payload.status || 'draft',
          published_at: isPublished ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update story's parts count and recalculate reading time
      const { data: allParts } = await supabase
        .from('story_parts')
        .select('content, status')
        .eq('story_id', payload.storyId);

      const totalWords = (allParts || []).reduce((acc: number, p: any) => {
        return acc + (p.content?.split(/\s+/).filter(Boolean).length || 0);
      }, 0);

      await supabase
        .from('stories')
        .update({
          parts_count: (allParts || []).length,
          reading_time_minutes: Math.max(1, Math.ceil(totalWords / 200)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.storyId);

      return data;
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      void queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Part added successfully!');
    },
  });
};

export const useUpdateStoryPart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      partId: string;
      storyId: string;
      title?: string;
      content?: string;
      status?: 'draft' | 'published';
    }) => {
      if (!user) throw new Error('Authentication required');

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.title !== undefined) updates.title = payload.title.trim();
      if (payload.content !== undefined) updates.content = payload.content.trim();
      if (payload.status !== undefined) {
        updates.status = payload.status;
        if (payload.status === 'published') {
          updates.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('story_parts')
        .update(updates)
        .eq('id', payload.partId)
        .select()
        .single();

      if (error) throw error;

      // Recalculate reading time
      const { data: allParts } = await supabase
        .from('story_parts')
        .select('content')
        .eq('story_id', payload.storyId);

      const totalWords = (allParts || []).reduce((acc: number, p: any) => {
        return acc + (p.content?.split(/\s+/).filter(Boolean).length || 0);
      }, 0);

      await supabase
        .from('stories')
        .update({
          reading_time_minutes: Math.max(1, Math.ceil(totalWords / 200)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.storyId);

      return data;
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      void queryClient.invalidateQueries({ queryKey: ['story-part', vars.storyId] });
      toast.success('Part updated successfully!');
    },
  });
};

export const useDeleteStoryPart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { partId: string; storyId: string }) => {
      if (!user) throw new Error('Authentication required');

      const { error } = await supabase
        .from('story_parts')
        .delete()
        .eq('id', payload.partId)
        .eq('story_id', payload.storyId);

      if (error) throw error;

      // Update story's parts count and recalculate reading time
      const { data: allParts } = await supabase
        .from('story_parts')
        .select('content')
        .eq('story_id', payload.storyId);

      const totalWords = (allParts || []).reduce((acc: number, p: any) => {
        return acc + (p.content?.split(/\s+/).filter(Boolean).length || 0);
      }, 0);

      await supabase
        .from('stories')
        .update({
          parts_count: (allParts || []).length,
          reading_time_minutes: Math.max(1, Math.ceil(totalWords / 200)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.storyId);
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      void queryClient.invalidateQueries({ queryKey: ['story-part', vars.storyId] });
      void queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Chapter deleted.');
    },
  });
};

export const useReorderStoryParts = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      storyId: string;
      orderedPartIds: string[];
    }) => {
      if (!user) throw new Error('Authentication required');

      for (let i = 0; i < payload.orderedPartIds.length; i++) {
        const partId = payload.orderedPartIds[i];
        const { error } = await supabase
          .from('story_parts')
          .update({ part_number: i + 1, updated_at: new Date().toISOString() })
          .eq('id', partId)
          .eq('story_id', payload.storyId);

        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      void queryClient.invalidateQueries({ queryKey: ['story-part', vars.storyId] });
      toast.success('Chapter order updated successfully!');
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) throw new Error('Authentication required');

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story deleted.');
    },
  });
};

/**
 * Interactions: Likes, Bookmarks, Follows, Reading Progress
 */
export const useToggleStoryLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, isLiked }: { storyId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Please sign in to like stories.');

      if (isLiked) {
        await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('story_likes')
          .insert({ story_id: storyId, user_id: user.id });
      }

      // Sync likes count on story
      const { count } = await supabase
        .from('story_likes')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', storyId);

      await supabase
        .from('stories')
        .update({ likes_count: count || 0 })
        .eq('id', storyId);

      return !isLiked;
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      void queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
};

export const useToggleStoryBookmark = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, isBookmarked }: { storyId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Please sign in to bookmark stories.');

      if (isBookmarked) {
        await supabase
          .from('story_bookmarks')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('story_bookmarks')
          .insert({ story_id: storyId, user_id: user.id });
      }

      const { count } = await supabase
        .from('story_bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', storyId);

      await supabase
        .from('stories')
        .update({ bookmarks_count: count || 0 })
        .eq('id', storyId);

      return !isBookmarked;
    },
    onSuccess: (isBookmarked, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      void queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success(isBookmarked ? 'Story bookmarked!' : 'Bookmark removed.');
    },
  });
};

export const useToggleStoryFollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, isFollowing }: { storyId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Please sign in to follow story series.');

      if (isFollowing) {
        await supabase
          .from('story_follows')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('story_follows')
          .insert({ story_id: storyId, user_id: user.id });
      }

      const { count } = await supabase
        .from('story_follows')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', storyId);

      await supabase
        .from('stories')
        .update({ follows_count: count || 0 })
        .eq('id', storyId);

      return !isFollowing;
    },
    onSuccess: (isFollowing, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
      toast.success(isFollowing ? 'Following story for chapter updates!' : 'Unfollowed story.');
    },
  });
};

export const useSaveStoryProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      storyId: string;
      partId: string;
      partNumber: number;
      percentage: number;
    }) => {
      if (!user) return;

      await supabase
        .from('story_reading_progress')
        .upsert({
          story_id: payload.storyId,
          user_id: user.id,
          last_read_part_id: payload.partId,
          last_read_part_number: payload.partNumber,
          progress_percentage: Math.min(100, Math.max(0, Math.round(payload.percentage))),
          updated_at: new Date().toISOString(),
        });
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['continue-reading-stories'] });
      void queryClient.invalidateQueries({ queryKey: ['story-details', vars.storyId] });
    },
  });
};

export const useStoryComments = (storyId?: string) => {
  return useQuery({
    queryKey: ['story-comments', storyId],
    queryFn: async () => {
      if (!storyId) return [];
      const { data, error } = await supabase
        .from('story_comments')
        .select(`
          id,
          story_id,
          user_id,
          part_id,
          content,
          created_at,
          profiles:user_id (
            full_name,
            username,
            profile_photo_url
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to load story comments:', error);
        return [];
      }
      return (data || []) as unknown as StoryComment[];
    },
    enabled: !!storyId,
  });
};

export const useAddStoryComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      storyId: string;
      content: string;
      partId?: string | null;
    }) => {
      if (!user) throw new Error('Sign in to leave a comment.');
      const content = payload.content.trim();
      if (!content) throw new Error('Comment cannot be empty.');

      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: payload.storyId,
          user_id: user.id,
          part_id: payload.partId || null,
          content,
        })
        .select(`
          id,
          story_id,
          user_id,
          part_id,
          content,
          created_at,
          profiles:user_id (
            full_name,
            username,
            profile_photo_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['story-comments', vars.storyId] });
      toast.success('Comment posted!');
    },
  });
};
