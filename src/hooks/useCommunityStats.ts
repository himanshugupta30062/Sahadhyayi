import * as React from 'react';
import { supabase } from '@/integrations/supabase/client-universal';

const LOCAL_STORAGE_KEY = 'community-stats';

export interface CountryVisit {
  code?: string;
  name?: string;
  count: number;
  percent?: number;
}

export interface CommunityStats {
  totalSignups: number;
  totalVisits: number;
  last24hVisits: number;
  topCountries: CountryVisit[];
  lastUpdated: string;
  isCached?: boolean;
}

const DEFAULT_STATS: CommunityStats = {
  totalSignups: 0,
  totalVisits: 0,
  last24hVisits: 0,
  topCountries: [],
  lastUpdated: '',
  isCached: false,
};

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
      const parsed = JSON.parse(cached) as CommunityStats;
      return { ...parsed, isCached: true };
    } catch {
      return null;
    }
  }, [safeGetItem]);

  const [stats, setStats] = React.useState<CommunityStats>(() => {
    const cached = getCachedStats();
    return cached || DEFAULT_STATS;
  });
  const [isLoading, setIsLoading] = React.useState(autoFetch);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let edgeSignups: number | null = null;
    let edgeVisits: number | null = null;
    let edge24h: number | null = null;
    let topCountries: CountryVisit[] = [];
    let edgeLastUpdated: string | null = null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('community-stats', {
        body: { timeframe: '24h' },
      });
      if (!fnError && data && typeof data === 'object') {
        // Modern analytics schema with legacy fallback support
        edgeSignups = typeof data.metrics?.registeredReaders?.value === 'number'
          ? data.metrics.registeredReaders.value
          : typeof data.totalSignups === 'number'
          ? data.totalSignups
          : typeof data.totalMembers === 'number'
          ? data.totalMembers
          : null;

        edgeVisits = typeof data.metrics?.totalPageViews?.value === 'number'
          ? data.metrics.totalPageViews.value
          : typeof data.totalVisits === 'number'
          ? data.totalVisits
          : null;

        edge24h = typeof data.metrics?.periodPageViews?.value === 'number'
          ? data.metrics.periodPageViews.value
          : typeof data.last24hVisits === 'number'
          ? data.last24hVisits
          : null;

        topCountries = Array.isArray(data.breakdowns?.countries)
          ? data.breakdowns.countries
          : Array.isArray(data.topCountries)
          ? data.topCountries
          : [];

        edgeLastUpdated = typeof data.lastUpdated === 'string' ? data.lastUpdated : null;
      }
    } catch {
      // Fallback to direct DB RPCs below
    }

    try {
      // If Edge Function did not provide counts, check direct database RPCs
      let rpcUsers: number | null = edgeSignups;
      let rpcVisits: number | null = edgeVisits;

      if (rpcUsers === null || rpcVisits === null) {
        const [usersRpc, visitsRpc] = await Promise.all([
          typeof supabase?.rpc === 'function' ? Promise.resolve(supabase.rpc('get_total_users_count')).catch(() => ({ data: null })) : { data: null },
          typeof supabase?.rpc === 'function' ? Promise.resolve(supabase.rpc('get_website_visit_count')).catch(() => ({ data: null })) : { data: null },
        ]);

        if (rpcUsers === null && usersRpc && typeof usersRpc.data === 'number') {
          rpcUsers = usersRpc.data;
        }
        if (rpcVisits === null && visitsRpc && typeof visitsRpc.data === 'number') {
          rpcVisits = visitsRpc.data;
        }
      }

      // Check if we retrieved actual metrics from the network/RPCs
      const liveSignups = edgeSignups !== null ? edgeSignups : rpcUsers;
      const liveVisits = edgeVisits !== null ? edgeVisits : rpcVisits;
      const live24h = edge24h;

      if (liveSignups !== null || liveVisits !== null) {
        // We have genuine live numbers. Even if they are 0, they MUST remain 0!
        const updated: CommunityStats = {
          totalSignups: liveSignups ?? 0,
          totalVisits: liveVisits ?? 0,
          last24hVisits: live24h ?? 0,
          topCountries: topCountries,
          lastUpdated: edgeLastUpdated || new Date().toISOString(),
          isCached: false,
        };

        setStats(updated);
        safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } else {
        // Complete network failure: use cached data but mark it stale/cached; do NOT invent fresh timestamp
        const cached = getCachedStats();
        if (cached) {
          setStats(cached);
        } else {
          setError('Failed to load community stats');
        }
      }
    } catch (err) {
      console.error('Failed to fetch community stats:', err);
      const cached = getCachedStats();
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
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId });

        if (insertError) throw insertError;
      }

      // Re-fetch authoritative stats from server
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Failed to join community:', error);
      return false;
    }
  }, [fetchStats]);

  React.useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    joinCommunity,
  };
};

export default useCommunityStats;
