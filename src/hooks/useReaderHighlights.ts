import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";

export interface ReaderHighlight {
  id: string; user_id: string; book_id: string; text: string;
  location: string | null; page: number;
  color: "yellow" | "green" | "blue" | "pink"; created_at: string;
}
export const useReaderHighlights = (bookId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reader-highlights", user?.id, bookId], enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from("reader_highlights").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error; return ((data ?? []) as ReaderHighlight[]).filter(item => !bookId || item.book_id === bookId);
    },
  });
};
export const useAddReaderHighlight = () => {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookId: string; text: string; location?: string; page: number; color?: ReaderHighlight["color"] }) => {
      if (!user?.id) throw new Error("Sign in to save and sync reader highlights.");
      const text = input.text.trim();
      if (!text || text.length > 10000) throw new Error("Highlight text must be between 1 and 10,000 characters.");
      const { data, error } = await supabase.from("reader_highlights").insert({
        user_id: user.id, book_id: input.bookId, text, location: input.location || null,
        page: Math.max(1, Math.floor(input.page)), color: input.color ?? "yellow",
      }).select().single();
      if (error) throw error; return data as ReaderHighlight;
    },
    onSuccess: (_, input) => qc.invalidateQueries({ queryKey: ["reader-highlights", user?.id, input.bookId] }),
  });
};
export const useUpdateReaderHighlight = () => {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; bookId: string; text: string; page: number; color: ReaderHighlight["color"] }) => {
      if (!user?.id) throw new Error("Sign in first.");
      const text = input.text.trim();
      if (!text || text.length > 10000) throw new Error("Highlight text must be between 1 and 10,000 characters.");
      const { data, error } = await supabase.from("reader_highlights").update({
        text, page: Math.max(1, Math.floor(input.page)), color: input.color,
      }).eq("id", input.id).eq("user_id", user.id).select().single();
      if (error) throw error; return data as ReaderHighlight;
    },
    onSuccess: (_, input) => qc.invalidateQueries({ queryKey: ["reader-highlights", user?.id, input.bookId] }),
  });
};
export const useDeleteReaderHighlight = () => {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      if (!user?.id) throw new Error("Sign in first.");
      const { error } = await supabase.from("reader_highlights").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error; return bookId;
    },
    onSuccess: bookId => qc.invalidateQueries({ queryKey: ["reader-highlights", user?.id, bookId] }),
  });
};
