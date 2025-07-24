import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      const { data, error } = await supabase
        .from('author_post_comment_likes')
        .select('user_id')
        .eq('comment_id', commentId);

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
      const { data: existing } = await supabase
        .from('author_post_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('author_post_comment_likes')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed', commentId };
      } else {
        const { error } = await supabase
          .from('author_post_comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
        return { action: 'added', commentId };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comment-likes', variables.commentId] });
    },
  });
};
