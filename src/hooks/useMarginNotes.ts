import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";

export interface MarginNoteReply {
  id: string;
  margin_note_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null; profile_photo_url: string | null; username: string | null } | null;
}

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
  profiles?: { full_name: string | null; profile_photo_url: string | null; username: string | null } | null;
  user_reactions?: string[];
}

export const useMarginNotes = (options?: { bookId?: string; filter?: "all" | "friends" }) => {
  const { user } = useAuth();
  const bookId = options?.bookId;
  const filter = options?.filter ?? "all";

  return useQuery({
    queryKey: ["margin-notes", bookId ?? "all", filter, user?.id],
    queryFn: async () => {
      let friendIds: string[] = [];
      if (filter === "friends" && user) {
        const { data: friendships } = await supabase
          .from("friends")
          .select("user1_id, user2_id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        friendIds = (friendships ?? []).map((f) => (f.user1_id === user.id ? f.user2_id : f.user1_id));
        friendIds.push(user.id); // Include user's own notes
      }

      let q = supabase
        .from("margin_notes")
        .select(
          "id, user_id, book_id, page, quote, note, visibility, reactions_count, replies_count, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (bookId) {
        q = q.eq("book_id", bookId);
      }

      if (filter === "friends" && user) {
        if (friendIds.length === 0) return [];
        q = q.in("user_id", friendIds);
      }

      const { data, error } = await q;
      if (error) throw error;

      const rawNotes = (data ?? []) as unknown as MarginNote[];
      const bookIds = [...new Set(rawNotes.map((n) => n.book_id).filter(Boolean))];
      const userIds = [...new Set(rawNotes.map((n) => n.user_id).filter(Boolean))];
      const [booksResult, profilesResult] = await Promise.all([
        bookIds.length ? supabase.from("books_library").select("id, title, author, cover_image_url").in("id", bookIds) : Promise.resolve({ data: [], error: null } as any),
        userIds.length ? (supabase as any).from("profiles_public").select("*").in("id", userIds) : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (booksResult.error) throw booksResult.error;
      const booksById = new Map((booksResult.data ?? []).map((b: any) => [b.id, b]));
      const profilesById = new Map((profilesResult.data ?? []).map((p: any) => [p.id, p]));
      const notes = rawNotes.map((n) => ({ ...n, books_library: booksById.get(n.book_id) ?? null, profiles: profilesById.get(n.user_id) ?? null }));

      // Fetch current user's reactions for these notes if authenticated
      if (user && notes.length > 0) {
        const noteIds = notes.map((n) => n.id);
        const { data: myReactions } = await supabase
          .from("margin_note_reactions")
          .select("margin_note_id, emoji")
          .eq("user_id", user.id)
          .in("margin_note_id", noteIds);

        const reactionsByNote = new Map<string, string[]>();
        myReactions?.forEach((r) => {
          const list = reactionsByNote.get(r.margin_note_id) || [];
          list.push(r.emoji);
          reactionsByNote.set(r.margin_note_id, list);
        });

        return notes.map((n) => ({
          ...n,
          user_reactions: reactionsByNote.get(n.id) || [],
        }));
      }

      return notes;
    },
    staleTime: 30_000,
  });
};

export const useMarginNoteReplies = (noteId?: string) => {
  return useQuery({
    queryKey: ["margin-note-replies", noteId],
    enabled: !!noteId,
    queryFn: async () => {
      if (!noteId) return [];
      const { data, error } = await supabase
        .from("margin_note_replies")
         .select("id, margin_note_id, user_id, body, created_at")
        .eq("margin_note_id", noteId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      const replies = (data ?? []) as unknown as MarginNoteReply[];
      const userIds = [...new Set(replies.map((r) => r.user_id))];
      const { data: profiles } = userIds.length ? await (supabase as any).from("profiles_public").select("*").in("id", userIds) : { data: [] };
      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return replies.map((reply) => ({ ...reply, profiles: byId.get(reply.user_id) ?? null }));
    },
    staleTime: 20_000,
  });
};

export const useCreateMarginNoteReply = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, body }: { noteId: string; body: string }) => {
      if (!user) throw new Error("Sign in to reply.");
      const { data, error } = await supabase
        .from("margin_note_replies")
        .insert({ margin_note_id: noteId, user_id: user.id, body: body.trim() })
        .select("*, profiles:user_id(full_name, profile_photo_url, username)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["margin-note-replies", vars.noteId] }).catch((error) => console.error('Failed to invalidate query cache', error));
      void qc.invalidateQueries({ queryKey: ["margin-notes"] }).catch((error) => console.error('Failed to invalidate query cache', error));
    },
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

export const useDeleteMarginNote = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!user) throw new Error("Sign in first.");
      const { error } = await supabase.from("margin_notes").delete().eq("id", noteId).eq("user_id", user.id);
      if (error) throw error;
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
