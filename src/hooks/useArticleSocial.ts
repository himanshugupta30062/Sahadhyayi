import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/hooks/use-toast';

// ─── LIKES ───

export function useArticleLikes(articleId: string | undefined) {
  const { user } = useAuth();

  const countQuery = useQuery({
    queryKey: ['article-likes', articleId],
    enabled: !!articleId,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const userLikedQuery = useQuery({
    queryKey: ['article-likes', articleId, 'user', user?.id],
    enabled: !!articleId && !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('article_likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  return {
    count: countQuery.data ?? 0,
    hasLiked: userLikedQuery.data ?? false,
    isLoading: countQuery.isLoading,
  };
}

export function useToggleArticleLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ articleId, hasLiked }: { articleId: string; hasLiked: boolean }) => {
      if (!user) throw new Error('Sign in to like articles');

      if (hasLiked) {
        const { error } = await (supabase as any)
          .from('article_likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('article_likes')
          .insert({ article_id: articleId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['article-likes', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

// ─── COMMENTS ───

export interface ArticleComment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
}

export function useArticleComments(articleId: string | undefined) {
  return useQuery({
    queryKey: ['article-comments', articleId],
    enabled: !!articleId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('article_comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const comments = data as ArticleComment[];

      // Fetch profiles
      const userIds = [...new Set(comments.map((c) => c.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return comments.map((c) => {
        const profile = profileMap.get(c.user_id);
        return {
          ...c,
          author_name: profile?.full_name || 'Anonymous',
          author_avatar: profile?.profile_photo_url || '',
        };
      });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ articleId, content, parentId }: { articleId: string; content: string; parentId?: string }) => {
      if (!user) throw new Error('Sign in to comment');

      const { data, error } = await (supabase as any)
        .from('article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: any) => {
      toast({ title: 'Error posting comment', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, articleId }: { commentId: string; articleId: string }) => {
      const { error } = await (supabase as any)
        .from('article_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      return articleId;
    },
    onSuccess: (articleId) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
  });
}

// ─── FOLLOW AUTHOR ───

export function useAuthorFollowStatus(authorUserId: string | undefined) {
  const { user } = useAuth();

  const followersCountQuery = useQuery({
    queryKey: ['author-followers', authorUserId],
    enabled: !!authorUserId,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('article_author_followers')
        .select('*', { count: 'exact', head: true })
        .eq('author_user_id', authorUserId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const isFollowingQuery = useQuery({
    queryKey: ['author-followers', authorUserId, 'user', user?.id],
    enabled: !!authorUserId && !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('article_author_followers')
        .select('id')
        .eq('author_user_id', authorUserId)
        .eq('follower_user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  return {
    followersCount: followersCountQuery.data ?? 0,
    isFollowing: isFollowingQuery.data ?? false,
    isLoading: followersCountQuery.isLoading,
  };
}

export function useToggleFollowAuthor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ authorUserId, isFollowing }: { authorUserId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Sign in to follow authors');

      if (isFollowing) {
        const { error } = await (supabase as any)
          .from('article_author_followers')
          .delete()
          .eq('author_user_id', authorUserId)
          .eq('follower_user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('article_author_followers')
          .insert({ author_user_id: authorUserId, follower_user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, { authorUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['author-followers', authorUserId] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}
