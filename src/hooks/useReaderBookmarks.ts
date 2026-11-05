import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";

export interface ReaderBookmark {
  id: string;
  user_id: string;
  book_id: string;
  location: string;
  page: number;
  label: string | null;
  created_at: string;
}

export const useReaderBookmarks = (bookId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reader-bookmarks", user?.id, bookId],
    enabled: !!user?.id && !!bookId,
    queryFn: async () => {
      if (!user?.id || !bookId) return [];
      const { data, error } = await supabase
        .from("reader_bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReaderBookmark[];
    },
  });
};

export const useAddReaderBookmark = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookId: string; location: string; page: number; label?: string }) => {
      if (!user?.id) throw new Error("Sign in to sync bookmarks across devices.");
      const { data, error } = await supabase
        .from("reader_bookmarks")
        .upsert({
          user_id: user.id,
          book_id: input.bookId,
          location: input.location,
          page: Math.max(1, input.page),
          label: input.label?.trim() || null,
        }, { onConflict: "user_id,book_id,location" })
        .select()
        .single();
      if (error) throw error;
      return data as ReaderBookmark;
    },
    onSuccess: (_, input) => qc.invalidateQueries({ queryKey: ["reader-bookmarks", user?.id, input.bookId] }),
  });
};

export const useDeleteReaderBookmark = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      if (!user?.id) throw new Error("Sign in first.");
      const { error } = await supabase.from("reader_bookmarks").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return bookId;
    },
    onSuccess: bookId => qc.invalidateQueries({ queryKey: ["reader-bookmarks", user?.id, bookId] }),
  });
};
