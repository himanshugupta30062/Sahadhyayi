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
  comments_count?: number;
}

export interface SpoilerComment {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  min_chapter: number;
  created_at: string;
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
        .limit(60);

      if (bookId) q = q.eq("book_id", bookId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SafeSpoilerThread[];
    },
    staleTime: 45_000,
  });
};

export const useSpoilerThreadComments = (threadId?: string, isUnlocked?: boolean) => {
  return useQuery({
    queryKey: ["spoiler-thread-comments", threadId],
    enabled: !!threadId && !!isUnlocked,
    queryFn: async () => {
      if (!threadId) return [];
      const { data, error } = await supabase
        .from("spoiler_thread_comments")
        .select("id, thread_id, user_id, body, min_chapter, created_at, profiles:user_id(full_name, profile_photo_url)")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as SpoilerComment[];
    },
    staleTime: 30_000,
  });
};

export const useCreateSpoilerThread = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { book_id: string; title: string; body: string; min_chapter: number }) => {
      if (!user) throw new Error("Sign in first to start a thread.");
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

export const useCreateSpoilerThreadComment = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { thread_id: string; body: string; min_chapter?: number }) => {
      if (!user) throw new Error("Sign in to comment.");
      const { data, error } = await supabase
        .from("spoiler_thread_comments")
        .insert({
          thread_id: input.thread_id,
          user_id: user.id,
          body: input.body.trim(),
          min_chapter: input.min_chapter ?? 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["spoiler-thread-comments", vars.thread_id] });
    },
  });
};

export const useUnlockChapter = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, chapter }: { bookId: string; chapter: number }) => {
      if (!user) throw new Error("Sign in to update progress.");
      const { data, error } = await supabase
        .from("detailed_reading_progress")
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            chapter_number: chapter,
            completion_percentage: 100,
            status: "completed",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,book_id,chapter_number" }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spoiler-threads"] });
    },
  });
};
