
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id?: string;
  user: {
    full_name: string;
    profile_photo_url?: string;
  };
  replies?: Comment[];
}

export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          content,
          created_at,
          user_id,
          parent_comment_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles for all commenters
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);

      // Map comments with user data
      const commentsWithUsers = comments?.map(comment => ({
        ...comment,
        user: profiles?.find(p => p.id === comment.user_id) || {
          full_name: 'Unknown User',
          profile_photo_url: null
        }
      })) || [];

      // Organize into threads (parent comments with replies)
      const parentComments = commentsWithUsers.filter(c => !c.parent_comment_id);
      const replies = commentsWithUsers.filter(c => c.parent_comment_id);

      return parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_comment_id === parent.id)
      }));
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, parentCommentId }: {
      postId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          content,
          user_id: user.id,
          parent_comment_id: parentCommentId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      toast({ title: 'Comment added successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    }
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content, postId }: {
      id: string;
      content: string;
      postId: string;
    }) => {
      const { data, error } = await supabase
        .from('post_comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, postId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['comments', result.postId] });
      toast({ title: 'Comment updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to update comment', variant: 'destructive' });
    }
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, postId }: { id: string; postId: string }) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { postId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['comments', result.postId] });
      toast({ title: 'Comment deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    }
  });
};
