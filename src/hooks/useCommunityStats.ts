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
    const topCountries: CountryVisit[] = [];
    let edgeLastUpdated: string | null = null;

    try {
      // Public community UI must not call the administrator-only community-stats
      // Edge Function. Use a deliberately limited aggregate RPC instead.
      const { data, error: rpcError } = await supabase.rpc('get_public_community_counts');
      if (!rpcError && data && typeof data === 'object' && !Array.isArray(data)) {
        const counts = data as Record<string, unknown>;
        edgeSignups = typeof counts.totalSignups === 'number' ? counts.totalSignups : null;
        edgeVisits = typeof counts.totalVisits === 'number' ? counts.totalVisits : null;
        edge24h = typeof counts.last24hVisits === 'number' ? counts.last24hVisits : null;
        edgeLastUpdated = typeof counts.lastUpdated === 'string' ? counts.lastUpdated : null;
      }
    } catch {
      // Keep cached stats when the aggregate RPC is unavailable.
    }

    try {
      // If Edge Function did not provide counts, check direct database RPCs
      const rpcUsers: number | null = edgeSignups;
      const rpcVisits: number | null = edgeVisits;

      // Do not fall back to legacy count RPCs: they are intentionally restricted
      // and caused avoidable 403 responses from ordinary reader sessions.

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
      // fetchStats handles its own failures; explicitly mark this effect-triggered request as fire-and-forget.
      void fetchStats();
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
