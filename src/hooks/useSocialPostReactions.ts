import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/components/ui/use-toast';

export type LiteraryReactionType =
  | 'loved'
  | 'insightful'
  | 'devastating'
  | 'cozy'
  | 'unputdownable'
  | 'thought_provoking';

export interface ReactionMetadata {
  type: LiteraryReactionType;
  label: string;
  emoji: string;
  description: string;
  activeColor: string;
}

export const LITERARY_REACTIONS: Record<LiteraryReactionType, ReactionMetadata> = {
  loved: {
    type: 'loved',
    label: 'Loved',
    emoji: '❤️',
    description: 'Adored this book or reflection',
    activeColor: 'text-rose-600 dark:text-rose-400',
  },
  insightful: {
    type: 'insightful',
    label: 'Insightful',
    emoji: '💡',
    description: 'Brought profound literary clarity',
    activeColor: 'text-amber-500 dark:text-amber-400',
  },
  devastating: {
    type: 'devastating',
    label: 'Devastating',
    emoji: '💔',
    description: 'Emotional, poignant, or tragic',
    activeColor: 'text-indigo-600 dark:text-indigo-400',
  },
  cozy: {
    type: 'cozy',
    label: 'Cozy Read',
    emoji: '☕',
    description: 'Warm, comforting bibliophile vibes',
    activeColor: 'text-amber-700 dark:text-amber-500',
  },
  unputdownable: {
    type: 'unputdownable',
    label: 'Page Turner',
    emoji: '🔥',
    description: 'Gripping, high-octane narrative',
    activeColor: 'text-orange-500 dark:text-orange-400',
  },
  thought_provoking: {
    type: 'thought_provoking',
    label: 'Thought-Provoking',
    emoji: '🤔',
    description: 'Challenged ideas and worldview',
    activeColor: 'text-emerald-600 dark:text-emerald-400',
  },
};

export interface PostReactionSummary {
  user_reaction: LiteraryReactionType | null;
  counts: Partial<Record<LiteraryReactionType, number>>;
  total: number;
}

export const useBatchPostReactions = (postIds: string[]) => {
  const { user } = useAuth();

  return useQuery<Record<string, PostReactionSummary>>({
    queryKey: ['post-reactions-batch', postIds.sort().join(',')],
    queryFn: async () => {
      if (!postIds || postIds.length === 0) return {};

      try {
        const { data, error } = await supabase.rpc('get_batch_post_reactions', {
          p_post_ids: postIds,
        });

        if (!error && data && typeof data === 'object') {
          return data as Record<string, PostReactionSummary>;
        }
      } catch (err) {
        console.warn('get_batch_post_reactions RPC failed, falling back to direct table query:', err);
      }

      // Fallback: direct table query if RPC is pending migration
      const { data: rows } = await supabase
        .from('social_post_reactions')
        .select('post_id, user_id, reaction_type')
        .in('post_id', postIds);

      const result: Record<string, PostReactionSummary> = {};
      for (const id of postIds) {
        result[id] = { user_reaction: null, counts: {}, total: 0 };
      }

      if (rows) {
        for (const row of rows) {
          const summary = result[row.post_id];
          if (!summary) continue;

          const rType = row.reaction_type as LiteraryReactionType;
          summary.counts[rType] = (summary.counts[rType] || 0) + 1;
          summary.total += 1;

          if (user?.id && row.user_id === user.id) {
            summary.user_reaction = rType;
          }
        }
      }

      return result;
    },
    enabled: postIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds fresh
  });
};

export const useTogglePostReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      postId,
      reactionType,
    }: {
      postId: string;
      reactionType: LiteraryReactionType;
    }) => {
      if (!user) throw new Error('Please sign in to react to posts');

      // Try RPC first
      try {
        const { data, error } = await supabase.rpc('toggle_social_post_reaction', {
          p_post_id: postId,
          p_reaction_type: reactionType,
        });
        if (!error && data) {
          return data as PostReactionSummary;
        }
      } catch (rpcErr) {
        console.warn('RPC toggle_social_post_reaction error, using direct table fallback:', rpcErr);
      }

      // Fallback: direct table toggle
      const { data: existing } = await supabase
        .from('social_post_reactions')
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('social_post_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
        return { user_reaction: reactionType, counts: { [reactionType]: 1 }, total: 1 };
      } else if (existing.reaction_type === reactionType) {
        await supabase
          .from('social_post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        return { user_reaction: null, counts: {}, total: 0 };
      } else {
        await supabase
          .from('social_post_reactions')
          .update({ reaction_type: reactionType })
          .eq('post_id', postId)
          .eq('user_id', user.id);
        return { user_reaction: reactionType, counts: { [reactionType]: 1 }, total: 1 };
      }
    },
    onMutate: async ({ postId, reactionType }) => {
      await queryClient.cancelQueries({ queryKey: ['post-reactions-batch'] });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-reactions-batch'] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (err) => {
      toast({
        title: 'Could not save reaction',
        description: err instanceof Error ? err.message : 'Please check your connection',
        variant: 'destructive',
      });
    },
  });
};

