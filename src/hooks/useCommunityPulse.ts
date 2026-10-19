import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import type { AnalyticsTimeframe } from '@/types/analytics';

export type Change = { value: number | null; label?: string };
export type BreakdownItem = { name: string; count?: number; percent: number; code?: string };
export type HourPoint = { label: string; count: number; uniqueVisitors?: number; hourIndex?: number; isPeak?: boolean; bucketStart?: string };

export type MemberLeaderboardItem = {
  rank: number;
  userId: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  activityCount: number;
  totalPoints: number;
  breakdown?: {
    posts: number;
    comments: number;
    messages: number;
    chapters: number;
  };
};

export type DailyPoint = {
  bucketDate: string;
  label: string;
  count: number;
  pageViews: number;
  uniqueVisitors: number;
};

export type DualTableInfo = {
  lifetimeVisits: number | null;
  lifetimeSourceTable: string;
  rolling24hViews: number | null;
  rolling7dViews: number | null;
  rolling30dViews: number | null;
  uniqueVisitors24h: number | null;
  uniqueVisitors7d: number | null;
  uniqueVisitors30d: number | null;
  rollingSourceTable: string;
  collectionStartedAt?: string;
  isInitialRollout?: boolean;
};

export type PulseStats = {
  pageViews: number | null;
  uniqueVisitors: number | null;
  newReaders: number | null;
  totalMembers?: number | null;
  avgTimeOnSite: string;
  pageViewsChange?: Change;
  uniqueVisitorsChange?: Change;
  newReadersChange?: Change;
  avgTimeChange?: Change;
  hourlyActivity: HourPoint[];
  dailyActivity?: DailyPoint[];
  lifetimeVisits?: number | null;
  dualTable?: DualTableInfo;
  countries: BreakdownItem[];
  topPages: BreakdownItem[];
  devices: BreakdownItem[];
  referrers: BreakdownItem[];
  readingEngagement?: {
    bookViews: number | null;
    readingProgressUpdates: number | null;
    groupJoins: number | null;
    discussions: number | null;
  };
  topMembers?: MemberLeaderboardItem[];
  lastUpdated?: string;
  isStale?: boolean;
  partialData?: boolean;
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

export const getCacheKey = (tf: string) => `sahadhyayi_pulse_stats_${tf}_v8`;

/**
 * Builds 24 empty hourly buckets for Asia/Kolkata timezone with 0 counts.
 */
export function buildEmptyHourlyBuckets(): HourPoint[] {
  const buckets: HourPoint[] = [];
  const now = Date.now();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: true,
  });

  for (let i = 0; i < 24; i++) {
    const d = new Date(now - (23 - i) * 3600 * 1000);
    buckets.push({
      label: formatter.format(d),
      count: 0,
      hourIndex: i,
      isPeak: false,
      bucketStart: d.toISOString(),
    });
  }

  return buckets;
}

export function getBaselineStats(
  tf: AnalyticsTimeframe = '24h',
  _totalVisits: number | null = null,
  _totalMembers: number | null = null
): PulseStats {
  const is30d = tf === '30d';
  const is7d = tf === '7d';
  const periodLabel = is30d ? 'vs previous 30 days' : is7d ? 'vs previous 7 days' : 'vs previous 24 hours';

  return {
    pageViews: _totalVisits,
    uniqueVisitors: null,
    newReaders: null,
    totalMembers: _totalMembers,
    avgTimeOnSite: '—',
    pageViewsChange: undefined,
    uniqueVisitorsChange: undefined,
    newReadersChange: undefined,
    avgTimeChange: undefined,
    hourlyActivity: [],
    countries: [],
    topPages: [],
    devices: [],
    referrers: [],
    readingEngagement: {
      bookViews: null,
      readingProgressUpdates: null,
      groupJoins: null,
      discussions: null,
    },
    topMembers: [],
    lastUpdated: '',
    isStale: false,
    partialData: false,
  };
}

export const DEFAULT_BASELINE_STATS: PulseStats = getBaselineStats('24h');

