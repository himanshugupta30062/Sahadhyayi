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
          "id, book_id, user_id, title, body, min_chapter, is_unlocked, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(60);

      if (bookId) q = q.eq("book_id", bookId);
      const { data, error } = await q;
      if (error) throw error;
      const threads = (data ?? []) as unknown as SafeSpoilerThread[];
      const bookIds = [...new Set(threads.map((t) => t.book_id))];
      const userIds = [...new Set(threads.map((t) => t.user_id))];
      const [booksResult, profilesResult] = await Promise.all([
        bookIds.length ? supabase.from("books_library").select("id, title, author, cover_image_url").in("id", bookIds) : Promise.resolve({ data: [], error: null } as any),
        userIds.length ? (supabase as any).from("profiles_public").select("*").in("id", userIds) : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (booksResult.error) throw booksResult.error;
      const booksById = new Map((booksResult.data ?? []).map((b: any) => [b.id, b]));
      const profilesById = new Map((profilesResult.data ?? []).map((p: any) => [p.id, p]));
      return threads.map((thread) => ({ ...thread, books_library: booksById.get(thread.book_id) ?? null, profiles: profilesById.get(thread.user_id) ?? null }));
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
         .select("id, thread_id, user_id, body, min_chapter, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      const comments = (data ?? []) as unknown as SpoilerComment[];
      const userIds = [...new Set(comments.map((comment) => comment.user_id))];
      const { data: profiles } = userIds.length ? await (supabase as any).from("profiles_public").select("*").in("id", userIds) : { data: [] };
      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return comments.map((comment) => ({ ...comment, profiles: byId.get(comment.user_id) ?? null }));
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
            total_pages: 1,
            pages_read: 1,
            time_spent_minutes: 0,
            completed_at: new Date().toISOString(),
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
