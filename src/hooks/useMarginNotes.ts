import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";

export interface MarginNote {
  id: string;
  user_id: string;
  book_id: string;
  page: number;
  quote: string;
  note: string;
  visibility: "public" | "friends";
  reactions_count: number;
  replies_count: number;
  created_at: string;
  books_library?: { title: string; author: string | null; cover_image_url: string | null } | null;
  profiles?: { full_name: string | null; profile_photo_url: string | null } | null;
}

export const useMarginNotes = (bookId?: string) => {
  return useQuery({
    queryKey: ["margin-notes", bookId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("margin_notes")
        .select(
          "id, user_id, book_id, page, quote, note, visibility, reactions_count, replies_count, created_at, books_library:book_id(title, author, cover_image_url), profiles:user_id(full_name, profile_photo_url)"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (bookId) q = q.eq("book_id", bookId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as MarginNote[];
    },
    staleTime: 60_000,
  });
};

export const useCreateMarginNote = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      book_id: string;
      page: number;
      quote: string;
      note: string;
      visibility?: "public" | "friends";
    }) => {
      if (!user) throw new Error("Sign in to add margin notes.");
      const { data, error } = await supabase
        .from("margin_notes")
        .insert({ ...input, user_id: user.id, visibility: input.visibility ?? "public" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["margin-notes"] }),
  });
};

export const useToggleMarginReaction = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      if (!user) throw new Error("Sign in to react.");
      const { data: existing } = await supabase
        .from("margin_note_reactions")
        .select("id")
        .eq("margin_note_id", noteId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();
      if (existing) {
        await supabase.from("margin_note_reactions").delete().eq("id", existing.id);
      } else {
        await supabase
          .from("margin_note_reactions")
          .insert({ margin_note_id: noteId, user_id: user.id, emoji });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["margin-notes"] }),
  });
};