const optionalCount = (...values: unknown[]): number | null => {
  const value = values.find((candidate) => typeof candidate === 'number' && Number.isFinite(candidate));
  return typeof value === 'number' ? value : null;
};

export const useCommunityPulse = (isOpen: boolean = false) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('24h');
  const [stats, setStats] = useState<PulseStats | null>(() => {
    try {
      // Deliberately ignore old cache versions because they could contain lifetime
      // totals mislabeled as period pageviews and synthetic zeroes for missing details.
      const cached = localStorage.getItem(getCacheKey('24h'));
      if (cached) {
        const parsed = JSON.parse(cached) as PulseStats;
        if (parsed && typeof parsed.pageViews === 'number') {
          return { ...parsed, isStale: true };
        }
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

  // Contributor leaderboard (admin-only detailed view)
  const [adminLeaderboard, setAdminLeaderboard] = useState<MemberLeaderboardItem[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

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

  const requestSeqRef = useRef(0);

  /**
   * Resilient fallback fetching directly from database RPCs and exact table counts
   * when edge functions are offline, not deployed, or return legacy schemas.
   */
  /**
   * Fallback to the public-safe aggregate RPC used by the Edge Function.
   * Never query raw visitor-event rows from the browser.
   */
  const fetchDatabaseFallbackStats = useCallback(async (tf: AnalyticsTimeframe): Promise<PulseStats> => {
    const { data, error: rpcErr } = await supabase.rpc('get_community_pulse_stats', { p_timeframe: tf });
    if (rpcErr || !data || typeof data !== 'object') {
      throw new Error(rpcErr?.message || 'Analytics aggregate is unavailable');
    }

    const raw = data as any;
    const getNumber = (...values: unknown[]): number | null => optionalCount(...values);
    const breakdowns = raw.breakdowns || {};
    const dualTable: DualTableInfo = {
      lifetimeVisits: getNumber(raw.lifetime?.totalVisits, raw.totalVisits),
      lifetimeSourceTable: raw.lifetime?.sourceTable ?? 'public.website_visits',
      rolling24hViews: getNumber(raw.rolling?.pageViews24h),
      rolling7dViews: getNumber(raw.rolling?.pageViews7d),
      rolling30dViews: getNumber(raw.rolling?.pageViews30d),
      uniqueVisitors24h: getNumber(raw.rolling?.uniqueVisitors24h),
      uniqueVisitors7d: getNumber(raw.rolling?.uniqueVisitors7d),
      uniqueVisitors30d: getNumber(raw.rolling?.uniqueVisitors30d),
      rollingSourceTable: raw.rolling?.sourceTable ?? 'public.website_visit_events',
      collectionStartedAt: raw.rolling?.collectionStartedAt,
      isInitialRollout: Boolean(raw.rolling?.isInitialRollout),
    };

    const hours: HourPoint[] = Array.isArray(raw.hourlyActivity)
      ? raw.hourlyActivity.map((h: any, i: number) => ({
          label: String(h.label ?? `${i}:00`),
          count: Number(h.pageViews ?? h.count ?? 0),
          uniqueVisitors: typeof h.uniqueVisitors === 'number' ? h.uniqueVisitors : undefined,
          hourIndex: typeof h.hourIndex === 'number' ? h.hourIndex : i,
          isPeak: Boolean(h.isPeak),
          bucketStart: h.bucketStart,
        }))
      : [];

    const reading = raw.readingEngagement || raw.engagement || {};
    const readingEngagement = {
      bookViews: getNumber(reading.bookViews?.count, reading.bookViews, reading.bookOpens?.value),
      readingProgressUpdates: getNumber(reading.readingProgressUpdates?.count, reading.readingProgressUpdates, reading.readingProgressCompletions?.value),
      groupJoins: getNumber(reading.groupJoinsCount?.count, reading.groupJoins, reading.groupJoinsCount?.value),
      discussions: getNumber(reading.discussionsCount?.count, reading.discussions, reading.discussionsCount?.value),
    };

    const countries = Array.isArray(breakdowns.countries) ? breakdowns.countries : Array.isArray(raw.topCountries) ? raw.topCountries : [];
    const pages = Array.isArray(breakdowns.pages) ? breakdowns.pages : Array.isArray(raw.topPages) ? raw.topPages : [];
    const devices = Array.isArray(breakdowns.devices) ? breakdowns.devices : Array.isArray(raw.devices) ? raw.devices : [];
    const referrers = Array.isArray(breakdowns.referrers) ? breakdowns.referrers : Array.isArray(raw.referrers) ? raw.referrers : [];
    const partialData = Boolean(
      raw.partialData ||
      !Array.isArray(raw.hourlyActivity) ||
      !Array.isArray(breakdowns.countries) ||
      !Array.isArray(breakdowns.pages) ||
      !Array.isArray(breakdowns.devices) ||
      !Array.isArray(breakdowns.referrers)
    );

    const selectedPageViews = getNumber(raw.pageViews, raw.metrics?.periodPageViews?.value);
    const selectedUnique = getNumber(raw.uniqueVisitors, raw.metrics?.uniqueVisitors?.value);
    const selectedNewReaders = getNumber(raw.newReaders, raw.metrics?.newReaders?.value);

    return {
      pageViews: selectedPageViews,
      uniqueVisitors: selectedUnique,
      newReaders: selectedNewReaders,
      totalMembers: getNumber(raw.totalMembers, raw.registeredReaders, raw.metrics?.registeredReaders?.value),
      avgTimeOnSite: '—',
      pageViewsChange: raw.comparisons?.pageViewsChangePercent == null ? undefined : { value: raw.comparisons.pageViewsChangePercent, label: `vs previous ${tf}` },
      uniqueVisitorsChange: raw.comparisons?.uniqueVisitorsChangePercent == null ? undefined : { value: raw.comparisons.uniqueVisitorsChangePercent, label: `vs previous ${tf}` },
      newReadersChange: raw.comparisons?.newReadersChangePercent == null ? undefined : { value: raw.comparisons.newReadersChangePercent, label: `vs previous ${tf}` },
      avgTimeChange: undefined,
      hourlyActivity: hours,
      dailyActivity: Array.isArray(raw.dailyActivity) ? raw.dailyActivity : [],
      lifetimeVisits: dualTable.lifetimeVisits,
      dualTable,
      countries,
      topPages: pages,
      devices,
      referrers,
      readingEngagement,
      topMembers: Array.isArray(raw.topMembers) ? raw.topMembers : [],
      lastUpdated: raw.lastUpdated || new Date().toISOString(),
      isStale: false,
      partialData,
    };
  }, []);
  // 2. Fetch Aggregate Stats with Seamless Fallback
  const fetchStats = useCallback(
    async (manual: boolean = false) => {
      const currentSeq = ++requestSeqRef.current;

      if (manual || !statsRef.current) {
        setLoading(true);
      }

      try {
        let statsPayload: PulseStats | null = null;
        const is30d = timeframe === '30d';
        const is7d = timeframe === '7d';
        const periodLabel = is30d ? 'vs previous 30 days' : is7d ? 'vs previous 7 days' : 'vs previous 24 hours';

        // Read the authoritative database aggregate first. This is the single source of truth
        // for both tables and returns the selected timeframe plus trend/breakdown arrays.
        try {
          const { data, error: rpcError } = await supabase.rpc('get_dual_table_website_analytics', {
            p_timeframe: timeframe,
          });
          if (rpcError) throw new Error(rpcError.message || 'Analytics RPC unavailable');
          if (!data || typeof data !== 'object') throw new Error('Analytics RPC returned an invalid payload');

          const raw = data as any;
          const periodViews = typeof raw.pageViews === 'number' ? raw.pageViews : null;
          const uniqueVisitors = typeof raw.uniqueVisitors === 'number' ? raw.uniqueVisitors : null;
          const totalMembers = typeof raw.totalMembers === 'number' ? raw.totalMembers
            : typeof raw.registeredReaders === 'number' ? raw.registeredReaders : null;
          const newReaders = typeof raw.newReaders === 'number' ? raw.newReaders : null;
          const hourlyActivity: HourPoint[] = Array.isArray(raw.hourlyActivity)
            ? raw.hourlyActivity.map((h: any, i: number) => ({
                label: String(h.label ?? `${i}:00`),
                count: Number(h.pageViews ?? h.count ?? 0),
                uniqueVisitors: typeof h.uniqueVisitors === 'number' ? h.uniqueVisitors : undefined,
                hourIndex: typeof h.hourIndex === 'number' ? h.hourIndex : i,
                isPeak: Boolean(h.isPeak),
                bucketStart: h.bucketStart,
              }))
            : [];
          const countries = Array.isArray(raw.breakdowns?.countries) ? raw.breakdowns.countries : [];
          const topPages = Array.isArray(raw.breakdowns?.pages) ? raw.breakdowns.pages : [];
          const devices = Array.isArray(raw.breakdowns?.devices) ? raw.breakdowns.devices : [];
          const referrers = Array.isArray(raw.breakdowns?.referrers) ? raw.breakdowns.referrers : [];
          const dualTable: DualTableInfo = {
            lifetimeVisits: typeof raw.lifetime?.totalVisits === 'number' ? raw.lifetime.totalVisits : null,
            lifetimeSourceTable: raw.lifetime?.sourceTable ?? 'public.website_visits',
            rolling24hViews: typeof raw.rolling?.pageViews24h === 'number' ? raw.rolling.pageViews24h : null,
            rolling7dViews: typeof raw.rolling?.pageViews7d === 'number' ? raw.rolling.pageViews7d : null,
            rolling30dViews: typeof raw.rolling?.pageViews30d === 'number' ? raw.rolling.pageViews30d : null,
            uniqueVisitors24h: typeof raw.rolling?.uniqueVisitors24h === 'number' ? raw.rolling.uniqueVisitors24h : null,
            uniqueVisitors7d: typeof raw.rolling?.uniqueVisitors7d === 'number' ? raw.rolling.uniqueVisitors7d : null,
            uniqueVisitors30d: typeof raw.rolling?.uniqueVisitors30d === 'number' ? raw.rolling.uniqueVisitors30d : null,
            rollingSourceTable: raw.rolling?.sourceTable ?? 'public.website_visit_events',
            collectionStartedAt: raw.rolling?.collectionStartedAt,
            isInitialRollout: Boolean(raw.rolling?.isInitialRollout),
          };
          statsPayload = {
            pageViews: periodViews,
            uniqueVisitors,
            newReaders,
            totalMembers,
            avgTimeOnSite: '—',
            pageViewsChange: raw.comparisons?.pageViewsChangePercent == null ? undefined : { value: raw.comparisons.pageViewsChangePercent, label: `vs previous ${timeframe}` },
            uniqueVisitorsChange: raw.comparisons?.uniqueVisitorsChangePercent == null ? undefined : { value: raw.comparisons.uniqueVisitorsChangePercent, label: `vs previous ${timeframe}` },
            newReadersChange: raw.comparisons?.newReadersChangePercent == null ? undefined : { value: raw.comparisons.newReadersChangePercent, label: `vs previous ${timeframe}` },
            hourlyActivity,
            dailyActivity: Array.isArray(raw.dailyActivity) ? raw.dailyActivity : [],
            lifetimeVisits: dualTable.lifetimeVisits,
            dualTable,
            countries,
            topPages,
            devices,
            referrers,
            readingEngagement: {
              bookViews: optionalCount(raw.readingEngagement?.bookViews?.count, raw.readingEngagement?.bookViews),
              readingProgressUpdates: optionalCount(raw.readingEngagement?.readingProgressUpdates?.count, raw.readingEngagement?.readingProgressUpdates),
              groupJoins: optionalCount(raw.readingEngagement?.groupJoinsCount?.count, raw.readingEngagement?.groupJoins),
              discussions: optionalCount(raw.readingEngagement?.discussionsCount?.count, raw.readingEngagement?.discussions),
            },
            topMembers: Array.isArray(raw.topMembers) ? raw.topMembers : [],
            lastUpdated: raw.lastUpdated || new Date().toISOString(),
            isStale: false,
            partialData: Boolean(
              raw.error || raw.partialData ||
              !Array.isArray(raw.hourlyActivity) ||
              !Array.isArray(raw.breakdowns?.countries) ||
              !Array.isArray(raw.breakdowns?.pages) ||
              !Array.isArray(raw.breakdowns?.devices) ||
              !Array.isArray(raw.breakdowns?.referrers)
            ),
          };
        } catch (primaryErr) {
          // Compatibility path while the authoritative SQL migration is being deployed.
          statsPayload = await fetchDatabaseFallbackStats(timeframe);
        }

        if (isMountedRef.current && currentSeq === requestSeqRef.current && statsPayload) {
          setStats(statsPayload);
          setError(null);
          try {
            localStorage.setItem(getCacheKey(timeframe), JSON.stringify(statsPayload));
          } catch {
            // ignore storage quota error
          }
        }
      } catch (err: any) {
        if (isMountedRef.current && currentSeq === requestSeqRef.current) {
          // Preserve last successful result when refresh fails, but label it as stale
          setStats(prev => (prev ? { ...prev, isStale: true } : null));
          setError(err.message || 'Network error fetching community stats');
        }
      } finally {
        if (isMountedRef.current && currentSeq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [timeframe, fetchDatabaseFallbackStats]
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
        setVisitors([]);
        setVisitorsError(err.message || 'Unauthorized or RPC error loading visitor logs');
      }
    } finally {
      inFlightVisitorsRef.current = false;
      if (isMountedRef.current) {
        setVisitorsLoading(false);
      }
    }
  }, [isAdmin, visitorSearch]);

  // 4. Fetch Contributor Leaderboard (Admin-Only)
  const fetchAdminLeaderboard = useCallback(async () => {
    if (!isAdmin) {
      setAdminLeaderboard([]);
      return;
    }

    setLeaderboardLoading(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_admin_contributor_leaderboard', {
        p_timeframe: timeframe,
      });

      if (!rpcErr && data && Array.isArray(data.leaderboard)) {
        if (isMountedRef.current) {
          setAdminLeaderboard(data.leaderboard);
        }
      }
    } catch {
      // ignore
    } finally {
      if (isMountedRef.current) {
        setLeaderboardLoading(false);
      }
    }
  }, [isAdmin, timeframe]);

  const handleSetTimeframe = useCallback((newTf: AnalyticsTimeframe) => {
    setTimeframe(newTf);
    try {
      const cached = localStorage.getItem(getCacheKey(newTf));
      if (cached) {
        const parsed = JSON.parse(cached) as PulseStats;
        if (parsed && ((typeof parsed.pageViews === 'number' && parsed.pageViews > 0) || (typeof parsed.totalMembers === 'number' && parsed.totalMembers > 0))) {
          setStats({ ...parsed, isStale: true });
          return;
        }
      }
    } catch {
      // ignore
    }
    // Clean transition state without fabricated baseline
    setStats(prev => (prev ? { ...prev, isStale: true } : null));
  }, []);

  // Initial and timeframe change fetch when opened
  useEffect(() => {
    if (isOpen) {
      void fetchStats(false);
      if (isAdmin) {
        void fetchRecentVisitors();
        void fetchAdminLeaderboard();
      }
    }
  }, [isOpen, timeframe, isAdmin, fetchStats, fetchRecentVisitors, fetchAdminLeaderboard]);

  // Periodic polling only when dialog is open and document is visible
  useEffect(() => {
    if (!isOpen) return;

    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchStats(false);
        if (isAdmin) {
          void fetchRecentVisitors();
          void fetchAdminLeaderboard();
        }
      }
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isOpen, isAdmin, fetchStats, fetchRecentVisitors, fetchAdminLeaderboard]);

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
    setTimeframe: handleSetTimeframe,
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
    // Leaderboard (Admin only)
    adminLeaderboard,
    leaderboardLoading,
    refetchLeaderboard: fetchAdminLeaderboard,
  };
};

export default useCommunityPulse;
