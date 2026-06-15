import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";

export interface ReadingRoom {
  id: string;
  book_id: string;
  name: string;
  created_by: string;
  created_at: string;
  books_library?: { title: string; author: string | null; cover_image_url: string | null } | null;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null; profile_photo_url: string | null } | null;
}

export interface RoomPresence {
  user_id: string;
  name: string;
  page: number | null;
  share_page: boolean;
}

export const useReadingRooms = () => {
  return useQuery({
    queryKey: ["reading-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_rooms")
        .select("id, book_id, name, created_by, created_at, books_library:book_id(title, author, cover_image_url)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as ReadingRoom[];
    },
    staleTime: 30_000,
  });
};

export const useCreateReadingRoom = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ book_id, name }: { book_id: string; name: string }) => {
      if (!user) throw new Error("Sign in first.");
      const { data, error } = await supabase
        .from("reading_rooms")
        .upsert({ book_id, name, created_by: user.id }, { onConflict: "book_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-rooms"] }),
  });
};

export const useReadingRoomLive = (roomId: string | null, sharePage: boolean, page: number | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [presence, setPresence] = useState<RoomPresence[]>([]);
  const [pulses, setPulses] = useState<Array<{ user: string; chapter: number; at: number }>>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // initial message fetch
  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const { data } = await supabase
        .from("reading_room_messages")
        .select("id, room_id, user_id, body, created_at, profiles:user_id(full_name, profile_photo_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((data ?? []) as unknown as RoomMessage[]);
    })();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !user) return;
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reading_room_messages", filter: `room_id=eq.${roomId}` }, async (payload) => {
        const m = payload.new as any;
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, profile_photo_url")
          .eq("id", m.user_id)
          .maybeSingle();
        setMessages((prev) => [...prev, { ...m, profiles: prof ?? null }]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reading_room_events", filter: `room_id=eq.${roomId}` }, (payload) => {
        const e = payload.new as any;
        if (e.kind === "chapter_complete") {
          setPulses((prev) => [...prev.slice(-19), { user: e.user_id, chapter: e.chapter ?? 0, at: Date.now() }]);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, RoomPresence[]>;
        const flat: RoomPresence[] = [];
        Object.values(state).forEach((arr) => arr.forEach((p) => flat.push(p)));
        setPresence(flat);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            name: user.email?.split("@")[0] ?? "Reader",
            page: sharePage ? page : null,
            share_page: sharePage,
          } satisfies RoomPresence);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, user?.id]);

  // update presence when page sharing toggles
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch || !user) return;
    ch.track({
      user_id: user.id,
      name: user.email?.split("@")[0] ?? "Reader",
      page: sharePage ? page : null,
      share_page: sharePage,
    } satisfies RoomPresence);
  }, [sharePage, page, user?.id]);

  const sendMessage = useMemo(
    () => async (body: string) => {
      if (!roomId || !user || !body.trim()) return;
      await supabase.from("reading_room_messages").insert({ room_id: roomId, user_id: user.id, body: body.trim() });
    },
    [roomId, user?.id]
  );

  return { messages, presence, pulses, sendMessage };
};
