
import React from 'react';
import { Users, Eye, Loader2, AlertTriangle, Globe, Clock, Activity, MapPin, TrendingUp, RefreshCw } from 'lucide-react';
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

interface BreakdownItem { name: string; count: number }

interface CommunityStatsData {
  registeredMembers: number;
  totalVisitors: number;
  last24hVisits: number;
  topCountries: { code: string; count: number }[];
  topCities: BreakdownItem[];
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
  const [stats, setStats] = React.useState<CommunityStatsData>({
    registeredMembers: 0, totalVisitors: 0, last24hVisits: 0,
    topCountries: [], topCities: [],
    lastUpdated: null, loading: true, error: null,
  });

  const fetchAllStats = React.useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('community-stats');
      if (error) throw error;
      setStats({
        registeredMembers: data.totalSignups ?? 0,
        totalVisitors: data.totalVisits ?? 0,
        last24hVisits: data.last24hVisits ?? 0,
        topCountries: data.topCountries ?? [],
        topCities: data.topCities ?? [],
        lastUpdated: data.lastUpdated ?? new Date().toISOString(),
        loading: false, error: null,
      });
    } catch (err) {
      console.error('Error fetching community stats:', err);
      try {
        const [usersRes, visitsRes] = await Promise.all([
          supabase.rpc('get_total_users_count'),
          supabase.rpc('get_website_visit_count'),
        ]);
        setStats(prev => ({
          ...prev,
          registeredMembers: Number(usersRes.data) || 0,
          totalVisitors: Number(visitsRes.data) || 0,
          loading: false, error: null,
        }));
      } catch {
        setStats(prev => ({ ...prev, loading: false, error: 'Unable to load community stats' }));
      }
    }
  }, []);

  React.useEffect(() => {
    fetchAllStats();
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => fetchAllStats())
      .subscribe();
    const visitsChannel = supabase
      .channel('visits-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'website_visits' }, () => fetchAllStats())
      .subscribe();
    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(visitsChannel);
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
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
          Community Pulse
        </h2>
        <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Real-time metrics from the Sahadhyayi community
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
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
        {stats.topCities.length > 0 && (
          <div className="lg:col-span-2 bg-white/[0.07] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <MapPin className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Top Cities</h3>
                <p className="text-[10px] sm:text-xs text-white/40">{stats.topCities.length} cities tracked</p>
              </div>
            </div>

            <div className="px-3 sm:px-4 pb-4 sm:pb-5 space-y-0.5">
              {stats.topCities.map((city, i) => {
                const maxCity = stats.topCities[0]?.count || 1;
                const pct = Math.round((city.count / maxCity) * 100);
                const isMedal = i < 3;
                return (
                  <div
                    key={city.name}
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
                    <span className={`text-xs sm:text-sm tabular-nums text-right min-w-[2rem] ${isMedal ? 'text-white font-bold' : 'text-white/60 font-semibold'}`}>
                      {city.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
