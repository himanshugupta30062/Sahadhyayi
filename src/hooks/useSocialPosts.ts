import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface SocialPost {
  id: string;
  user_id: string;
  username: string | null;
  image_url: string | null;
  caption: string;
  likes: number;
  comments: number;
  created_at: string;
}

export const useSocialPosts = () => {
  return useQuery({
    queryKey: ['social_posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SocialPost[];
    },
  });
};

export const useCreateSocialPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ caption, imageUrl }: { caption: string; imageUrl?: string | null }) => {
      if (!user) throw new Error('User not authenticated');

      const trimmed = caption.trim();
      if (!trimmed) throw new Error('Caption is required');

      // Resolve display name from profile if available
      const { data: profile } = await supabase
        .from('user_profile')
        .select('username, name')
        .eq('id', user.id)
        .maybeSingle();

      const emailPrefix = user.email ? user.email.split('@')[0] : 'reader';
      const username = profile?.username || profile?.name || emailPrefix;

      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          username,
          caption: trimmed,
          image_url: imageUrl?.trim() ? imageUrl.trim() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SocialPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_posts'] });
      toast({
        title: 'Post published',
        description: 'Your post is now visible in the Social Media feed!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create post',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useLikeSocialPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const { error } = await supabase.rpc('increment_social_post_likes', {
        post_id: postId,
        delta: liked ? -1 : 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_posts'] });
    },
  });
};
