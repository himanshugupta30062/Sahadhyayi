
import React from 'react';
import { Users, Eye, Loader2, AlertTriangle, Globe, Clock, Activity, MapPin, TrendingUp, RefreshCw, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';

const COUNTRY_MAP: Record<string, { flag: string; name: string }> = {
  IN: { flag: '🇮🇳', name: 'India' }, US: { flag: '🇺🇸', name: 'United States' },
  FR: { flag: '🇫🇷', name: 'France' }, CA: { flag: '🇨🇦', name: 'Canada' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' }, DE: { flag: '🇩🇪', name: 'Germany' },
  SG: { flag: '🇸🇬', name: 'Singapore' }, ES: { flag: '🇪🇸', name: 'Spain' },
  NL: { flag: '🇳🇱', name: 'Netherlands' }, ID: { flag: '🇮🇩', name: 'Indonesia' },
  BR: { flag: '🇧🇷', name: 'Brazil' }, CN: { flag: '🇨🇳', name: 'China' },
  SE: { flag: '🇸🇪', name: 'Sweden' }, VN: { flag: '🇻🇳', name: 'Vietnam' },
  NG: { flag: '🇳🇬', name: 'Nigeria' }, UA: { flag: '🇺🇦', name: 'Ukraine' },
  AU: { flag: '🇦🇺', name: 'Australia' }, PL: { flag: '🇵🇱', name: 'Poland' },
  AR: { flag: '🇦🇷', name: 'Argentina' }, LK: { flag: '🇱🇰', name: 'Sri Lanka' },
  JP: { flag: '🇯🇵', name: 'Japan' }, KR: { flag: '🇰🇷', name: 'South Korea' },
  RU: { flag: '🇷🇺', name: 'Russia' }, MX: { flag: '🇲🇽', name: 'Mexico' },
  IT: { flag: '🇮🇹', name: 'Italy' }, AE: { flag: '🇦🇪', name: 'UAE' },
  SA: { flag: '🇸🇦', name: 'Saudi Arabia' }, PK: { flag: '🇵🇰', name: 'Pakistan' },
  BD: { flag: '🇧🇩', name: 'Bangladesh' }, NP: { flag: '🇳🇵', name: 'Nepal' },
  MY: { flag: '🇲🇾', name: 'Malaysia' }, PH: { flag: '🇵🇭', name: 'Philippines' },
  TH: { flag: '🇹🇭', name: 'Thailand' }, ZA: { flag: '🇿🇦', name: 'South Africa' },
  KE: { flag: '🇰🇪', name: 'Kenya' },
};

function getCountryInfo(code: string) {
  return COUNTRY_MAP[code] || { flag: '🏳️', name: code };
}

interface BreakdownItem { 
  name: string; 
  count: number; 
  count24h?: number; 
}

interface CommunityStatsData {
  registeredMembers: number;
  totalVisitors: number;
  last24hVisits: number;
  topCountries: { code: string; count: number }[];
  topCities: BreakdownItem[];
  topCities24h: BreakdownItem[];
  mostVisitedCity24h: BreakdownItem | null;
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
}

const MEDAL = ['🥇', '🥈', '🥉'];

const StatCard = ({ icon: Icon, label, value, subtitle, gradient }: {
  icon: React.ElementType; label: string; value: number; subtitle: string; gradient: string;
}) => (
  <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6 ${gradient} text-white shadow-lg group hover:scale-[1.02] transition-transform duration-300`}>
    <div className="absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
    <div className="absolute bottom-0 left-0 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="p-1.5 sm:p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/80">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight tabular-nums">
        {value.toLocaleString()}
      </div>
      <p className="text-white/60 text-[10px] sm:text-xs mt-1 font-medium">{subtitle}</p>
    </div>
  </div>
);

const CommunityStats = () => {
  const [cityTimeframe, setCityTimeframe] = React.useState<'all' | '24h'>('all');
  const [stats, setStats] = React.useState<CommunityStatsData>(() => {
    let cached: any = null;
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('community-stats');
        cached = raw ? JSON.parse(raw) : null;
      }
    } catch {
      cached = null;
    }
    return {
      registeredMembers: cached?.totalSignups || 0,
      totalVisitors: cached?.totalVisits || 0,
      last24hVisits: cached?.last24hVisits || 0,
      topCountries: cached?.topCountries || [],
      topCities: [],
      topCities24h: [],
      mostVisitedCity24h: null,
      lastUpdated: cached?.lastUpdated || null,
      loading: !cached,
      error: null,
    };
  });

  const fetchAllStats = React.useCallback(async () => {
    let edgeSignups: number | null = null;
    let edgeVisits: number | null = null;
    let edge24h: number | null = null;
    let topCountries: { code: string; count: number }[] = [];
    let topCities: BreakdownItem[] = [];
    let topCities24h: BreakdownItem[] = [];
    let mostVisitedCity24h: BreakdownItem | null = null;

    try {
      const { data, error } = await supabase.functions.invoke('community-stats');
      if (!error && data) {
        edgeSignups = typeof data.totalSignups === 'number' ? data.totalSignups : null;
        edgeVisits = typeof data.totalVisits === 'number' ? data.totalVisits : null;
        edge24h = typeof data.last24hVisits === 'number' ? data.last24hVisits : null;
        topCountries = data.topCountries ?? [];
        topCities = data.topCities ?? [];
        topCities24h = data.topCities24h ?? [];
        mostVisitedCity24h = data.mostVisitedCity24h ?? null;
      }
    } catch {
      // Fallback to direct queries below
    }

    try {
      const [usersRpc, visitsRpc, profilesCountRes] = await Promise.all([
        supabase.rpc('get_total_users_count').catch(() => ({ data: null })),
        supabase.rpc('get_website_visit_count').catch(() => ({ data: null })),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).catch(() => ({ count: null })),
      ]);

      const rpcUsers = Number(usersRpc?.data) || 0;
      const directProfiles = Number(profilesCountRes?.count) || 0;
      const directUsers = Math.max(rpcUsers, directProfiles);

      const rpcVisits = Number(visitsRpc?.data) || 0;

      const registeredMembers = edgeSignups !== null 
        ? edgeSignups 
        : (directUsers > 0 ? directUsers : 0);
      const totalVisitors = edgeVisits !== null 
        ? edgeVisits 
        : (rpcVisits > 0 ? rpcVisits : 0);

      // Fallback: If edge function did not return topCountries, query DB RPC
      if (topCountries.length === 0) {
        try {
          const { data: countryData } = await supabase.rpc('get_top_visitor_countries', { limit_count: 15 });
          if (countryData && countryData.length > 0) {
            topCountries = countryData.map((row: any) => ({
              code: row.country_code,
              count: Number(row.visit_count),
            }));
          }
        } catch {
          // ignore
        }
      }

      // Query 24h city visits for fallback and cross-referencing
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const cityMap24h: Record<string, number> = {};

      try {
        const { data: rows24h } = await supabase
          .from('website_visits')
          .select('city, region')
          .gte('visited_at', twentyFourHoursAgo)
          .not('city', 'is', null)
          .neq('city', 'Unknown')
          .limit(2000);

        if (rows24h && rows24h.length > 0) {
          for (const r of rows24h) {
            if (r.city && r.city !== 'Unknown') {
              const label = r.region ? `${r.city}, ${r.region}` : r.city;
              cityMap24h[label] = (cityMap24h[label] || 0) + 1;
            }
          }
        }
      } catch {
        // ignore
      }

      if (topCities24h.length === 0) {
        topCities24h = Object.entries(cityMap24h)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count, count24h: count }));
      }

      if (!mostVisitedCity24h && topCities24h.length > 0) {
        mostVisitedCity24h = topCities24h[0];
      }

      // Fallback: If edge function did not return topCities, query website_visits table
      if (topCities.length === 0) {
        try {
          const { data: cityRows } = await supabase
            .from('website_visits')
            .select('city, region')
            .not('city', 'is', null)
            .neq('city', 'Unknown')
            .order('visited_at', { ascending: false })
            .limit(1000);

          if (cityRows && cityRows.length > 0) {
            const cityMap: Record<string, number> = {};
            for (const row of cityRows) {
              if (row.city && row.city !== 'Unknown') {
                const label = row.region ? `${row.city}, ${row.region}` : row.city;
                cityMap[label] = (cityMap[label] || 0) + 1;
              }
            }
            topCities = Object.entries(cityMap)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([name, count]) => ({ 
                name, 
                count, 
                count24h: cityMap24h[name] || 0 
              }));
          }
        } catch {
          // ignore
        }
      } else {
        // Ensure every topCity item has its count24h populated
        topCities = topCities.map((c) => ({
          ...c,
          count24h: c.count24h !== undefined ? c.count24h : (cityMap24h[c.name] || 0),
        }));
      }

      setStats(prev => ({
        ...prev,
        registeredMembers: registeredMembers || prev.registeredMembers || 0,
        totalVisitors: totalVisitors || prev.totalVisitors || 0,
        last24hVisits: edge24h ?? prev.last24hVisits,
        topCountries: topCountries.length > 0 ? topCountries : prev.topCountries,
        topCities: topCities.length > 0 ? topCities : prev.topCities,
        topCities24h: topCities24h.length > 0 ? topCities24h : prev.topCities24h,
        mostVisitedCity24h: mostVisitedCity24h ?? prev.mostVisitedCity24h,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error('Error fetching community stats:', err);
      if (edgeSignups !== null) {
        setStats(prev => ({
          ...prev,
          registeredMembers: edgeSignups || 0,
          totalVisitors: edgeVisits || 0,
          last24hVisits: edge24h || 0,
          topCountries,
          topCities,
          topCities24h,
          mostVisitedCity24h,
          lastUpdated: new Date().toISOString(),
          loading: false,
          error: null,
        }));
      } else {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: (prev.registeredMembers > 0 || prev.totalVisitors > 0) ? null : 'Community metrics currently syncing...',
        }));
      }
    }
  }, []);

  React.useEffect(() => {
    fetchAllStats();

    // Realtime channel for live updates when new users sign up or visit
    const profilesChannel = supabase
      .channel('community-profiles-pulse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchAllStats();
      })
      .subscribe();

    const visitsChannel = supabase
      .channel('community-visits-pulse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_visits' }, () => {
        fetchAllStats();
      })
      .subscribe();

    // Listen to in-app signup/signin dispatch events
    const handleLocalUpdate = () => {
      fetchAllStats();
    };
    window.addEventListener('communityStatsUpdate', handleLocalUpdate);

    // Cross-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sahadhyayi_stats_sync') {
        fetchAllStats();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Fallback heartbeat every 30s
    const interval = setInterval(fetchAllStats, 30_000);

    return () => {
      void supabase.removeChannel(profilesChannel);
      void supabase.removeChannel(visitsChannel);
      window.removeEventListener('communityStatsUpdate', handleLocalUpdate);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [fetchAllStats]);

  if (stats.loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-white/60 animate-spin" />
          </div>
          <span className="text-white/60 text-sm font-medium">Loading stats...</span>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-white/70 text-sm mb-4">{stats.error}</p>
          <button
            onClick={fetchAllStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const maxCountryCount = stats.topCountries[0]?.count || 1;
  const totalCountryVisits = stats.topCountries.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-3 sm:mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-white/70 text-[11px] sm:text-xs font-medium tracking-wide uppercase">Live Dashboard</span>
          <button
            onClick={() => fetchAllStats()}
            title="Refresh statistics"
            className="p-1 -mr-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
          Community Pulse
        </h2>
        <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Real-time metrics from the Sahadhyayi community
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <StatCard icon={Users} label="Members" value={stats.registeredMembers} subtitle="Total sign-ups" gradient="bg-gradient-to-br from-orange-500 to-amber-600" />
        <StatCard icon={Eye} label="Visitors" value={stats.totalVisitors} subtitle="All-time views" gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard icon={TrendingUp} label="Last 24h" value={stats.last24hVisits} subtitle="Recent activity" gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
      </div>

      {/* Country + Cities Grid */}
      <div className={`grid grid-cols-1 ${stats.topCities.length > 0 ? 'lg:grid-cols-5' : ''} gap-3 sm:gap-4`}>
        {/* Countries */}
        {stats.topCountries.length > 0 && (
          <div className={`${stats.topCities.length > 0 ? 'lg:col-span-3' : ''} bg-white/[0.07] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden`}>
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Visitors by Country</h3>
                  <p className="text-[10px] sm:text-xs text-white/40">{stats.topCountries.length} countries tracked</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              </div>
            </div>

            <div className="px-3 sm:px-4 pb-4 sm:pb-5 space-y-0.5">
              {stats.topCountries.map(({ code, count }, index) => {
                const { flag, name } = getCountryInfo(code);
                const pct = Math.round((count / maxCountryCount) * 100);
                const sharePct = ((count / totalCountryVisits) * 100).toFixed(1);
                const isMedal = index < 3;

                return (
                  <div
                    key={code}
                    className={`group flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 ${
                      isMedal ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="text-sm sm:text-base w-5 sm:w-6 text-center flex-shrink-0">
                      {isMedal ? MEDAL[index] : (
                        <span className="text-[10px] sm:text-xs text-white/30 font-mono">{index + 1}</span>
                      )}
                    </span>
                    <span className="text-lg sm:text-xl leading-none flex-shrink-0">{flag}</span>
                    <span className={`text-xs sm:text-sm flex-1 truncate ${isMedal ? 'text-white font-semibold' : 'text-white/70 font-medium'}`}>
                      {name}
                    </span>
                    <div className="hidden sm:block flex-1 max-w-[120px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          background: isMedal
                            ? 'linear-gradient(90deg, hsl(38, 92%, 50%), hsl(28, 80%, 52%))'
                            : 'linear-gradient(90deg, hsl(215, 60%, 50%), hsl(225, 50%, 45%))',
                        }}
                      />
                    </div>
                    <span className={`text-xs sm:text-sm tabular-nums text-right min-w-[2rem] sm:min-w-[3rem] ${isMedal ? 'text-white font-bold' : 'text-white/60 font-semibold'}`}>
                      {count.toLocaleString()}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/30 w-8 text-right tabular-nums hidden md:inline font-mono">
                      {sharePct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Cities */}
        {(stats.topCities.length > 0 || stats.topCities24h.length > 0) && (
          <div className="lg:col-span-2 bg-white/[0.07] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <MapPin className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Top Cities</h3>
                  <p className="text-[10px] sm:text-xs text-white/40">
                    {cityTimeframe === '24h' 
                      ? `${stats.topCities24h.length} cities active in last 24h` 
                      : `${stats.topCities.length} cities tracked`}
                  </p>
                </div>
              </div>

              {/* Timeframe switch */}
              <div className="flex items-center bg-white/10 p-0.5 rounded-lg text-[10px] font-medium">
                <button
                  type="button"
                  onClick={() => setCityTimeframe('all')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    cityTimeframe === 'all'
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  All-Time
                </button>
                <button
                  type="button"
                  onClick={() => setCityTimeframe('24h')}
                  className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    cityTimeframe === '24h'
                      ? 'bg-rose-500/30 text-rose-200 font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Flame className="w-2.5 h-2.5 text-rose-400" />
                  Last 24h
                </button>
              </div>
            </div>

            {/* Featured Highlight: Most visited city in last 24 hours */}
            {stats.mostVisitedCity24h && stats.mostVisitedCity24h.count > 0 && (
              <div className="mx-3 sm:mx-4 mb-3 p-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 via-amber-500/10 to-transparent border border-rose-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-rose-500/30 text-rose-300 shrink-0">
                    <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-rose-200/80 uppercase font-bold tracking-wider">
                      Most Active City (Last 24h)
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {stats.mostVisitedCity24h.name}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30 tabular-nums">
                    +{stats.mostVisitedCity24h.count.toLocaleString()} visits
                  </span>
                </div>
              </div>
            )}

            {/* Cities list */}
            <div className="px-3 sm:px-4 pb-4 sm:pb-5 space-y-0.5 flex-1">
              {(() => {
                const currentCities = cityTimeframe === '24h' ? stats.topCities24h : stats.topCities;
                if (currentCities.length === 0) {
                  return (
                    <div className="py-8 text-center text-white/40 text-xs">
                      {cityTimeframe === '24h'
                        ? 'No city visits recorded in the last 24 hours yet.'
                        : 'No city records available.'}
                    </div>
                  );
                }

                const maxCity = currentCities[0]?.count || 1;

                return currentCities.map((city, i) => {
                  const pct = Math.round((city.count / maxCity) * 100);
                  const isMedal = i < 3;
                  return (
                    <div
                      key={`${city.name}-${cityTimeframe}`}
                      className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 ${
                        isMedal ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="text-sm w-5 text-center flex-shrink-0">
                        {isMedal ? MEDAL[i] : (
                          <span className="text-[10px] sm:text-xs text-white/30 font-mono">{i + 1}</span>
                        )}
                      </span>
                      <span className={`text-xs sm:text-sm flex-1 truncate ${isMedal ? 'text-white font-semibold' : 'text-white/70 font-medium'}`}>
                        {city.name}
                      </span>
                      <div className="w-10 sm:w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(pct, 6)}%`,
                            background: isMedal
                              ? 'linear-gradient(90deg, hsl(350, 80%, 55%), hsl(25, 90%, 55%))'
                              : 'linear-gradient(90deg, hsl(350, 50%, 45%), hsl(350, 40%, 40%))',
                          }}
                        />
                      </div>
                      <div className="text-right min-w-[3.5rem]">
                        <div className={`text-xs sm:text-sm tabular-nums ${isMedal ? 'text-white font-bold' : 'text-white/60 font-semibold'}`}>
                          {city.count.toLocaleString()}
                        </div>
                        {cityTimeframe === 'all' && city.count24h !== undefined && city.count24h > 0 && (
                          <div className="text-[9px] text-emerald-400/90 font-medium tabular-nums">
                            +{city.count24h.toLocaleString()} in 24h
                          </div>
                        )}
                        {cityTimeframe === '24h' && (
                          <div className="text-[9px] text-rose-300/80 font-medium tabular-nums">
                            last 24h
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Empty State when no geo data is available yet */}
      {stats.topCountries.length === 0 && stats.topCities.length === 0 && (
        <div className="bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center text-white/50 text-xs">
          <Globe className="w-6 h-6 mx-auto mb-2 text-white/30" />
          <p className="font-medium text-white/70">Geographic Visitor Pulse</p>
          <p className="text-[11px] text-white/40 mt-0.5">
            Country and city analytics will populate automatically as global readers explore the library.
          </p>
        </div>
      )}

      {/* Footer */}
      {stats.lastUpdated && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-white/30 px-1 gap-1 pb-2">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Auto-refreshes on new activity
          </span>
          <span className="font-mono">
            {new Date(stats.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default CommunityStats;
