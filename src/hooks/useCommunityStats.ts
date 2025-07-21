
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityStats {
  totalSignups: number;
  totalVisits: number;
  lastUpdated: string;
}

export const useCommunityStats = (autoFetch: boolean = true) => {
  const [stats, setStats] = useState<CommunityStats>({
    totalSignups: 0,
    totalVisits: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: joinError, count: signups } = await supabase
        .from('community_users')
        .select('*', { count: 'exact', head: true });

      if (joinError) throw joinError;

      const { data: visits, error: visitError } = await supabase.rpc('get_website_visit_count');

      if (visitError) throw visitError;

      setStats({
        totalSignups: signups ?? 0,
        totalVisits: visits ?? 0,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to fetch community stats:', err);
      setError('Failed to load community stats');
    } finally {
      setIsLoading(false);
    }
  };

  const joinCommunity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) return false;

      const { error } = await supabase
        .from('community_users')
        .upsert({ user_id: session.user.id });

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        totalSignups: prev.totalSignups + 1,
        lastUpdated: new Date().toISOString(),
      }));

      await fetchStats();

      return true;
    } catch (err) {
      console.error('Failed to join community:', err);
      return false;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    joinCommunity
  };
};
