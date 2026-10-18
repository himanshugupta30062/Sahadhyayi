import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import type { AnalyticsTimeframe } from '@/types/analytics';

export type Change = { value: number | null; label?: string };
export type BreakdownItem = { name: string; count?: number; percent: number; code?: string };
export type HourPoint = { label: string; count: number; hourIndex?: number; isPeak?: boolean; bucketStart?: string };

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
  topMembers?: MemberLeaderboardItem[];
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

export const getCacheKey = (tf: string) => `sahadhyayi_pulse_stats_${tf}_v7`;

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
      bookViews: 0,
      readingProgressUpdates: 0,
      groupJoins: 0,
      discussions: 0,
    },
    topMembers: [],
    lastUpdated: '',
    isStale: false,
  };
}

export const DEFAULT_BASELINE_STATS: PulseStats = getBaselineStats('24h');

export const useCommunityPulse = (isOpen: boolean = false) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('24h');
  const [stats, setStats] = useState<PulseStats | null>(() => {
    try {
      const cached =
        localStorage.getItem(getCacheKey('24h')) ||
        localStorage.getItem('sahadhyayi_pulse_stats_24h_v6') ||
        localStorage.getItem('sahadhyayi_pulse_stats_24h_v5') ||
        localStorage.getItem('sahadhyayi_pulse_stats_24h_v4') ||
        localStorage.getItem('sahadhyayi_pulse_stats_24h_v3') ||
        localStorage.getItem('sahadhyayi_pulse_stats_v2');
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
  const fetchDatabaseFallbackStats = useCallback(async (tf: AnalyticsTimeframe): Promise<PulseStats> => {
    const is30d = tf === '30d';
    const is7d = tf === '7d';
    const periodLabel = is30d ? 'vs previous 30 days' : is7d ? 'vs previous 7 days' : 'vs previous 24 hours';
    const now = Date.now();
    const hours = tf === '7d' ? 168 : tf === '30d' ? 720 : 24;
    const timeframeStart = new Date(now - hours * 3600 * 1000).toISOString();

    const safeRpc = async (fn: string, params?: any) => {
      try {
        if (typeof supabase?.rpc !== 'function') return { data: null, error: true };
        const res = await supabase.rpc(fn, params);
        return res || { data: null, error: true };
      } catch {
        return { data: null, error: true };
      }
    };

    const safeCount = async (table: string, filterField?: string, filterGte?: string, eqField?: string, eqVal?: string): Promise<number | null> => {
      try {
        if (typeof supabase?.from !== 'function') return null;
        let q = supabase.from(table)?.select?.('*', { count: 'exact', head: true });
        if (!q) return null;
        if (eqField && eqVal && typeof q.eq === 'function') {
          q = q.eq(eqField, eqVal);
        }
        if (filterField && filterGte && typeof q.gte === 'function') {
          q = q.gte(filterField, filterGte);
        }
        const res = await q;
        if (res?.error) {
          return null;
        }
        return typeof res?.count === 'number' ? res.count : null;
      } catch {
        return null;
      }
    };

    // 1. Try authoritative PostgreSQL RPC directly (if available)
    const rpcRes = await safeRpc('get_community_pulse_stats', { p_timeframe: tf });
    const rpcData = (rpcRes as any)?.data;

    if (rpcData && typeof rpcData === 'object' && !rpcRes?.error) {
      const rawPeriodViews = typeof rpcData.metrics?.periodPageViews?.value === 'number'
        ? rpcData.metrics.periodPageViews.value
        : typeof rpcData.last24hVisits === 'number'
        ? rpcData.last24hVisits
        : typeof rpcData.periodVisits === 'number'
        ? rpcData.periodVisits
        : typeof rpcData.pageViews === 'number'
        ? rpcData.pageViews
        : typeof rpcData.totalVisits === 'number'
        ? rpcData.totalVisits
        : null;

      const rawTotalMembers = typeof rpcData.metrics?.registeredReaders?.value === 'number'
        ? rpcData.metrics.registeredReaders.value
        : typeof rpcData.totalMembers === 'number'
        ? rpcData.totalMembers
        : typeof rpcData.totalSignups === 'number'
        ? rpcData.totalSignups
        : null;

      if (rawPeriodViews !== null || rawTotalMembers !== null) {
        const pageViews = rawPeriodViews;
        const uniqueVisitors = typeof rpcData.metrics?.uniqueVisitors?.value === 'number'
          ? rpcData.metrics.uniqueVisitors.value
          : typeof rpcData.uniqueVisitors24h === 'number'
          ? rpcData.uniqueVisitors24h
          : typeof rpcData.uniqueVisitors === 'number'
          ? rpcData.uniqueVisitors
          : null;

        const newReaders = typeof rpcData.metrics?.newReaders?.value === 'number'
          ? rpcData.metrics.newReaders.value
          : typeof rpcData.newSignups24h === 'number'
          ? rpcData.newSignups24h
          : typeof rpcData.newReaders === 'number'
          ? rpcData.newReaders
          : null;

        const totalMembers = rawTotalMembers;

        const rawHourly = Array.isArray(rpcData.hourlyActivity) ? rpcData.hourlyActivity : [];
        const hourlyActivity: HourPoint[] = rawHourly.length > 0
          ? rawHourly.map((h: any, i: number) => ({
              label: h.label || `${i}:00`,
              count: Number(h.pageViews ?? h.count ?? 0),
              hourIndex: h.hourIndex ?? i,
              isPeak: Boolean(h.isPeak),
              bucketStart: h.bucketStart,
            }))
          : [];

        const rawCountries = Array.isArray(rpcData.breakdowns?.countries)
          ? rpcData.breakdowns.countries
          : Array.isArray(rpcData.topCountries)
          ? rpcData.topCountries
          : [];

        const rawPages = Array.isArray(rpcData.breakdowns?.pages)
          ? rpcData.breakdowns.pages
          : Array.isArray(rpcData.topPages)
          ? rpcData.topPages
          : [];

        const rawDevices = Array.isArray(rpcData.breakdowns?.devices)
          ? rpcData.breakdowns.devices
          : Array.isArray(rpcData.devices)
          ? rpcData.devices
          : [];

        const rawReferrers = Array.isArray(rpcData.breakdowns?.referrers)
          ? rpcData.breakdowns.referrers
          : Array.isArray(rpcData.referrers)
          ? rpcData.referrers
          : [];

        const rawTopMembers = Array.isArray(rpcData.topMembers) ? rpcData.topMembers : [];

        const pageViewsChange = rpcData.comparisons?.pageViewsChangePercent != null
          ? { value: rpcData.comparisons.pageViewsChangePercent, label: periodLabel }
          : undefined;

        const uniqueVisitorsChange = rpcData.comparisons?.uniqueVisitorsChangePercent != null
          ? { value: rpcData.comparisons.uniqueVisitorsChangePercent, label: periodLabel }
          : undefined;

        const newReadersChange = rpcData.comparisons?.newReadersChangePercent != null
          ? { value: rpcData.comparisons.newReadersChangePercent, label: periodLabel }
          : undefined;

        const readingEngagement = {
          bookViews: Number(rpcData.engagement?.bookOpens?.value ?? rpcData.readingEngagement?.bookViews?.count ?? rpcData.readingEngagement?.bookViews ?? 0),
          readingProgressUpdates: Number(rpcData.engagement?.readingProgressCompletions?.value ?? rpcData.readingEngagement?.readingProgressUpdates?.count ?? 0),
          groupJoins: Number(rpcData.engagement?.groupJoins?.value ?? rpcData.readingEngagement?.groupJoinsCount?.count ?? rpcData.readingEngagement?.groupJoins ?? 0),
          discussions: Number(rpcData.engagement?.discussions?.value ?? rpcData.readingEngagement?.discussionsCount?.count ?? rpcData.readingEngagement?.discussions ?? 0),
        };

        return {
          pageViews,
          uniqueVisitors,
          newReaders,
          totalMembers,
          avgTimeOnSite: '—',
          pageViewsChange,
          uniqueVisitorsChange,
          newReadersChange,
          avgTimeChange: undefined,
          hourlyActivity,
          countries: rawCountries,
          topPages: rawPages,
          devices: rawDevices,
          referrers: rawReferrers,
          readingEngagement,
          topMembers: rawTopMembers,
          lastUpdated: rpcData.lastUpdated || new Date().toISOString(),
          isStale: false,
        };
      }
    }

    // 2. Head-count / public RPC fallback: query authoritative counts directly
    const [
      usersRpcRes,
      visitsRpcRes,
      totalProfiles,
      newProfiles,
      progressUpdates,
      groupJoins,
      postsCount,
      commentsCount,
    ] = await Promise.all([
      safeRpc('get_total_users_count'),
      safeRpc('get_website_visit_count'),
      safeCount('profiles'),
      safeCount('profiles', 'created_at', timeframeStart),
      safeCount('reading_room_events', 'created_at', timeframeStart, 'kind', 'chapter_complete'),
      safeCount('group_members', 'joined_at', timeframeStart),
      safeCount('posts', 'created_at', timeframeStart),
      safeCount('post_comments', 'created_at', timeframeStart),
    ]);

    const rpcUsers = typeof (usersRpcRes as any)?.data === 'number' ? (usersRpcRes as any).data : null;
    const rpcVisits = typeof (visitsRpcRes as any)?.data === 'number' ? (visitsRpcRes as any).data : null;

    if (rpcVisits === null && rpcUsers === null && totalProfiles === null) {
      throw new Error('Database statistics unavailable');
    }

    const finalTotalMembers = rpcUsers !== null ? rpcUsers : (typeof totalProfiles === 'number' ? totalProfiles : 0);

    return {
      pageViews: rpcVisits ?? 0,
      uniqueVisitors: 0,
      newReaders: newProfiles ?? 0,
      totalMembers: finalTotalMembers,
      avgTimeOnSite: '—',
      pageViewsChange: undefined,
      uniqueVisitorsChange: undefined,
      newReadersChange: undefined,
      avgTimeChange: undefined,
      hourlyActivity: buildEmptyHourlyBuckets(),
      countries: [],
      topPages: [],
      devices: [],
      referrers: [],
      readingEngagement: {
        bookViews: 0,
        readingProgressUpdates: progressUpdates ?? 0,
        groupJoins: groupJoins ?? 0,
        discussions: (postsCount ?? 0) + (commentsCount ?? 0),
      },
      topMembers: [],
      lastUpdated: new Date().toISOString(),
      isStale: false,
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

        // Step A: Attempt primary Edge Function
        try {
          const { data, error: invokeErr } = await supabase.functions.invoke('community-stats', {
            body: { timeframe },
          });

          if (invokeErr) {
            throw new Error(invokeErr.message || 'Failed to fetch community stats');
          }

          if (!data || typeof data !== 'object') {
            throw new Error('Invalid statistics payload returned');
          }

          // Check for valid traffic telemetry in modern payload
          // Note: DO NOT map communityActivity (which represents post/comment actions) to pageViews!
          const rawPeriodViews = typeof data.metrics?.periodPageViews?.value === 'number'
            ? data.metrics.periodPageViews.value
            : typeof data.last24hVisits === 'number'
            ? data.last24hVisits
            : typeof data.periodVisits === 'number'
            ? data.periodVisits
            : typeof data.pageViews === 'number'
            ? data.pageViews
            : typeof data.totalVisits === 'number'
            ? data.totalVisits
            : null;

          const rawTotalMembers = typeof data.metrics?.registeredReaders?.value === 'number'
            ? data.metrics.registeredReaders.value
            : typeof data.registeredReaders === 'number'
            ? data.registeredReaders
            : typeof data.totalMembers === 'number'
            ? data.totalMembers
            : typeof data.totalSignups === 'number'
            ? data.totalSignups
            : null;

          // If rawPeriodViews is null, the Edge Function returned an outdated legacy payload without traffic metrics!
          // Fall back to direct database queries!
          if (rawPeriodViews === null) {
            try {
              statsPayload = await fetchDatabaseFallbackStats(timeframe);
            } catch {
              if (rawTotalMembers !== null) {
                statsPayload = {
                  pageViews: 0,
                  uniqueVisitors: 0,
                  newReaders: 0,
                  totalMembers: rawTotalMembers,
                  avgTimeOnSite: '—',
                  pageViewsChange: undefined,
                  uniqueVisitorsChange: undefined,
                  newReadersChange: undefined,
                  avgTimeChange: undefined,
                  hourlyActivity: buildEmptyHourlyBuckets(),
                  countries: [],
                  topPages: [],
                  devices: [],
                  referrers: [],
                  readingEngagement: {
                    bookViews: 0,
                    readingProgressUpdates: 0,
                    groupJoins: 0,
                    discussions: 0,
                  },
                  topMembers: [],
                  lastUpdated: data.lastUpdated || new Date().toISOString(),
                  isStale: false,
                };
              }
            }
            if (statsPayload && rawTotalMembers !== null) {
              statsPayload.totalMembers = Math.max(statsPayload.totalMembers ?? 0, rawTotalMembers);
            }
          } else {
            // Modern or traffic-enabled payload
            const pageViews = rawPeriodViews;
            const uniqueVisitors = typeof data.metrics?.uniqueVisitors?.value === 'number'
              ? data.metrics.uniqueVisitors.value
              : typeof data.uniqueVisitors24h === 'number'
              ? data.uniqueVisitors24h
              : typeof data.uniqueVisitors === 'number'
              ? data.uniqueVisitors
              : null;

            const newReaders = typeof data.metrics?.newReaders?.value === 'number'
              ? data.metrics.newReaders.value
              : typeof data.newSignups24h === 'number'
              ? data.newSignups24h
              : typeof data.newReaders === 'number'
              ? data.newReaders
              : null;

            const totalMembers = rawTotalMembers;

            // Hourly Activity
            const rawHourly = Array.isArray(data.hourlyActivity)
              ? data.hourlyActivity
              : Array.isArray(data.hourlyTraffic)
              ? data.hourlyTraffic
              : [];
            const hourlyActivity: HourPoint[] = rawHourly.length > 0
              ? rawHourly.map((h: any, i: number) => ({
                  label: h.label || `${i}:00`,
                  count: Number(h.pageViews ?? h.count ?? 0),
                  hourIndex: h.hourIndex ?? i,
                  isPeak: Boolean(h.isPeak),
                  bucketStart: h.bucketStart,
                }))
              : [];

            // Breakdowns
            const countries: BreakdownItem[] = Array.isArray(data.breakdowns?.countries)
              ? data.breakdowns.countries
              : Array.isArray(data.topCountries)
              ? data.topCountries
              : [];

            const topPages: BreakdownItem[] = Array.isArray(data.breakdowns?.pages)
              ? data.breakdowns.pages
              : Array.isArray(data.topPages)
              ? data.topPages
              : [];

            const devices: BreakdownItem[] = Array.isArray(data.breakdowns?.devices)
              ? data.breakdowns.devices
              : Array.isArray(data.devices)
              ? data.devices
              : [];

            const referrers: BreakdownItem[] = Array.isArray(data.breakdowns?.referrers)
              ? data.breakdowns.referrers
              : Array.isArray(data.referrers)
              ? data.referrers
              : [];

            const topMembers: MemberLeaderboardItem[] = Array.isArray(data.topMembers) ? data.topMembers : [];

            // Percentage Comparisons
            const pageViewsChange = data.comparisons?.pageViewsChangePercent != null
              ? { value: data.comparisons.pageViewsChangePercent, label: periodLabel }
              : data.metrics?.periodPageViews?.comparison?.percentChange != null
              ? { value: data.metrics.periodPageViews.comparison.percentChange, label: periodLabel }
              : undefined;

            const uniqueVisitorsChange = data.comparisons?.uniqueVisitorsChangePercent != null
              ? { value: data.comparisons.uniqueVisitorsChangePercent, label: periodLabel }
              : data.metrics?.uniqueVisitors?.comparison?.percentChange != null
              ? { value: data.metrics.uniqueVisitors.comparison.percentChange, label: periodLabel }
              : undefined;

            const newReadersChange = data.comparisons?.newReadersChangePercent != null
              ? { value: data.comparisons.newReadersChangePercent, label: periodLabel }
              : data.metrics?.newReaders?.comparison?.percentChange != null
              ? { value: data.metrics.newReaders.comparison.percentChange, label: periodLabel }
              : undefined;

            const readingEngagement = {
              bookViews: Number(
                data.engagement?.bookOpens?.value ??
                data.readingEngagement?.bookViews?.count ??
                data.readingEngagement?.bookViews ??
                0
              ),
              readingProgressUpdates: Number(
                data.engagement?.readingProgressCompletions?.value ??
                data.readingEngagement?.readingProgressUpdates?.count ??
                0
              ),
              groupJoins: Number(
                data.engagement?.groupJoins?.value ??
                data.readingEngagement?.groupJoinsCount?.count ??
                data.readingEngagement?.groupJoins ??
                0
              ),
              discussions: Number(
                data.engagement?.discussions?.value ??
                data.readingEngagement?.discussionsCount?.count ??
                0
              ),
            };

            statsPayload = {
              pageViews,
              uniqueVisitors,
              newReaders,
              totalMembers,
              avgTimeOnSite: '—',
              pageViewsChange,
              uniqueVisitorsChange,
              newReadersChange,
              avgTimeChange: undefined,
              hourlyActivity,
              countries,
              topPages,
              devices,
              referrers,
              readingEngagement,
              topMembers,
              lastUpdated: data.lastUpdated || new Date().toISOString(),
              isStale: false,
            };
          }
        } catch (edgeErr: any) {
          // If we already had cached stats, preserve them and label them as stale!
          if (statsRef.current && typeof statsRef.current.pageViews === 'number') {
            throw edgeErr;
          }
          // Edge function failed with no prior cache, fall back to direct DB queries
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
