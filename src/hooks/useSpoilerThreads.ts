import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";

export interface SafeSpoilerThread {
  id: string;
  book_id: string;
  user_id: string;
  title: string;
  body: string | null;
  min_chapter: number;
  is_unlocked: boolean;
  created_at: string;
  updated_at: string;
  books_library?: { title: string; author: string | null; cover_image_url: string | null } | null;
  profiles?: { full_name: string | null; profile_photo_url: string | null } | null;
}

export const useSpoilerThreads = (bookId?: string) => {
  return useQuery({
    queryKey: ["spoiler-threads", bookId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("spoiler_threads_safe" as any)
        .select(
          "id, book_id, user_id, title, body, min_chapter, is_unlocked, created_at, updated_at, books_library:book_id(title, author, cover_image_url), profiles:user_id(full_name, profile_photo_url)"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (bookId) q = q.eq("book_id", bookId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SafeSpoilerThread[];
    },
    staleTime: 60_000,
  });
};

export const useCreateSpoilerThread = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { book_id: string; title: string; body: string; min_chapter: number }) => {
      if (!user) throw new Error("Sign in first.");
      const { data, error } = await supabase
        .from("spoiler_threads")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spoiler-threads"] }),
  });
};
