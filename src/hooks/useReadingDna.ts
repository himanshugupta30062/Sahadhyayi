import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";
import type { ReadingDna } from "@/lib/readingDna";

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
      return (data ?? null) as ReadingDna | null;
    },
    staleTime: 5 * 60 * 1000,
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
    },
  });
};
