import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/hooks/use-toast';
import type { Article } from './useArticles';

/** Whether the current user has bookmarked a given article */
export function useIsBookmarked(articleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['article-bookmark', articleId, user?.id],
    enabled: !!articleId && !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('article_bookmarks')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ articleId, isBookmarked }: { articleId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Sign in to bookmark articles');

      if (isBookmarked) {
        const { error } = await (supabase as any)
          .from('article_bookmarks')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('article_bookmarks')
          .insert({ article_id: articleId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, { articleId, isBookmarked }) => {
      queryClient.invalidateQueries({ queryKey: ['article-bookmark', articleId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookmarks'] });
      toast({
        title: isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks',
      });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

/** All articles the current user has bookmarked */
export function useMyBookmarks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-bookmarks', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: bookmarks, error } = await (supabase as any)
        .from('article_bookmarks')
        .select('article_id, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const articleIds = (bookmarks || []).map((b: any) => b.article_id);
      if (articleIds.length === 0) return [];

      const { data: articles, error: aErr } = await (supabase as any)
        .from('articles')
        .select('*')
        .in('id', articleIds)
        .eq('is_published', true);
      if (aErr) throw aErr;

      // Author profiles
      const userIds = [...new Set((articles as Article[]).map((a) => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Preserve bookmark order
      const articleMap = new Map(
        (articles as Article[]).map((a) => [
          a.id,
          {
            ...a,
            author_name: profileMap.get(a.user_id)?.full_name || 'Anonymous',
            author_avatar: profileMap.get(a.user_id)?.profile_photo_url || '',
          } as Article,
        ])
      );
      return articleIds
        .map((id: string) => articleMap.get(id))
        .filter(Boolean) as Article[];
    },
  });
}
