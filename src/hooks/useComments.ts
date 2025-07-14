
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    avatar: string;
  };
  replies?: Comment[];
}

export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            profile_photo_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group comments and replies
      const comments: Comment[] = [];
      const repliesMap: { [key: string]: Comment[] } = {};

      data?.forEach((comment) => {
        const commentWithUser = {
          ...comment,
          user: {
            name: comment.profiles?.full_name || 'Anonymous',
            avatar: comment.profiles?.profile_photo_url || '',
          },
        };

        if (comment.parent_comment_id) {
          if (!repliesMap[comment.parent_comment_id]) {
            repliesMap[comment.parent_comment_id] = [];
          }
          repliesMap[comment.parent_comment_id].push(commentWithUser);
        } else {
          comments.push(commentWithUser);
        }
      });

      // Attach replies to their parent comments
      comments.forEach((comment) => {
        comment.replies = repliesMap[comment.id] || [];
      });

      return comments;
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content, parentCommentId }: { 
      postId: string; 
      content: string; 
      parentCommentId?: string;
    }) => {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          content,
          parent_comment_id: parentCommentId || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      toast({
        title: "Comment posted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Failed to post comment",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, content, postId }: { 
      commentId: string; 
      content: string;
      postId: string;
    }) => {
      const { data, error } = await supabase
        .from('post_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      toast({
        title: "Comment updated successfully!",
      });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      toast({
        title: "Comment deleted successfully!",
      });
    },
  });
};
