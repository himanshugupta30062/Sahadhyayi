import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReadingChallenge {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  goal: number;
  challenge_type?: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress?: number;
  completed?: boolean;
  reading_challenges?: ReadingChallenge;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  user_id: string;
  badges?: { name: string; icon_url?: string };
}

export const useChallenges = () =>
  useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_challenges')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as ReadingChallenge[];
    },
  });

export const useUserChallenges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-challenges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*, reading_challenges(*)')
        .eq('user_id', user.id);
      if (error) throw error;

      const challenges = (data as UserChallenge[]) || [];

      // Calculate progress based on books in user's bookshelf
      await Promise.all(
        challenges.map(async (uc) => {
          const rc = uc.reading_challenges;
          if (!rc) return;
          const { count } = await supabase
            .from('user_bookshelf')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .in('status', ['reading', 'completed'])
            .gte('added_at', rc.start_date ?? '1970-01-01')
            .lte('added_at', rc.end_date ?? '2999-12-31');
          uc.progress = count ?? 0;
          uc.completed = uc.progress >= rc.goal;
        })
      );

      return challenges;
    },
    enabled: !!user,
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_challenges')
        .insert({ user_id: user.id, challenge_id: challengeId })
        .select()
        .single();
      if (error) throw error;
      return data as UserChallenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
    },
  });
};

export const useUserBadges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(name, icon_url)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user,
  });
};
