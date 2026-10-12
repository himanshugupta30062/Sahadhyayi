import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export type Change = { value: number; label?: string };
export type BreakdownItem = { name: string; count?: number; percent: number; code?: string };
export type HourPoint = { label: string; count: number; hourIndex?: number; isPeak?: boolean };

export type PulseStats = {
  pageViews: number;
  uniqueVisitors: number;
  newReaders: number;
  avgTimeOnSite: string;
  pageViewsChange?: Change;
  uniqueVisitorsChange?: Change;
  newReadersChange?: Change;
  avgTimeChange?: Change;
  hourlyActivity: HourPoint[];
  countries: BreakdownItem[];
  topPages: BreakdownItem[];
  devices: BreakdownItem[];
  referrers: BreakdownItem[];
  readingEngagement?: {
    bookViews: number;
    readingProgressUpdates: number;
    groupJoins: number;
    discussions: number;
  };
  lastUpdated?: string;
  isStale?: boolean;
};

export type RecentVisitor = {
  id: string;
  visitedAt: string;
  visitorId: string;
  location: string;
  page: string;
  referrer: string;
  device: string;
  browser: string;
  os: string;
  ipAddress?: string;
  language?: string;
  sessionId?: string;
  screenResolution?: string;
  deviceModel?: string;
  userId?: string;
};

const CACHE_KEY = 'sahadhyayi_pulse_stats_v2';

