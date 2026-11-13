import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";
import { matchScore, type ReadingDna, type ShelfBookItem } from "@/lib/readingDna";

export const useReadingDna = (userId?: string) => {
  const { user } = useAuth();
  const target = userId ?? user?.id;
  return useQuery({
    queryKey: ["reading-dna", target],
    enabled: !!target,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_dna")
        .select("*")
        .eq("user_id", target!)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as unknown as ReadingDna | null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDnaMatch = (targetUserId?: string) => {
  const { user } = useAuth();
  const { data: myDna, isLoading: myLoading } = useReadingDna(user?.id);
  const { data: targetDna, isLoading: targetLoading } = useReadingDna(targetUserId);

  const score = targetUserId && user && myDna && targetDna ? matchScore(myDna, targetDna) : null;

  return {
    score,
    myDna,
    targetDna,
    isLoading: myLoading || targetLoading,
  };
};

export const useUserShelfForCompare = (userId?: string) => {
  return useQuery({
    queryKey: ["user-shelf-compare", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_bookshelf")
        .select("book_id, status, rating, books_library:book_id(id, title, author, cover_image_url, genre)")
        .eq("user_id", userId!);

      if (error) throw error;
      return (data ?? []) as unknown as ShelfBookItem[];
    },
    staleTime: 60_000,
  });
};

export const useGenerateReadingDna = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-reading-dna", {
        body: {},
      });
      if (error) throw error;
      return data?.dna as ReadingDna;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reading-dna", user?.id] });
      void qc.invalidateQueries({ queryKey: ["friend-dna"] });
    },
  });
};

export type ReadingDnaVisibility = "public" | "friends" | "private";

export interface DiscoverableReader {
  user_id: string;
  username: string | null;
  full_name: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  genres: Array<{ name: string; weight: number }>;
  moods: string[];
  pace: string | null;
  themes: string[];
  summary: string | null;
  signature_color: string | null;
  generated_at: string;
  friend_request_status?: string;
}

export const useDiscoverableReaders = (options: {
  search?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
} = {}) => {
  const { user } = useAuth();
  const search = options.search?.trim() || "";
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  return useQuery({
    queryKey: ["discoverable-readers", user?.id, search, limit, offset],
    enabled: !!user?.id && (options.enabled ?? true),
    queryFn: async (): Promise<DiscoverableReader[]> => {
      try {
        const { data, error } = await supabase.rpc("get_discoverable_readers", {
          p_limit: limit,
          p_offset: offset,
          p_search: search || null,
        });

        if (error) {
          console.warn("[useDiscoverableReaders] RPC fallback:", error.message);
          // Fallback directly to public reading_dna with profile hydration
          const { data: dnas, error: dnaErr } = await supabase
            .from("reading_dna")
            .select("*")
            .eq("visibility", "public")
            .neq("user_id", user!.id)
            .limit(limit);

          if (dnaErr) throw dnaErr;
          if (!dnas || dnas.length === 0) return [];

          const ids = dnas.map((d: any) => d.user_id);
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, username, full_name, profile_photo_url, bio")
            .in("id", ids);

          const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

          return (dnas ?? []).map((d: any) => {
            const p = profMap.get(d.user_id);
            return {
              user_id: d.user_id,
              username: p?.username ?? null,
              full_name: p?.full_name ?? null,
              profile_photo_url: p?.profile_photo_url ?? null,
              bio: p?.bio ?? null,
              genres: d.genres ?? [],
              moods: d.moods ?? [],
              pace: d.pace ?? null,
              themes: d.themes ?? [],
              summary: d.summary ?? null,
              signature_color: d.signature_color ?? null,
              generated_at: d.generated_at,
              friend_request_status: "none",
            };
          });
        }

        return (data ?? []) as DiscoverableReader[];
      } catch (err) {
        console.error("Failed to load discoverable readers", err);
        return [];
      }
    },
    staleTime: 60_000,
  });
};

export const useUpdateReadingDnaVisibility = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (visibility: ReadingDnaVisibility) => {
      if (!user) throw new Error("Sign in to change Reading DNA privacy.");
      const { error } = await supabase.from("reading_dna").update({ visibility }).eq("user_id", user.id);
      if (error) throw error;
      return visibility;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reading-dna", user?.id] });
      void qc.invalidateQueries({ queryKey: ["friend-dna"] });
      void qc.invalidateQueries({ queryKey: ["discoverable-readers"] });
    },
  });
};
