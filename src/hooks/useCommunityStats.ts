
import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';

const LOCAL_STORAGE_KEY = 'community-stats';

interface CommunityStats {
  totalSignups: number;
  totalVisits: number;
  lastUpdated: string;
}

export const useCommunityStats = (autoFetch: boolean = true) => {
  const safeGetItem = React.useCallback((key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }, []);

  const safeSetItem = React.useCallback((key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore write errors (e.g. private mode)
    }
  }, []);

  const getCachedStats = React.useCallback((): CommunityStats | null => {
    const cached = safeGetItem(LOCAL_STORAGE_KEY);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as CommunityStats;
    } catch {
      return null;
    }
  }, [safeGetItem]);

  const [stats, setStats] = React.useState<CommunityStats>(() => {
    const cached = getCachedStats();
    return (
      cached || {
        totalSignups: 0,
        totalVisits: 0,
        lastUpdated: new Date().toISOString(),
      }
    );
  });
  const [isLoading, setIsLoading] = React.useState(autoFetch);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const cached = getCachedStats();
    if (cached) {
      setStats(cached);
    }

    try {
      const { count: signups, error: signupError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (signupError) throw signupError;

      const { count: visits, error: visitError } = await supabase
        .from('website_visits')
        .select('*', { count: 'exact', head: true });

      if (visitError) throw visitError;

      const updated = {
        totalSignups: signups ?? 0,
        totalVisits: visits ?? 0,
        lastUpdated: new Date().toISOString(),
      };

      setStats(updated);
      safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to fetch community stats:', err);
      const fallback = {
        totalSignups: 0,
        totalVisits: 0,
        lastUpdated: new Date().toISOString(),
      };
      setStats(fallback);
      safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(fallback));
      setError('Failed to load community stats');
    } finally {
      setIsLoading(false);
    }
  }, [getCachedStats, safeSetItem]);

  const joinCommunity = React.useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) return false;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .insert({ id: userId });

        if (error) throw error;

        setStats(prev => ({
          ...prev,
          totalSignups: prev.totalSignups + 1,
          lastUpdated: new Date().toISOString(),
        }));
      }

      await fetchStats();

      return true;
    } catch (err) {
      console.error('Failed to join community:', err);
      return false;
    }
  }, [fetchStats]);

  React.useEffect(() => {
    if (!autoFetch) return;
    fetchStats();
  }, [autoFetch, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    joinCommunity
  };
};