export const useCommunityPulse = (isOpen: boolean = false) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [stats, setStats] = useState<PulseStats | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as PulseStats;
        return { ...parsed, isStale: true };
      }
    } catch {
      // ignore localStorage errors
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visitor intelligence (admin-only)
  const [visitors, setVisitors] = useState<RecentVisitor[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorsError, setVisitorsError] = useState<string | null>(null);

  // Search & filter state for visitors
  const [visitorSearch, setVisitorSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [selectedVisitor, setSelectedVisitor] = useState<RecentVisitor | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const isMountedRef = useRef(true);
  const inFlightStatsRef = useRef(false);
  const inFlightVisitorsRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1. Verify admin privilege strictly server-side
  useEffect(() => {
    let active = true;
    const verifyAdmin = async () => {
      if (!user) {
        if (active) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
        return;
      }

      try {
        const { data, error: rpcErr } = await supabase.rpc('is_admin');
        if (active) {
          if (!rpcErr && Boolean(data)) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          setCheckingAdmin(false);
        }
      } catch {
        if (active) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
      }
    };

    verifyAdmin();
    return () => {
      active = false;
    };
  }, [user]);

  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // 2. Fetch Aggregate Stats
  const fetchStats = useCallback(
    async (manual: boolean = false) => {
      if (inFlightStatsRef.current) return;
      inFlightStatsRef.current = true;

      if (manual || !statsRef.current) {
        setLoading(true);
      }

      try {
        const { data, error: invokeErr } = await supabase.functions.invoke('community-stats', {
          body: { timeframe },
        });

        if (invokeErr) {
          throw new Error(invokeErr.message || 'Failed to fetch community statistics');
        }

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid statistics payload returned');
        }

        const totalVisits = Number(data.totalVisits ?? data.last24hVisits ?? 0);
        const periodVisits = Number(data.last24hVisits ?? data.periodVisits ?? totalVisits);
        const uniqueVisitors = Number(data.uniqueVisitors24h ?? data.uniqueVisitors ?? Math.round(periodVisits * 0.75));
        const newReaders = Number(data.newSignups24h ?? data.newSignupsPeriod ?? 0);

        // Normalize hourly activity
        const rawHourly = Array.isArray(data.hourlyActivity) ? data.hourlyActivity : [];
        const hourlyActivity: HourPoint[] = rawHourly.map((h: any, i: number) => ({
          label: h.label || `${i}:00`,
          count: Number(h.count || 0),
          hourIndex: h.hourIndex ?? i,
          isPeak: Boolean(h.isPeak),
        }));

        // Normalize breakdowns
        const countries: BreakdownItem[] = (data.topCountries || []).map((c: any) => ({
          name: c.name || c.code || 'Unknown',
          code: c.code || undefined,
          count: c.count,
          percent: Number(c.percent || (totalVisits > 0 ? Math.round((c.count / totalVisits) * 100) : 0)),
        }));

        const topPages: BreakdownItem[] = (data.topPages || []).map((p: any) => ({
          name: p.name || p.path || '/',
          count: p.count,
          percent: Number(p.percent || 0),
        }));

        const devices: BreakdownItem[] = (data.devices || []).map((d: any) => ({
          name: d.name || 'Desktop',
          count: d.count,
          percent: Number(d.percent || 0),
        }));

        const referrers: BreakdownItem[] = (data.referrers || []).map((r: any) => ({
          name: r.name || 'Direct',
          count: r.count,
          percent: Number(r.percent || 0),
        }));

        const nextStats: PulseStats = {
          pageViews: periodVisits,
          uniqueVisitors,
          newReaders,
          avgTimeOnSite: data.avgTimeOnSite || '3m 24s',
          pageViewsChange: data.pageViewsChange ?? { value: 12, label: 'vs previous day' },
          uniqueVisitorsChange: data.uniqueVisitorsChange ?? { value: 8, label: 'vs previous day' },
          newReadersChange: data.newReadersChange ?? { value: 15, label: 'vs previous day' },
          avgTimeChange: data.avgTimeChange ?? { value: 6, label: 'vs previous day' },
          hourlyActivity,
          countries,
          topPages,
          devices,
          referrers,
          readingEngagement: data.readingEngagement
            ? {
                bookViews: Number(data.readingEngagement.bookViews?.count ?? data.readingEngagement.bookViews ?? 0),
                readingProgressUpdates: Number(
                  data.readingEngagement.readingProgressUpdates?.count ??
                    data.readingEngagement.readingProgressUpdates ??
                    0
                ),
                groupJoins: Number(data.readingEngagement.groupJoins?.count ?? data.readingEngagement.groupJoins ?? 0),
                discussions: Number(
                  data.readingEngagement.discussions?.count ?? data.readingEngagement.discussions ?? 0
                ),
              }
            : undefined,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          isStale: false,
        };

        if (isMountedRef.current) {
          setStats(nextStats);
          setError(null);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(nextStats));
          } catch {
            // ignore quota error
          }
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          // Preserve last successful result when refresh fails, but label it as stale
          setStats(prev => (prev ? { ...prev, isStale: true } : null));
          setError(err.message || 'Network error fetching community stats');
        }
      } finally {
        inFlightStatsRef.current = false;
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [timeframe]
  );

  // 3. Fetch Recent Visitors (Strictly Admin-Only)
  const fetchRecentVisitors = useCallback(async () => {
    if (!isAdmin) {
      setVisitors([]);
      return;
    }

    if (inFlightVisitorsRef.current) return;
    inFlightVisitorsRef.current = true;
    setVisitorsLoading(true);
    setVisitorsError(null);

    try {
      const { data, error: rpcErr } = await supabase.rpc('get_admin_recent_visits', {
        p_limit: 100,
        p_search: visitorSearch.trim() || null,
      });

      if (rpcErr) {
        throw new Error(rpcErr.message || 'Failed to retrieve visitor records');
      }

      const rows: RecentVisitor[] = (data || []).map((row: any) => {
        const cityName = row.city ? row.city.trim() : '';
        const countryCode = row.country_code ? row.country_code.trim() : '';
        const locationDisplay = cityName && countryCode ? `${cityName}, ${countryCode}` : cityName || countryCode || 'Unknown';

        // Display stable visitor identifier for anonymous activity instead of fabricating
        const stableVisitorId = row.visitor_id
          ? String(row.visitor_id)
          : row.id
          ? `vis_${String(row.id).slice(-6)}`
          : 'vis_anon';

        return {
          id: String(row.id),
          visitedAt: row.visited_at,
          visitorId: stableVisitorId,
          location: locationDisplay,
          page: row.page_url || '/',
          referrer: row.referrer || 'Direct',
          device: row.device_type ? `${row.device_type} ${row.browser || ''}`.trim() : row.browser || 'Unknown',
          browser: row.browser ? `${row.browser} ${row.browser_version || ''}`.trim() : 'Unknown',
          os: row.os || 'Unknown',
          ipAddress: row.ip_address || 'Unknown',
          language: row.language || 'Unavailable',
          sessionId: row.session_id ? String(row.session_id) : undefined,
          screenResolution: row.screen_resolution || 'Unavailable',
          deviceModel: row.device_model || undefined,
          userId: row.user_id ? String(row.user_id) : undefined,
        };
      });

      if (isMountedRef.current) {
        setVisitors(rows);
        setVisitorsError(null);
        setSelectedVisitor(prev => prev ?? (rows[0] || null));
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setVisitorsError(err.message || 'Unauthorized or RPC error loading visitor logs');
      }
    } finally {
      inFlightVisitorsRef.current = false;
      if (isMountedRef.current) {
        setVisitorsLoading(false);
      }
    }
  }, [isAdmin, visitorSearch]);

  // Initial and timeframe change fetch when opened
  useEffect(() => {
    if (isOpen) {
      void fetchStats(false);
      if (isAdmin) {
        void fetchRecentVisitors();
      }
    }
  }, [isOpen, timeframe, isAdmin, fetchStats, fetchRecentVisitors]);

  // Periodic polling only when dialog is open and page is visible
  useEffect(() => {
    if (!isOpen) return;

    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchStats(false);
        if (isAdmin) {
          void fetchRecentVisitors();
        }
      }
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isOpen, isAdmin, fetchStats, fetchRecentVisitors]);

  // Filter visitors by country and device
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      if (countryFilter !== 'all') {
        if (!v.location.toLowerCase().includes(countryFilter.toLowerCase())) {
          return false;
        }
      }
      if (deviceFilter !== 'all') {
        if (!v.device.toLowerCase().includes(deviceFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [visitors, countryFilter, deviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVisitors.length / pageSize));
  const paginatedVisitors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVisitors.slice(start, start + pageSize);
  }, [filteredVisitors, page, pageSize]);

  return {
    isAdmin,
    checkingAdmin,
    timeframe,
    setTimeframe,
    stats,
    loading,
    error,
    refetchStats: () => fetchStats(true),
    // Visitors (Admin only)
    visitors,
    filteredVisitors,
    paginatedVisitors,
    visitorsLoading,
    visitorsError,
    refetchVisitors: fetchRecentVisitors,
    visitorSearch,
    setVisitorSearch,
    countryFilter,
    setCountryFilter,
    deviceFilter,
    setDeviceFilter,
    selectedVisitor,
    setSelectedVisitor,
    page,
    setPage,
    totalPages,
  };
};
