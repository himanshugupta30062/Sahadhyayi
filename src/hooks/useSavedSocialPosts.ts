import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client-universal";
import { useAuth } from "@/contexts/authHelpers";

export interface SavedSocialPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  post?: Record<string, any> | null;
}

export function useSavedSocialPosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reading-cabinet", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("social_post_saves")
        .select("id,user_id,post_id,created_at,posts(id,user_id,content,post_kind,quote_text,quote_author,quote_source,created_at,profiles!posts_user_id_profiles_fkey(id,full_name,username,profile_photo_url),books_library(id,title,author))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedSocialPost[];
    },
  });
}

export function useToggleSavedSocialPost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (!user?.id) throw new Error("Sign in to save posts to your Reading Cabinet.");
      if (isSaved) {
        const { error } = await (supabase as any).from("social_post_saves")
          .delete().eq("user_id", user.id).eq("post_id", postId);
        if (error) throw error;
        return false;
      }
      const { error } = await (supabase as any).from("social_post_saves")
        .upsert({ user_id: user.id, post_id: postId }, { onConflict: "user_id,post_id" });
      if (error) throw error;
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-cabinet", user?.id] }),
  });
}

export function useSavedSocialPostIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reading-cabinet-ids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return new Set<string>();
      const { data, error } = await (supabase as any).from("social_post_saves")
        .select("post_id").eq("user_id", user.id);
      if (error) throw error;
      return new Set<string>((data ?? []).map((row: { post_id: string }) => row.post_id));
    },
  });
}
