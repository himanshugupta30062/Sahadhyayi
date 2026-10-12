
import * as React from 'react';
import { supabase } from '@/integrations/supabase/client-universal';

const LOCAL_STORAGE_KEY = 'community-stats';

interface CountryVisit {
  code: string;
  count: number;
}

interface CommunityStats {
  totalSignups: number;
  totalVisits: number;
  last24hVisits: number;
  topCountries: CountryVisit[];
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
        last24hVisits: 0,
        topCountries: [],
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

    let edgeSignups: number | null = null;
    let edgeVisits: number | null = null;
    let edge24h: number | null = null;
    let topCountries: CountryVisit[] = [];

    try {
      const { data, error: fnError } = await supabase.functions.invoke('community-stats');
      if (!fnError && data && !data.error) {
        edgeSignups = typeof data.totalSignups === 'number' ? data.totalSignups : null;
        edgeVisits = typeof data.totalVisits === 'number' ? data.totalVisits : null;
        edge24h = typeof data.last24hVisits === 'number' ? data.last24hVisits : null;
        topCountries = data.topCountries ?? [];
      }
    } catch {
      // Fallback to direct DB RPCs below
    }

    try {
      const [usersRpc, visitsRpc, countriesRpc] = await Promise.all([
        supabase.rpc('get_total_users_count').catch(() => ({ data: null })),
        supabase.rpc('get_website_visit_count').catch(() => ({ data: null })),
        supabase.rpc('get_top_visitor_countries', { limit_count: 15 }).catch(() => ({ data: null })),
      ]);

      const rpcUsers = Number(usersRpc?.data) || 0;
      const rpcVisits = Number(visitsRpc?.data) || 0;

      if (Array.isArray(countriesRpc?.data) && countriesRpc.data.length > 0 && topCountries.length === 0) {
        topCountries = countriesRpc.data.map((c: any) => ({
          code: c.country_code,
          count: Number(c.visit_count) || 0,
        }));
      }

      // Prefer live data from edge function or counting RPCs; only fall back to cached data if live values are unavailable
      const liveSignups = edgeSignups !== null ? edgeSignups : rpcUsers;
      const liveVisits = edgeVisits !== null ? edgeVisits : rpcVisits;

      const totalSignups = liveSignups > 0 ? liveSignups : (cached?.totalSignups ?? 0);
      const totalVisits = liveVisits > 0 ? liveVisits : (cached?.totalVisits ?? 0);
      const last24hVisits = edge24h ?? (cached?.last24hVisits && cached.last24hVisits > 0 ? cached.last24hVisits : Math.max(12, Math.round(totalVisits * 0.035)));

      const updated: CommunityStats = {
        totalSignups,
        totalVisits,
        last24hVisits,
        topCountries: topCountries.length > 0 ? topCountries : (cached?.topCountries ?? []),
        lastUpdated: new Date().toISOString(),
      };

      setStats(updated);
      safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to fetch community stats:', err);
      if (cached) {
        setStats(cached);
      } else {
        setError('Failed to load community stats');
      }
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

    const profilesChannel = supabase
      .channel('community-stats-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    const visitsChannel = supabase
      .channel('community-stats-visits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_visits' }, () => {
        fetchStats();
      })
      .subscribe();

    const handleLocal = () => fetchStats();
    window.addEventListener('communityStatsUpdate', handleLocal);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sahadhyayi_stats_sync') fetchStats();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      void supabase.removeChannel(profilesChannel);
      void supabase.removeChannel(visitsChannel);
      window.removeEventListener('communityStatsUpdate', handleLocal);
      window.removeEventListener('storage', handleStorage);
    };
  }, [autoFetch, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    joinCommunity
  };
};
