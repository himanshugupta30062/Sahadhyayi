import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

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
      // Since reading_challenges table doesn't exist, return mock data for now
      const mockChallenges: ReadingChallenge[] = [
        {
          id: '1',
          name: '2024 Reading Challenge',
          description: 'Read 12 books this year',
          goal: 12,
          challenge_type: 'yearly'
        }
      ];
      return mockChallenges;
    },
  });

export const useUserChallenges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-challenges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Since user_challenges table doesn't exist, return mock data for now
      const mockUserChallenges: UserChallenge[] = [
        {
          id: '1',
          user_id: user.id,
          challenge_id: '1',
          progress: 0,
          completed: false
        }
      ];
      return mockUserChallenges;
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
      // Since user_challenges table doesn't exist, return mock success
      const mockUserChallenge: UserChallenge = {
        id: '1',
        user_id: user.id,
        challenge_id: challengeId,
        progress: 0,
        completed: false
      };
      return mockUserChallenge;
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
      // Since user_badges table doesn't exist, return mock data for now
      const mockBadges: UserBadge[] = [
        {
          id: '1',
          badge_id: '1',
          user_id: user.id,
          badges: { name: 'First Book Read', icon_url: '📚' }
        }
      ];
      return mockBadges;
    },
    enabled: !!user,
  });
};
