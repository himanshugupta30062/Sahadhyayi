import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GameStats {
  id: string;
  user_id: string;
  total_points: number;
  games_played: number;
  games_won: number;
  current_streak: number;
  best_streak: number;
  rank: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  profile_photo_url: string | null;
  total_points: number;
  games_won: number;
  rank: string;
}

const RANKS = [
  { name: 'Beginner', minPoints: 0, icon: '📖' },
  { name: 'Book Worm', minPoints: 500, icon: '📚' },
  { name: 'Scholar', minPoints: 2000, icon: '🎓' },
  { name: 'Expert', minPoints: 5000, icon: '🧠' },
  { name: 'Master', minPoints: 15000, icon: '👑' },
  { name: 'Legend', minPoints: 50000, icon: '🏆' },
];

export function getRankForPoints(points: number): { name: string; icon: string } {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

export function getNextRank(points: number): { name: string; minPoints: number; icon: string } | null {
  for (const rank of RANKS) {
    if (points < rank.minPoints) {
      return rank;
    }
  }
  return null;
}

export function useGameStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('user_game_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        // Create initial stats for new user
        const newStats = {
          user_id: user.id,
          total_points: 0,
          games_played: 0,
          games_won: 0,
          current_streak: 0,
          best_streak: 0,
          rank: 'Beginner',
        };

        const { data: created, error: createError } = await supabase
          .from('user_game_stats')
          .insert(newStats)
          .select()
          .single();

        if (createError) throw createError;
        setStats(created as GameStats);
      } else {
        setStats(data as GameStats);
      }
    } catch (err: any) {
      console.error('Error fetching game stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateStats = useCallback(async (updates: Partial<GameStats>) => {
    if (!user || !stats) return;

    const newPoints = updates.total_points ?? stats.total_points;
    const newRank = getRankForPoints(newPoints);

    try {
      const { data, error: updateError } = await supabase
        .from('user_game_stats')
        .update({ ...updates, rank: newRank.name })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setStats(data as GameStats);
      return data;
    } catch (err: any) {
      console.error('Error updating game stats:', err);
      throw err;
    }
  }, [user, stats]);

  const addPoints = useCallback(async (points: number, won: boolean = false) => {
    if (!stats) return;

    const newStreak = won ? stats.current_streak + 1 : 0;
    const updates: Partial<GameStats> = {
      total_points: stats.total_points + points,
      games_played: stats.games_played + 1,
      games_won: won ? stats.games_won + 1 : stats.games_won,
      current_streak: newStreak,
      best_streak: Math.max(stats.best_streak, newStreak),
    };

    return updateStats(updates);
  }, [stats, updateStats]);

  return {
    stats,
    loading,
    error,
    updateStats,
    addPoints,
    refetch: fetchStats,
  };
}

export function useLeaderboard(limit: number = 10) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase.rpc('get_game_leaderboard', { limit_count: limit });

        if (error) throw error;
        setLeaderboard((data || []) as LeaderboardEntry[]);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [limit]);

  return { leaderboard, loading };
}
