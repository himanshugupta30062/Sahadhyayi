import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Article } from './useArticles';

/**
 * Returns up to `limit` published articles related to the given one.
 * Strategy: prefer matching tags, then fall back to most recent published.
 */
export function useRelatedArticles(
  article: Pick<Article, 'id' | 'tags' | 'user_id'> | undefined,
  limit = 3
) {
  return useQuery({
    queryKey: ['related-articles', article?.id, article?.tags?.join(',') || ''],
    enabled: !!article?.id,
    queryFn: async () => {
      const tags = article?.tags || [];

      let query = (supabase as any)
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .neq('id', article!.id)
        .order('published_at', { ascending: false })
        .limit(limit * 4); // Over-fetch then filter/score

      if (tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      let { data, error } = await query;
      if (error) throw error;

      // Fallback: if no tag matches, just grab recent
      if (!data || data.length === 0) {
        const fb = await (supabase as any)
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .neq('id', article!.id)
          .order('published_at', { ascending: false })
          .limit(limit);
        data = fb.data || [];
      }

      // Score by tag overlap and slice
      const scored = (data as Article[])
        .map((a) => ({
          a,
          score: a.tags?.filter((t) => tags.includes(t)).length || 0,
        }))
        .sort((x, y) => y.score - x.score)
        .slice(0, limit)
        .map(({ a }) => a);

      // Author profiles
      const userIds = [...new Set(scored.map((a) => a.user_id))];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return scored.map((a) => ({
        ...a,
        author_name: profileMap.get(a.user_id)?.full_name || 'Anonymous',
        author_avatar: profileMap.get(a.user_id)?.profile_photo_url || '',
      })) as Article[];
    },
  });
}
