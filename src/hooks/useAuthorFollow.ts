import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAuthorFollow = (authorId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user follows this author
  const { data: isFollowing, isLoading } = useQuery({
    queryKey: ['author-follow', user?.id, authorId],
    queryFn: async () => {
      if (!user?.id || !authorId) return false;
      
      const { data, error } = await supabase
        .from('author_followers')
        .select('id')
        .eq('user_id', user.id)
        .eq('author_id', authorId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!authorId,
  });

  // Follow author mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !authorId) throw new Error('User or author not found');
      
      const { error } = await supabase
        .from('author_followers')
        .insert({
          user_id: user.id,
          author_id: authorId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-follow', user?.id, authorId] });
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('Successfully followed author!');
    },
    onError: (error) => {
      console.error('Error following author:', error);
      toast.error('Failed to follow author');
    },
  });

  // Unfollow author mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !authorId) throw new Error('User or author not found');
      
      const { error } = await supabase
        .from('author_followers')
        .delete()
        .eq('user_id', user.id)
        .eq('author_id', authorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-follow', user?.id, authorId] });
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('Successfully unfollowed author');
    },
    onError: (error) => {
      console.error('Error unfollowing author:', error);
      toast.error('Failed to unfollow author');
    },
  });

  return {
    isFollowing,
    isLoading,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowLoading: followMutation.isPending,
    isUnfollowLoading: unfollowMutation.isPending,
  };
};

export const useFollowedAuthors = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followed-authors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('author_followers')
        .select(`
          author_id,
          followed_at,
          authors:author_id (
            id,
            name,
            profile_image_url,
            bio,
            books_count,
            followers_count
          )
        `)
        .eq('user_id', user.id)
        .order('followed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};