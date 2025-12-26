import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export function useGameBadges() {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      // Fetch all available badges
      const { data: badges, error: badgesError } = await supabase
        .from('game_badges')
        .select('*');

      if (badgesError) throw badgesError;
      setAllBadges((badges || []) as Badge[]);

      // Fetch user's earned badges
      if (user) {
        const { data: earned, error: earnedError } = await supabase
          .from('user_game_badges')
          .select('*, badge:game_badges(*)')
          .eq('user_id', user.id);

        if (earnedError) throw earnedError;
        setUserBadges((earned || []) as unknown as UserBadge[]);
      }
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const checkAndAwardBadges = useCallback(async (stats: {
    games_played: number;
    games_won: number;
    total_points: number;
    current_streak: number;
    perfect_game?: boolean;
    speed_answers?: number;
  }) => {
    if (!user) return;

    const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
    const newBadges: Badge[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      let earned = false;

      switch (badge.requirement_type) {
        case 'games_played':
          earned = stats.games_played >= badge.requirement_value;
          break;
        case 'total_points':
        case 'rank':
          earned = stats.total_points >= badge.requirement_value;
          break;
        case 'streak':
          earned = stats.current_streak >= badge.requirement_value;
          break;
        case 'perfect_game':
          earned = stats.perfect_game === true;
          break;
        case 'speed_answers':
          earned = (stats.speed_answers || 0) >= badge.requirement_value;
          break;
      }

      if (earned) {
        newBadges.push(badge);
      }
    }

    // Award new badges
    for (const badge of newBadges) {
      try {
        await supabase.from('user_game_badges').insert({
          user_id: user.id,
          badge_id: badge.id,
        });

        setNewBadge(badge);
        toast.success(`🏆 Achievement Unlocked: ${badge.name}!`, {
          description: badge.description,
          duration: 5000,
        });
      } catch (err) {
        console.error('Error awarding badge:', err);
      }
    }

    if (newBadges.length > 0) {
      fetchBadges();
    }

    return newBadges;
  }, [user, userBadges, allBadges, fetchBadges]);

  const dismissNewBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  const hasEarnedBadge = useCallback((badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  }, [userBadges]);

  return {
    allBadges,
    userBadges,
    loading,
    newBadge,
    checkAndAwardBadges,
    dismissNewBadge,
    hasEarnedBadge,
    refetch: fetchBadges,
  };
}
