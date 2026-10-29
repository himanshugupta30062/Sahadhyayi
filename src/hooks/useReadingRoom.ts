import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";
import { uniqueChannelName } from '@/lib/realtime';

export interface ReadingRoom {
  id: string;
  book_id: string;
  name: string;
  created_by: string;
  created_at: string;
  books_library?: { title: string; author: string | null; cover_image_url: string | null; pages?: number | null } | null;
  profiles?: { full_name: string | null; profile_photo_url: string | null } | null;
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
  joined_at?: string;
}

export interface ChapterPulse {
  user_id: string;
  user_name?: string;
  chapter: number;
  at: number;
}

type ReadingRoomsOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
};

export const useReadingRooms = (bookId?: string, options: ReadingRoomsOptions = {}) => {
  const qc = useQueryClient();
  const enabled = options.enabled ?? true;
  const refetchInterval = options.refetchInterval ?? 15_000;

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(uniqueChannelName('reading-rooms-realtime'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reading_rooms' },
        () => {
          void qc.invalidateQueries({ queryKey: ["reading-rooms"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel).catch((error: unknown) => {
        console.error("Failed to remove reading rooms channel:", error);
      });
    };
  }, [qc, enabled]);

  return useQuery({
    queryKey: ["reading-rooms", bookId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("reading_rooms")
        .select("id, book_id, name, created_by, created_at, books_library:book_id(title, author, cover_image_url, pages)")
        .order("created_at", { ascending: false })
        .limit(bookId ? 40 : 100);
      if (bookId) query = query.eq("book_id", bookId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ReadingRoom[];
    },
    enabled,
    staleTime: 10_000,
    refetchInterval,
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
        .select("id, book_id, name, created_by, created_at, books_library:book_id(title, author, cover_image_url)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-rooms"] }),
  });
};

export const useReadingRoomLive = (
  room: { id: string; book_id: string; name: string } | null,
  sharePage: boolean,
  page: number | null
) => {
  const { user } = useAuth();
  const roomId = room?.id;
  const bookId = room?.book_id;
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [presence, setPresence] = useState<RoomPresence[]>([]);
  const [pulses, setPulses] = useState<ChapterPulse[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initial message and recent events fetch
  useEffect(() => {
    if (!roomId) return;
    let isCancelled = false;

    void (async () => {
      const { data: msgs } = await supabase
        .from("reading_room_messages")
        .select("id, room_id, user_id, body, created_at, profiles:user_id(full_name, profile_photo_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!isCancelled && msgs) {
        setMessages(msgs as unknown as RoomMessage[]);
      }

      const { data: evts } = await supabase
        .from("reading_room_events")
        .select("id, room_id, user_id, kind, chapter, created_at")
        .eq("room_id", roomId)
        .eq("kind", "chapter_complete")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!isCancelled && evts) {
        setPulses(
          evts.map((e) => ({
            user_id: e.user_id,
            chapter: e.chapter ?? 1,
            at: new Date(e.created_at).getTime(),
          }))
        );
      }
    })().catch((error: unknown) => {
      if (!isCancelled) {
        console.error("Failed to load reading room activity:", error);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [roomId]);

  // Subscribe to channel
  useEffect(() => {
    if (!roomId || !user) return;
    const channelKey = bookId ? `room:${bookId}` : `room:${roomId}`;
    const channel = supabase.channel(channelKey, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "room_chat" }, (payload) => {
        if (payload?.payload) {
          const m = payload.payload;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      })
      .on("broadcast", { event: "chapter_complete" }, (payload) => {
        if (payload?.payload) {
          const p = payload.payload;
          setPulses((prev) => [
            ...prev.slice(-19),
            { user_id: p.user_id, user_name: p.user_name, chapter: p.chapter ?? 1, at: Date.now() },
          ]);
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reading_room_messages", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const m = payload.new as any;
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name, profile_photo_url")
            .eq("id", m.user_id)
            .maybeSingle();

          const completeMessage: RoomMessage = {
            ...m,
            profiles: prof ?? null,
          };
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, completeMessage]));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reading_room_events", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const e = payload.new as any;
          if (e.kind === "chapter_complete") {
            setPulses((prev) => [
              ...prev.slice(-19),
              { user_id: e.user_id, chapter: e.chapter ?? 0, at: Date.now() },
            ]);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, RoomPresence[]>;
        const flat: RoomPresence[] = [];
        Object.values(state).forEach((arr) => arr.forEach((p) => flat.push(p)));
        setPresence(flat);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({
              user_id: user.id,
              name: user.email?.split("@")[0] ?? "Reader",
              page: sharePage ? page : null,
              share_page: sharePage,
              joined_at: new Date().toISOString(),
            } satisfies RoomPresence);
          } catch (error) {
            console.error("Failed to publish reading room presence:", error);
          }
        }
      });

    return () => {
      void supabase.removeChannel(channel).catch((error: unknown) => {
        console.error("Failed to remove reading room channel:", error);
      });
      channelRef.current = null;
    };
  }, [roomId, bookId, user]);

  // Update presence state when page / sharePage changes
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch || !user) return;
    void ch.track({
      user_id: user.id,
      name: user.email?.split("@")[0] ?? "Reader",
      page: sharePage ? page : null,
      share_page: sharePage,
      joined_at: new Date().toISOString(),
    } satisfies RoomPresence).catch((error: unknown) => {
      console.error("Failed to update reading room presence:", error);
    });
  }, [sharePage, page, user]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!roomId || !user || !body.trim()) return;
      const text = body.trim();
      const { data, error } = await supabase
        .from("reading_room_messages")
        .insert({ room_id: roomId, user_id: user.id, body: text })
        .select("id, room_id, user_id, body, created_at, profiles:user_id(full_name, profile_photo_url)")
        .single();

      if (!error && data) {
        channelRef.current?.send({
          type: "broadcast",
          event: "room_chat",
          payload: data,
        });
      }
    },
    [roomId, user]
  );

  const emitPulse = useCallback(
    async (chapter: number) => {
      if (!roomId || !user) return;
      await supabase.from("reading_room_events").insert({
        room_id: roomId,
        user_id: user.id,
        kind: "chapter_complete",
        chapter,
      });

      channelRef.current?.send({
        type: "broadcast",
        event: "chapter_complete",
        payload: {
          user_id: user.id,
          user_name: user.email?.split("@")[0] ?? "Reader",
          chapter,
        },
      });
    },
    [roomId, user]
  );

  return { messages, presence, pulses, sendMessage, emitPulse };
};
