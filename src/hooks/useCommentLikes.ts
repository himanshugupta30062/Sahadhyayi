import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

interface CommentLikeData {
  count: number;
  isLiked: boolean;
}

export const useCommentLikes = (commentId?: string) => {
  const { user } = useAuth();
  return useQuery<CommentLikeData>({
    queryKey: ['comment-likes', commentId, user?.id],
    queryFn: async () => {
      if (!commentId) return { count: 0, isLiked: false };
      // Since author_post_comment_likes table doesn't exist, use author_post_reactions as fallback
      const { data, error } = await supabase
        .from('author_post_reactions')
        .select('user_id')
        .eq('post_id', commentId)
        .eq('reaction_type', 'like');

      if (error) throw error;

      const count = data?.length ?? 0;
      const isLiked = !!data?.find(like => like.user_id === user?.id);
      return { count, isLiked };
    },
    enabled: !!commentId,
  });
};

export const useToggleCommentLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      // Use author_post_reactions table instead since author_post_comment_likes doesn't exist
      const { data: existing } = await supabase
        .from('author_post_reactions')
        .select('id')
        .eq('post_id', commentId)
        .eq('user_id', user.id)
        .eq('reaction_type', 'like')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('author_post_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed', commentId };
      } else {
        const { error } = await supabase
          .from('author_post_reactions')
          .insert({ 
            post_id: commentId, 
            user_id: user.id, 
            reaction_type: 'like' 
          });
        if (error) throw error;
        return { action: 'added', commentId };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comment-likes', variables.commentId] });
    },
  });
};
