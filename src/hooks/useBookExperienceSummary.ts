import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { BookExperienceSummary } from '@/utils/moodPaceDiscovery';

export function useBookExperienceSummary(bookIds: string[]) {
  const normalizedIds = Array.from(new Set(bookIds.filter((id): id is string => Boolean(id && id.trim()))));
  const queryKey = ['book-experience-summary', normalizedIds.sort((a, b) => a.localeCompare(b)).join(',')];

  return useQuery({
    queryKey,
    enabled: normalizedIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<Map<string, BookExperienceSummary>> => {
      const summaryMap = new Map<string, BookExperienceSummary>();
      if (normalizedIds.length === 0) return summaryMap;

      try {
        const { data, error } = await (supabase as any).rpc('get_book_experience_summary', {
          p_book_ids: normalizedIds,
        });

        if (error) {
          console.warn('[useBookExperienceSummary] RPC unavailable; using catalog inference:', error.message || error);
          return summaryMap;
        }

        if (Array.isArray(data)) {
          data.forEach((row: any) => {
            if (row && row.book_id) {
              summaryMap.set(row.book_id, {
                book_id: row.book_id,
                moods: Array.isArray(row.moods) ? row.moods : [],
                pacing: row.pacing || null,
                content_warnings: Array.isArray(row.content_warnings) ? row.content_warnings : [],
                community_tags_count: Number(row.community_tags_count || 0),
              });
            }
          });
        }
      } catch (err) {
        console.warn('[useBookExperienceSummary] Exception loading summaries:', err);
      }

      return summaryMap;
    },
  });
}
