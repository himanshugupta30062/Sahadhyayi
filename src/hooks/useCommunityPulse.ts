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
  sessions?: number | null;
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
  diagnostics?: {
    rpcStatus?: string;
    lastFetchTime?: string;
    lifetimeStatus?: string;
    rollingStatus?: string;
    ingestionStatus?: string;
  };
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
  ipAddress?: string | null;
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
    sessions: null,
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

    void verifyAdmin();
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
   * Fallback to the public-safe aggregate RPC used by the Edge Function or public counts.
   * Never query raw visitor-event rows from the browser.
   */
  const parseStatsPayload = useCallback((raw: any, tf: AnalyticsTimeframe): PulseStats => {
    const getNumber = (...values: unknown[]): number | null => optionalCount(...values);
    const breakdowns = raw.breakdowns || {};
    const dualTable: DualTableInfo = {
      lifetimeVisits: getNumber(raw.lifetime?.totalVisits, raw.totalVisits),
      lifetimeSourceTable: raw.lifetime?.sourceTable ?? 'public.website_visits',
      rolling24hViews: getNumber(raw.rolling?.pageViews24h, raw.last24hVisits),
      rolling7dViews: getNumber(raw.rolling?.pageViews7d, tf === '7d' ? (raw.pageViews ?? raw.last24hVisits) : null),
      rolling30dViews: getNumber(raw.rolling?.pageViews30d, tf === '30d' ? (raw.pageViews ?? raw.last24hVisits) : null),
      uniqueVisitors24h: getNumber(raw.rolling?.uniqueVisitors24h, raw.uniqueVisitors24h),
      uniqueVisitors7d: getNumber(raw.rolling?.uniqueVisitors7d, tf === '7d' ? (raw.uniqueVisitors ?? raw.uniqueVisitors24h) : null),
      uniqueVisitors30d: getNumber(raw.rolling?.uniqueVisitors30d, tf === '30d' ? (raw.uniqueVisitors ?? raw.uniqueVisitors24h) : null),
      rollingSourceTable: raw.rolling?.sourceTable ?? 'public.website_visit_events',
      collectionStartedAt: raw.rolling?.collectionStartedAt ?? raw.collectionStartedAt ?? '2026-10-19T00:00:00Z',
      isInitialRollout: Boolean(raw.rolling?.isInitialRollout ?? raw.dataCoverage?.isInitialRollout),
    };

    const rawHourly = Array.isArray(raw.timeseries) ? raw.timeseries
      : Array.isArray(raw.hourlyActivity) ? raw.hourlyActivity
      : Array.isArray(raw.hourlyTraffic) ? raw.hourlyTraffic : [];

    const hours: HourPoint[] = rawHourly.map((h: any, i: number) => ({
      label: String(h.label ?? `${i}:00`),
      count: Number(h.pageViews ?? h.count ?? 0),
      uniqueVisitors: typeof h.uniqueVisitors === 'number' ? h.uniqueVisitors : undefined,
      hourIndex: typeof h.hourIndex === 'number' ? h.hourIndex : i,
      isPeak: Boolean(h.isPeak),
      bucketStart: h.bucketStart,
    }));

    const reading = raw.readingEngagement || raw.engagement || {};
    const readingEngagement = {
      bookViews: getNumber(reading.bookViews?.count, reading.bookViews, reading.bookOpens?.value, reading.bookOpens),
      readingProgressUpdates: getNumber(reading.readingProgressUpdates?.count, reading.readingProgressUpdates, reading.readingProgressCompletions?.value, reading.readingProgressCompletions),
      groupJoins: getNumber(reading.groupJoinsCount?.count, reading.groupJoins, reading.groupJoinsCount, reading.groupJoinsCount?.value),
      discussions: getNumber(reading.discussionsCount?.count, reading.discussions, reading.discussionsCount?.value),
    };

    const countries = Array.isArray(breakdowns.countries) ? breakdowns.countries : Array.isArray(raw.topCountries) ? raw.topCountries : [];
    const pages = Array.isArray(breakdowns.pages) ? breakdowns.pages : Array.isArray(raw.topPages) ? raw.topPages : [];
    const devices = Array.isArray(breakdowns.devices) ? breakdowns.devices : Array.isArray(raw.devices) ? raw.devices : [];
    const referrers = Array.isArray(breakdowns.referrers) ? breakdowns.referrers : Array.isArray(raw.referrers) ? raw.referrers : [];

    const hasHourly = Array.isArray(raw.timeseries) || Array.isArray(raw.hourlyActivity) || Array.isArray(raw.hourlyTraffic);
    const hasCountries = Array.isArray(breakdowns.countries) || Array.isArray(raw.topCountries);
    const hasPages = Array.isArray(breakdowns.pages) || Array.isArray(raw.topPages);
    const hasDevices = Array.isArray(breakdowns.devices) || Array.isArray(raw.devices);
    const hasReferrers = Array.isArray(breakdowns.referrers) || Array.isArray(raw.referrers);

    const partialData = Boolean(
      raw.error ||
      raw.partialData ||
      raw.dataCoverage?.isPartial ||
      !hasHourly ||
      !hasCountries ||
      !hasPages ||
      !hasDevices ||
      !hasReferrers
    );

    // Resolve the selected timeframe from the rolling aggregate before considering
    // legacy fields. Lifetime totals must never be presented as period page views.
    const selectedPageViews = getNumber(
      raw.period?.pageViews,
      tf === '30d' ? raw.rolling?.pageViews30d : tf === '7d' ? raw.rolling?.pageViews7d : raw.rolling?.pageViews24h,
      raw.pageViews,
      raw.last24hVisits,
      raw.periodVisits,
      raw.metrics?.periodPageViews?.value
    );
    const selectedUnique = getNumber(
      raw.period?.uniqueVisitors,
      tf === '30d' ? raw.rolling?.uniqueVisitors30d : tf === '7d' ? raw.rolling?.uniqueVisitors7d : raw.rolling?.uniqueVisitors24h,
      raw.uniqueVisitors,
      raw.uniqueVisitors24h,
      raw.metrics?.uniqueVisitors?.value
    );
    const selectedNewReaders = getNumber(
      raw.period?.newRegistrations,
      raw.newReaders,
      raw.newSignups24h,
      raw.newUsers,
      raw.metrics?.newReaders?.value
    );
    const totalMembers = getNumber(
      raw.period?.registeredReaders,
      raw.totalMembers,
      raw.registeredReaders,
      raw.totalSignups,
      raw.metrics?.registeredReaders?.value
    );

    const pageViewsChange = raw.comparison?.pageViewsChangePercent != null
      ? { value: raw.comparison.pageViewsChangePercent, label: `vs previous ${tf}` }
      : raw.comparisons?.pageViewsChangePercent != null
      ? { value: raw.comparisons.pageViewsChangePercent, label: `vs previous ${tf}` }
      : undefined;

    const uniqueVisitorsChange = raw.comparison?.uniqueVisitorsChangePercent != null
      ? { value: raw.comparison.uniqueVisitorsChangePercent, label: `vs previous ${tf}` }
      : raw.comparisons?.uniqueVisitorsChangePercent != null
      ? { value: raw.comparisons.uniqueVisitorsChangePercent, label: `vs previous ${tf}` }
      : undefined;

    const newReadersChange = raw.comparison?.newRegistrationsChangePercent != null
      ? { value: raw.comparison.newRegistrationsChangePercent, label: `vs previous ${tf}` }
      : raw.comparisons?.newReadersChangePercent != null
      ? { value: raw.comparisons.newReadersChangePercent, label: `vs previous ${tf}` }
      : undefined;

    const selectedSessions = getNumber(
      raw.period?.sessions,
      raw.sessions,
      raw.rolling?.sessions,
      raw.metrics?.sessions?.value
    );

    const diagnostics = {
      rpcStatus: raw.source === 'rpc' || raw.dualTable ? 'Operational (Dual-Table RPC)' : 'Operational (Edge Function / Fallback)',
      lastFetchTime: new Date().toISOString(),
      lifetimeStatus: dualTable.lifetimeVisits !== null ? 'Healthy (Preserved in public.website_visits)' : 'Unavailable',
      rollingStatus: dualTable.isInitialRollout ? 'Initial Rollout Bridge' : 'Rolling 30-Day Active',
      ingestionStatus: 'Edge Function only (server-derived location metadata)',
    };

    return {
      pageViews: selectedPageViews,
      uniqueVisitors: selectedUnique,
      sessions: selectedSessions,
      newReaders: selectedNewReaders,
      totalMembers,
      avgTimeOnSite: '—',
      pageViewsChange,
      uniqueVisitorsChange,
      newReadersChange,
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
      lastUpdated: raw.lastUpdated || raw.generatedAt || new Date().toISOString(),
      isStale: false,
      partialData,
      diagnostics,
    };
  }, []);

  /**
   * Analytics fallback uses the same server-side aggregate RPC as the primary
   * Edge Function. Never fall back to probing protected tables from the browser:
   * missing table grants/RLS must not produce repeated 401s or tempt broad grants.
   */
  const fetchDatabaseFallbackStats = useCallback(async (tf: AnalyticsTimeframe): Promise<PulseStats> => {
    const { data, error: rpcError } = await supabase.rpc('get_admin_website_analytics', {
      p_timeframe: tf,
    });

    if (rpcError || !data || typeof data !== 'object') {
      throw new Error('Analytics aggregate is unavailable');
    }

    return parseStatsPayload(data, tf);
  }, [parseStatsPayload]);

  /**
   * Public-safe aggregate fallback keeps the Live Website Stats overview usable
   * when the admin session is missing, expired, or no longer authorized. The
   * public endpoint returns aggregate counts only; visitor-level data stays admin-only.
   */
  const fetchPublicFallbackStats = useCallback(async (tf: AnalyticsTimeframe): Promise<PulseStats> => {
    const { data, error: publicError } = await supabase.functions.invoke('public-community-stats', {
      body: { timeframe: tf },
    });

    if (publicError || !data || typeof data !== 'object') {
      throw new Error('Public analytics summary is unavailable');
    }

    return parseStatsPayload(data, tf);
  }, [parseStatsPayload]);

  // 2. Fetch Aggregate Stats with Seamless Fallback
  const fetchStats = useCallback(
    async (manual: boolean = false) => {
      const currentSeq = ++requestSeqRef.current;

      if (manual || !statsRef.current) {
        setLoading(true);
      }

      try {
        let statsPayload: PulseStats | null = null;
        let primaryError: Error | null = null;

        // The Edge Function is the single admin-gated analytics entry point.
        // Pass the current access token explicitly so browser clients never fall
        // back to anon credentials when the auth header is not attached automatically.
        try {
          const invokeForToken = (accessToken: string) => supabase.functions.invoke('community-stats', {
            body: { timeframe },
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          let accessToken = sessionData?.session?.access_token;
          if (sessionError || !accessToken) {
            throw new Error('A valid administrator session is required to load live analytics');
          }

          let { data: edgeStats, error: edgeError } = await invokeForToken(accessToken);
          const edgeStatus = (edgeError as any)?.context?.status ?? (edgeError as any)?.status;
          // Access tokens can become stale across tabs or after a long-lived admin
          // session. Refresh and retry one time on 401; never retry 403 (not admin).
          if (edgeError && Number(edgeStatus) === 401) {
            const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
            const refreshedToken = refreshedData?.session?.access_token;
            if (!refreshError && refreshedToken) {
              accessToken = refreshedToken;
              ({ data: edgeStats, error: edgeError } = await invokeForToken(accessToken));
            }
          }
          if (edgeError) {
            const error = new Error(edgeError.message || 'Community stats Edge Function unavailable');
            (error as any).status = (edgeError as any)?.context?.status ?? (edgeError as any)?.status;
            throw error;
          }
          if (!edgeStats || typeof edgeStats !== 'object') {
            throw new Error('Community stats Edge Function returned an invalid payload');
          }
          statsPayload = parseStatsPayload(edgeStats, timeframe);
          primaryError = null;
        } catch (edgeError) {
          primaryError = edgeError instanceof Error ? edgeError : new Error('Community stats Edge Function unavailable');
          const status = Number((edgeError as any)?.status ?? (edgeError as any)?.context?.status ?? 0);
          // Never fan out into protected table/RPC requests after an auth failure.
          // Recover the public overview through the aggregate-only endpoint instead.
          const authFailure =
            status === 401 ||
            status === 403 ||
            /administrator session|required|authentication/i.test(primaryError.message);

          if (authFailure) {
            try {
              statsPayload = await fetchPublicFallbackStats(timeframe);
              primaryError = null;
            } catch {
              // If public aggregates are unavailable too, preserve cached data and the auth error.
            }
          } else {
            try {
              statsPayload = await fetchDatabaseFallbackStats(timeframe);
              primaryError = null;
            } catch {
              // If all sources are unavailable, preserve cache and expose the cause.
            }
          }
        }

        if (isMountedRef.current && currentSeq === requestSeqRef.current && statsPayload) {
          setStats(statsPayload);
          setError(null);
          try {
            localStorage.setItem(getCacheKey(timeframe), JSON.stringify(statsPayload));
          } catch {
            // ignore storage quota error
          }
        } else if (isMountedRef.current && currentSeq === requestSeqRef.current) {
          setStats(prev => (prev ? { ...prev, isStale: true } : null));
          setError(primaryError?.message || 'Network error fetching community stats');
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
    [timeframe, isAdmin, fetchDatabaseFallbackStats, fetchPublicFallbackStats, parseStatsPayload]
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
    latestVisitTime: visitors[0]?.visitedAt || null,
    latestVisitPage: visitors[0]?.page || null,
  };
};

export default useCommunityPulse;
