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

    const selectedPageViews = getNumber(
      raw.period?.pageViews,
      raw.pageViews,
      raw.last24hVisits,
      raw.periodVisits,
      raw.metrics?.periodPageViews?.value
    );
    const selectedUnique = getNumber(
      raw.period?.uniqueVisitors,
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
      ingestionStatus: 'Active & Resilient (Edge Function + record_pageview RPC)',
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

  const safeCount = useCallback(async (table: string, filterField?: string, filterGte?: string, eqField?: string, eqVal?: string): Promise<number | null> => {
    try {
      if (typeof supabase?.from !== 'function') return null;
      let q = supabase.from(table)?.select?.('*', { count: 'exact', head: true });
      if (!q) return null;
      if (eqField && eqVal && typeof (q as any).eq === 'function') {
        q = (q as any).eq(eqField, eqVal);
      }
      if (filterField && filterGte && typeof (q as any).gte === 'function') {
        q = (q as any).gte(filterField, filterGte);
      }
      const res = await q;
      if (res?.error) {
        return null;
      }
      return typeof res?.count === 'number' ? res.count : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Resilient fallback fetching from database RPCs or public counts
   */
  const fetchDatabaseFallbackStats = useCallback(async (tf: AnalyticsTimeframe): Promise<PulseStats> => {
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_community_pulse_stats', { p_timeframe: tf });
      if (!rpcErr && data && typeof data === 'object') {
        return parseStatsPayload(data, tf);
      }
    } catch {
      // Ignore and proceed to public count RPCs and safe table queries
    }

    const timeframeStart = (() => {
      const now = new Date();
      if (tf === '30d') return new Date(now.getTime() - 30 * 86400000).toISOString();
      if (tf === '7d') return new Date(now.getTime() - 7 * 86400000).toISOString();
      return new Date(now.getTime() - 86400000).toISOString();
    })();

    const safeRpc = async (name: string, params?: Record<string, unknown>) => {
      try {
        if (typeof supabase?.rpc !== 'function') return { data: null, error: true };
        return await supabase.rpc(name, params);
      } catch {
        return { data: null, error: true };
      }
    };

    const [
      usersRpcRes,
      totalVisitsRpcRes,
      totalProfiles,
      newProfiles,
      periodPageviews,
      progressUpdates,
      groupJoins,
      postsCount,
      commentsCount,
    ] = await Promise.all([
      safeRpc('get_total_users_count'),
      safeRpc('get_website_visit_count'),
      safeCount('profiles'),
      safeCount('profiles', 'created_at', timeframeStart),
      safeCount('website_visits', 'visited_at', timeframeStart, 'event_type', 'pageview'),
      safeCount('reading_room_events', 'created_at', timeframeStart, 'kind', 'chapter_complete'),
      safeCount('group_members', 'joined_at', timeframeStart),
      safeCount('posts', 'created_at', timeframeStart),
      safeCount('comments', 'created_at', timeframeStart),
    ]);

    const rpcUsers = typeof (usersRpcRes as any)?.data === 'number' ? (usersRpcRes as any).data : null;
    const totalVisits = typeof (totalVisitsRpcRes as any)?.data === 'number' ? (totalVisitsRpcRes as any).data : null;

    const availableCounts = [rpcUsers, totalVisits, totalProfiles, newProfiles, periodPageviews, progressUpdates, groupJoins, postsCount, commentsCount];
    if (availableCounts.every((value) => value === null)) {
      throw new Error('Analytics aggregate is unavailable');
    }

    return {
      pageViews: periodPageviews,
      uniqueVisitors: null,
      newReaders: newProfiles,
      totalMembers: rpcUsers ?? totalProfiles,
      avgTimeOnSite: '—',
      pageViewsChange: undefined,
      uniqueVisitorsChange: undefined,
      newReadersChange: undefined,
      avgTimeChange: undefined,
      hourlyActivity: [],
      dailyActivity: [],
      lifetimeVisits: totalVisits,
      dualTable: {
        lifetimeVisits: totalVisits,
        lifetimeSourceTable: 'public.website_visits',
        rolling24hViews: tf === '24h' ? periodPageviews : null,
        rolling7dViews: tf === '7d' ? periodPageviews : null,
        rolling30dViews: tf === '30d' ? periodPageviews : null,
        uniqueVisitors24h: null,
        uniqueVisitors7d: null,
        uniqueVisitors30d: null,
        rollingSourceTable: 'public.website_visit_events',
        collectionStartedAt: '2026-10-19T00:00:00Z',
        isInitialRollout: true,
      },
      countries: [],
      topPages: [],
      devices: [],
      referrers: [],
      readingEngagement: {
        bookViews: null,
        readingProgressUpdates: progressUpdates,
        groupJoins,
        discussions: postsCount !== null && commentsCount !== null ? postsCount + commentsCount : null,
      },
      topMembers: [],
      lastUpdated: new Date().toISOString(),
      isStale: false,
      partialData: true,
    };
  }, [parseStatsPayload, safeCount]);

  // 2. Fetch Aggregate Stats with Seamless Fallback
  const fetchStats = useCallback(
    async (manual: boolean = false) => {
      const currentSeq = ++requestSeqRef.current;

      if (manual || !statsRef.current) {
        setLoading(true);
      }

      try {
        let statsPayload: PulseStats | null = null;

        // Tier 1: Authoritative dual-table database RPC
        try {
          const { data, error: rpcError } = await supabase.rpc('get_dual_table_website_analytics', {
            p_timeframe: timeframe,
          });
          if (rpcError) throw new Error(rpcError.message || 'Dual-table RPC unavailable');
          if (!data || typeof data !== 'object') throw new Error('Dual-table RPC returned invalid payload');

          statsPayload = parseStatsPayload(data, timeframe);
        } catch (tier1Err) {
          // Tier 2: Deployed Edge Function (utilizes service_role to bypass any client RLS restrictions)
          let edgeCaughtErr: any = null;
          try {
            const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('community-stats', {
              body: { timeframe },
            });
            if (edgeErr || !edgeData || typeof edgeData !== 'object') {
              throw new Error(edgeErr?.message || 'Edge function unavailable');
            }

            statsPayload = parseStatsPayload(edgeData, timeframe);

            // If edge function returned legacy schema without period page views, retrieve verified count
            if (statsPayload.pageViews === null && (statsPayload.totalMembers !== null || statsPayload.lifetimeVisits !== null)) {
              const tfStart = timeframe === '30d' ? new Date(Date.now() - 30 * 86400000).toISOString()
                : timeframe === '7d' ? new Date(Date.now() - 7 * 86400000).toISOString()
                : new Date(Date.now() - 86400000).toISOString();
              const periodViews = await safeCount('website_visits', 'visited_at', tfStart, 'event_type', 'pageview');
              if (periodViews !== null) {
                statsPayload = {
                  ...statsPayload,
                  pageViews: periodViews,
                  partialData: true,
                };
              }
            }
          } catch (tier2Err: any) {
            edgeCaughtErr = tier2Err;
            // If cached stats already exist, preserve them as stale on refresh error
            if (statsRef.current) {
              throw edgeCaughtErr;
            }
            // Tier 3: Public database aggregate / counts fallback only when no cache exists
            statsPayload = await fetchDatabaseFallbackStats(timeframe);
          }
        }

        if (isMountedRef.current && currentSeq === requestSeqRef.current && statsPayload) {
          // Average engaged session time is unavailable until real heartbeat samples exist.
          try {
            const { data: engagement, error: engagementError } = await supabase.rpc('get_website_engagement_stats', {
              p_timeframe: timeframe,
            });
            if (!engagementError && engagement && typeof engagement === 'object') {
              const averageSeconds = typeof engagement.average_seconds_per_session === 'number'
                ? engagement.average_seconds_per_session
                : null;
              statsPayload = {
                ...statsPayload,
                avgTimeOnSite: averageSeconds === null
                  ? 'Not tracked yet'
                  : averageSeconds < 60
                    ? `${Math.round(averageSeconds)} sec`
                    : `${Math.floor(averageSeconds / 60)} min ${Math.round(averageSeconds % 60)} sec`,
                avgTimeChange: undefined,
              };
            } else {
              statsPayload = { ...statsPayload, avgTimeOnSite: 'Not tracked yet' };
            }
          } catch {
            statsPayload = { ...statsPayload, avgTimeOnSite: 'Not tracked yet' };
          }
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
    [timeframe, fetchDatabaseFallbackStats, parseStatsPayload, safeCount]
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
