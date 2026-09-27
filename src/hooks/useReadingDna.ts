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
      qc.invalidateQueries({ queryKey: ["reading-dna", user?.id] });
      qc.invalidateQueries({ queryKey: ["friend-dna"] });
    },
  });
};
