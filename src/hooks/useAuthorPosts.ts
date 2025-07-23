import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AuthorPost {
  id: string;
  author_id: string;
  title?: string;
  content: string;
  post_type: 'blog_post' | 'status_update' | 'announcement';
  image_url?: string;
  video_url?: string;
  allow_comments: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  authors?: {
    id: string;
    name: string;
    profile_image_url?: string;
  };
  _count?: {
    comments: number;
    reactions: number;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    profile_photo_url?: string;
  };
  replies?: PostComment[];
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'celebrate' | 'insightful';
  created_at: string;
}

// Get posts for a specific author
export const useAuthorPosts = (authorId?: string) => {
  return useQuery({
    queryKey: ['author-posts', authorId],
    queryFn: async () => {
      if (!authorId) return [];
      
      const { data, error } = await supabase
        .from('author_posts')
        .select(`
          *,
          authors:author_id (
            id,
            name,
            profile_image_url
          )
        `)
        .eq('author_id', authorId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AuthorPost[] || [];
    },
    enabled: !!authorId,
  });
};

// Get posts for followed authors (feed)
export const useFollowedAuthorsPosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followed-authors-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get the followed author IDs
      const { data: followedAuthors, error: followError } = await supabase
        .from('author_followers')
        .select('author_id')
        .eq('user_id', user.id);
      
      if (followError) throw followError;
      
      const authorIds = followedAuthors?.map(f => f.author_id) || [];
      
      if (authorIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('author_posts')
        .select(`
          *,
          authors:author_id (
            id,
            name,
            profile_image_url
          )
        `)
        .eq('is_published', true)
        .in('author_id', authorIds)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as AuthorPost[] || [];
    },
    enabled: !!user?.id,
  });
};

// Create a new post
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postData: {
      title?: string;
      content: string;
      post_type?: 'blog_post' | 'status_update' | 'announcement';
      image_url?: string;
      video_url?: string;
      allow_comments?: boolean;
      is_published?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('author_posts')
        .insert({
          ...postData,
          author_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-posts'] });
      queryClient.invalidateQueries({ queryKey: ['followed-authors-posts'] });
      toast.success('Post created successfully!');
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    },
  });
};

// Get comments for a post
export const usePostComments = (postId?: string) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from('author_post_comments')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            profile_photo_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Organize comments into threads
      const comments = data || [];
      const commentMap = new Map();
      const rootComments: any[] = [];
      
      comments.forEach((comment: any) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });
      
      comments.forEach((comment: any) => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(commentMap.get(comment.id));
          }
        } else {
          rootComments.push(commentMap.get(comment.id));
        }
      });
      
      return rootComments;
    },
    enabled: !!postId,
  });
};

// Add comment to a post
export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, parentCommentId }: {
      postId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('author_post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    },
  });
};

// Get reactions for a post
export const usePostReactions = (postId?: string) => {
  return useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from('author_post_reactions')
        .select('*')
        .eq('post_id', postId);
      
      if (error) throw error;
      return data as PostReaction[] || [];
    },
    enabled: !!postId,
  });
};

// Toggle reaction on a post
export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: {
      postId: string;
      reactionType: 'like' | 'love' | 'celebrate' | 'insightful';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check if user already reacted
      const { data: existingReaction } = await supabase
        .from('author_post_reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      
      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction
          const { error } = await supabase
            .from('author_post_reactions')
            .delete()
            .eq('id', existingReaction.id);
          
          if (error) throw error;
          return { action: 'removed' };
        } else {
          // Update reaction
          const { error } = await supabase
            .from('author_post_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);
          
          if (error) throw error;
          return { action: 'updated' };
        }
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('author_post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          });
        
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-reactions', variables.postId] });
    },
    onError: (error) => {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    },
  });
};