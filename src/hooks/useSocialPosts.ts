import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  book_id?: string;
  feeling_emoji?: string;
  feeling_label?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
    profile_photo_url?: string;
  };
  books_library?: {
    id: string;
    title: string;
    author?: string;
    cover_image_url?: string;
  };
  user_liked?: boolean;
}

export const useSocialPosts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch posts with user info and book details
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!user_id(id, full_name, username, profile_photo_url),
          books_library(id, title, author, cover_image_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Check which posts the current user has liked
      if (user?.id && data?.length) {
        const postIds = data.map(post => post.id);
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);
        
        return data.map(post => ({
          ...post,
          user_liked: likedPostIds.has(post.id)
        }));
      }

      return data || [];
    },
    enabled: !!user,
  });

  // Real-time subscription for new posts
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('social-posts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          // Fetch the complete post with user details
          const { data: newPost } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!user_id(id, full_name, username, profile_photo_url),
              books_library(id, title, author, cover_image_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newPost) {
            queryClient.setQueryData<SocialPost[]>(['social-posts'], (old = []) => {
              return [{ ...newPost, user_liked: false }, ...old];
            });

            // Show notification for posts from others
            if (newPost.user_id !== user.id) {
              toast({
                title: 'New Post',
                description: `${newPost.profiles?.full_name || 'Someone'} shared a new post`,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          queryClient.setQueryData<SocialPost[]>(['social-posts'], (old = []) => {
            return old.map(post => 
              post.id === payload.new.id 
                ? { ...post, ...payload.new }
                : post
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  return { posts, isLoading };
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postData: {
      content: string;
      image_url?: string;
      book_id?: string;
      feeling_emoji?: string;
      feeling_label?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const payload = {
        ...postData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([payload])
        .select(`
          *,
          profiles!user_id(id, full_name, username, profile_photo_url),
          books_library(id, title, author, cover_image_url)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: 'Success',
        description: 'Your post has been shared!',
      });
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useTogglePostLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        if (error) throw error;
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert([{ user_id: user.id, post_id: postId }]);
        
        if (error) throw error;
      }

      return { postId, isLiked: !isLiked };
    },
    onSuccess: ({ postId, isLiked }) => {
      // Update the posts in cache
      queryClient.setQueryData<SocialPost[]>(['social-posts'], (old = []) => {
        return old.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                user_liked: isLiked, 
                likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1 
              }
            : post
        );
      });
    },
    onError: (error) => {
      console.error('Error toggling like:', error);
    },
  });
};

export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!user_id(id, full_name, username, profile_photo_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert([{ post_id: postId, content, user_id: user.id }])
        .select(`
          *,
          profiles!user_id(id, full_name, username, profile_photo_url)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', data.post_id] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create comment. Please try again.',
        variant: 'destructive',
      });
    },
  });
};