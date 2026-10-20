import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface ReadingChallenge {
  id: string;
  slug: string;
  name: string;
  description: string;
  goal: number;
  challenge_type: string;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  joined_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  user_id: string;
  earned_at: string;
  badges?: { name: string; icon_url?: string };
}

/** Public active challenge catalogue; the database contains the source of truth. */
export const useChallenges = () =>
  useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_challenges')
        .select('*')
        .eq('is_active', true)
        .order('goal', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ReadingChallenge[];
    },
  });

/** Enrolled challenges and trigger-maintained progress for the signed-in reader. */
export const useUserChallenges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as UserChallenge[];
    },
    enabled: !!user?.id,
  });
};

/** Join is a real insert; the unique database constraint prevents duplicate entries. */
export const useJoinChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_challenges')
        .insert({ user_id: user.id, challenge_id: challengeId })
        .select('*')
        .single();

      if (error) throw error;
      return data as UserChallenge;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['user-challenges', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-badges', user?.id] }),
      ]);
    },
  });
};

/** Reading badges are awarded and stored by PostgreSQL, not fabricated in the UI. */
export const useUserBadges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: earned, error: earnedError } = await supabase
        .from('user_reading_badges')
        .select('id, badge_id, user_id, earned_at')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (earnedError) throw earnedError;
      if (!earned?.length) return [];

      const badgeIds = [...new Set(earned.map((badge) => badge.badge_id))];
      const { data: definitions, error: definitionsError } = await supabase
        .from('reading_badges')
        .select('id, name, icon')
        .in('id', badgeIds);

      if (definitionsError) throw definitionsError;

      const definitionsById = new Map(
        (definitions ?? []).map((badge) => [badge.id, badge]),
      );

      return earned.map((badge) => {
        const definition = definitionsById.get(badge.badge_id);
        return {
          ...badge,
          badges: definition
            ? { name: definition.name, icon_url: definition.icon }
            : undefined,
        } satisfies UserBadge;
      });
    },
    enabled: !!user?.id,
  });
};
