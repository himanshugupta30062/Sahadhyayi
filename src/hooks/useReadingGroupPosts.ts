import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client-universal';

export interface ReadingGroupPost {
  id: string; group_id: string; author_id: string; author_name: string;
  author_photo_url: string | null; body: string; book_id: string | null;
  book_title: string | null; book_cover_url: string | null; pinned_at: string | null;
  created_at: string; updated_at: string;
}
const postsKey = (groupId: string, userId: string | null) => ['reading-group-posts', groupId, userId] as const;

export const useReadingGroupPosts = (groupId: string, enabled = false) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: postsKey(groupId, user?.id ?? null),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_reading_group_posts', { p_group_id: groupId, p_limit: 60 });
      if (error) throw new Error(error.message || 'Could not load group posts.');
      return (data ?? []) as ReadingGroupPost[];
    },
    enabled: Boolean(groupId && user?.id && enabled),
    staleTime: 15_000,
  });
};
export const useCreateReadingGroupPost = () => {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; body: string; bookId?: string | null }) => {
      const { data, error } = await supabase.rpc('create_reading_group_post', {
        p_group_id: input.groupId, p_body: input.body.trim(), p_book_id: input.bookId ?? null,
      });
      if (error) throw new Error(error.message || 'Could not publish group post.');
      return data as string;
    },
    onSuccess: (_, input) => qc.invalidateQueries({ queryKey: postsKey(input.groupId, user?.id ?? null) }),
  });
};
export const useDeleteReadingGroupPost = () => {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; postId: string }) => {
      const { error } = await supabase.rpc('delete_reading_group_post', { p_post_id: input.postId });
      if (error) throw new Error(error.message || 'Could not delete post.');
    },
    onSuccess: (_, input) => qc.invalidateQueries({ queryKey: postsKey(input.groupId, user?.id ?? null) }),
  });
};
