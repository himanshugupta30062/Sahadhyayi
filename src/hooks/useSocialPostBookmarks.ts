import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client-universal";
import { useAuth } from "@/contexts/authHelpers";
import { resolveSocialPostImages } from "@/lib/socialPostMedia";
import type { SocialPost } from "@/hooks/useSocialPosts";

export interface SocialPostBookmark {
  id: string;
  user_id: string;
  post_id: string;
  saved_at: string;
}

const bookmarkKey = (userId?: string) => ["social-post-bookmarks", userId] as const;

export const useSocialPostBookmarks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookmarksQuery = useQuery({
    queryKey: bookmarkKey(user?.id),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("social_post_bookmarks")
        .select("id,user_id,post_id,saved_at")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialPostBookmark[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error("Sign in to save posts to your Reading Cabinet.");
      const { data, error } = await supabase
        .from("social_post_bookmarks")
        .upsert({ user_id: user.id, post_id: postId }, { onConflict: "user_id,post_id" })
        .select("id,user_id,post_id,saved_at")
        .single();
      if (error) throw error;
      return data as SocialPostBookmark;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookmarkKey(user?.id) }),
  });

  const removeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error("Sign in first.");
      const { error } = await supabase
        .from("social_post_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);
      if (error) throw error;
      return postId;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookmarkKey(user?.id) }),
  });

  const savedPostIds = (bookmarksQuery.data ?? []).map((bookmark) => bookmark.post_id);
  const savedPostsQuery = useQuery({
    queryKey: ["social-post-bookmark-content", user?.id, savedPostIds],
    enabled: Boolean(user?.id) && savedPostIds.length > 0,
    queryFn: async () => {
      if (!user?.id || savedPostIds.length === 0) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_profiles_fkey(id, full_name, username, profile_photo_url),
          books_library(id, title, author, cover_image_url)
        `)
        .in("id", savedPostIds);
      if (error) throw error;
      const posts = await resolveSocialPostImages((data ?? []) as unknown as SocialPost[]);
      const byId = new Map(posts.map((post) => [post.id, post]));
      // Keep the reader's save order, not the posts' publication order.
      return savedPostIds.map((id) => byId.get(id)).filter((post): post is SocialPost => Boolean(post));
    },
  });

  return {
    bookmarks: bookmarksQuery.data ?? [],
    savedPostIds,
    savedPosts: savedPostsQuery.data ?? [],
    isLoading: bookmarksQuery.isLoading || savedPostsQuery.isLoading,
    error: bookmarksQuery.error || savedPostsQuery.error,
    refetch: async () => {
      await Promise.all([bookmarksQuery.refetch(), savedPostsQuery.refetch()]);
    },
    savePost: saveMutation.mutate,
    removePost: removeMutation.mutate,
    isSaving: saveMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
};
