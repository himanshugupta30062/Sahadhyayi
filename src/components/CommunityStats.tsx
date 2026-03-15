
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, Loader2, AlertTriangle, Globe, Clock, Activity, Monitor, Smartphone, Tablet, MapPin, Chrome } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';

/** Maps ISO 3166-1 alpha-2 country codes to flag emoji + name */
const COUNTRY_MAP: Record<string, { flag: string; name: string }> = {
  IN: { flag: '🇮🇳', name: 'India' },
  US: { flag: '🇺🇸', name: 'United States' },
  FR: { flag: '🇫🇷', name: 'France' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' },
  DE: { flag: '🇩🇪', name: 'Germany' },
  SG: { flag: '🇸🇬', name: 'Singapore' },
  ES: { flag: '🇪🇸', name: 'Spain' },
  NL: { flag: '🇳🇱', name: 'Netherlands' },
  ID: { flag: '🇮🇩', name: 'Indonesia' },
  BR: { flag: '🇧🇷', name: 'Brazil' },
  CN: { flag: '🇨🇳', name: 'China' },
  SE: { flag: '🇸🇪', name: 'Sweden' },
  VN: { flag: '🇻🇳', name: 'Vietnam' },
  NG: { flag: '🇳🇬', name: 'Nigeria' },
  UA: { flag: '🇺🇦', name: 'Ukraine' },
  AU: { flag: '🇦🇺', name: 'Australia' },
  PL: { flag: '🇵🇱', name: 'Poland' },
  AR: { flag: '🇦🇷', name: 'Argentina' },
  LK: { flag: '🇱🇰', name: 'Sri Lanka' },
  JP: { flag: '🇯🇵', name: 'Japan' },
  KR: { flag: '🇰🇷', name: 'South Korea' },
  RU: { flag: '🇷🇺', name: 'Russia' },
  MX: { flag: '🇲🇽', name: 'Mexico' },
  IT: { flag: '🇮🇹', name: 'Italy' },
  AE: { flag: '🇦🇪', name: 'UAE' },
  SA: { flag: '🇸🇦', name: 'Saudi Arabia' },
  PK: { flag: '🇵🇰', name: 'Pakistan' },
  BD: { flag: '🇧🇩', name: 'Bangladesh' },
  NP: { flag: '🇳🇵', name: 'Nepal' },
  MY: { flag: '🇲🇾', name: 'Malaysia' },
  PH: { flag: '🇵🇭', name: 'Philippines' },
  TH: { flag: '🇹🇭', name: 'Thailand' },
  ZA: { flag: '🇿🇦', name: 'South Africa' },
  KE: { flag: '🇰🇪', name: 'Kenya' },
};

function getCountryInfo(code: string) {
  return COUNTRY_MAP[code] || { flag: '🏳️', name: code };
}

interface BreakdownItem {
  name: string;
  count: number;
}

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


const CommunityStats = () => {
  const [stats, setStats] = React.useState<CommunityStatsData>({
    registeredMembers: 0,
    totalVisitors: 0,
    last24hVisits: 0,
    topCountries: [],
    topCities: [],
    lastUpdated: null,
    loading: true,
    error: null,
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
        loading: false,
        error: null,
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
          loading: false,
          error: null,
        }));
      } catch {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Unable to load community stats',
        }));
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
      <div className="w-full max-w-6xl mx-auto p-4 flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-white/70" />
        <span className="ml-2 text-white/70 text-sm">Loading community stats...</span>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-red-300 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{stats.error}</span>
        </div>
        <button onClick={fetchAllStats} className="text-sm text-blue-300 hover:text-blue-100 underline">
          Try again
        </button>
      </div>
    );
  }

  const maxCountryCount = stats.topCountries[0]?.count || 1;
  const totalCountryVisits = stats.topCountries.reduce((sum, c) => sum + c.count, 0);
  const totalDevices = stats.deviceTypes.reduce((s, d) => s + d.count, 0);
  const totalBrowsers = stats.topBrowsers.reduce((s, b) => s + b.count, 0);
  const totalOS = stats.topOS.reduce((s, o) => s + o.count, 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="text-center mb-5 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
          📊 Sahadhyayi Community Stats
        </h2>
        <div className="flex items-center justify-center gap-2 text-white/80 text-xs sm:text-sm md:text-base">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live · Real-time community metrics
        </div>
      </div>

      {/* Top stat cards - stack on very small screens */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="p-1 sm:p-1.5 bg-orange-100 rounded-lg">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground/80 truncate">Members</span>
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-orange-600">
              {stats.registeredMembers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5 hidden sm:block">Total sign-ups</p>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="p-1 sm:p-1.5 bg-amber-100 rounded-lg">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground/80 truncate">Visitors</span>
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-600">
              {stats.totalVisitors.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5 hidden sm:block">All-time views</p>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="p-1 sm:p-1.5 bg-green-100 rounded-lg">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground/80 truncate">24h</span>
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-green-600">
              {stats.last24hVisits.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5 hidden sm:block">Recent visitors</p>
          </CardContent>
        </Card>
      </div>

      {/* Device / Browser / OS breakdown - vertical stack on mobile */}
      {(stats.deviceTypes.length > 0 || stats.topBrowsers.length > 0 || stats.topOS.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
          {/* Device Types */}
          {stats.deviceTypes.length > 0 && (
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg">
                    <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground/80">Device Types</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <MiniDonut
                    items={stats.deviceTypes}
                    colors={stats.deviceTypes.map(d => DEVICE_COLORS[d.name] || '#94a3b8')}
                    size={72}
                  />
                  <div className="space-y-1.5 sm:space-y-2 flex-1">
                    {stats.deviceTypes.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 sm:gap-2">
                        <span style={{ color: DEVICE_COLORS[d.name] || '#94a3b8' }} className="flex-shrink-0">
                          {DEVICE_ICONS[d.name] || <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </span>
                        <span className="text-xs sm:text-sm text-foreground/80 flex-1">{d.name}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                          {totalDevices ? ((d.count / totalDevices) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Browsers */}
          {stats.topBrowsers.length > 0 && (
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-1.5 bg-purple-100 rounded-lg">
                    <Chrome className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground/80">Top Browsers</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <MiniDonut items={stats.topBrowsers} colors={BROWSER_COLORS} size={72} />
                  <LegendList items={stats.topBrowsers} colors={BROWSER_COLORS} total={totalBrowsers} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operating Systems */}
          {stats.topOS.length > 0 && (
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20 sm:col-span-2 md:col-span-1">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-1.5 bg-teal-100 rounded-lg">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground/80">Operating Systems</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <MiniDonut items={stats.topOS} colors={OS_COLORS} size={72} />
                  <LegendList items={stats.topOS} colors={OS_COLORS} total={totalOS} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Country visitors + Top Cities row */}
      <div className={`grid grid-cols-1 ${stats.topCities.length > 0 ? 'lg:grid-cols-3' : ''} gap-2 sm:gap-4`}>
        {/* Country visitors */}
        {stats.topCountries.length > 0 && (
          <Card className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20 overflow-hidden ${stats.topCities.length > 0 ? 'lg:col-span-2' : ''}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground/80">Visitors by Country</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3 hidden sm:inline" />
                    {stats.topCountries.length} countries
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2.5">
                {stats.topCountries.map(({ code, count }, index) => {
                  const { flag, name } = getCountryInfo(code);
                  const pct = Math.round((count / maxCountryCount) * 100);
                  const sharePct = ((count / totalCountryVisits) * 100).toFixed(1);

                  return (
                    <div
                      key={code}
                      className="group flex items-center gap-1.5 sm:gap-3 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground w-4 sm:w-5 text-right tabular-nums">
                        {index + 1}
                      </span>
                      <span className="text-base sm:text-xl leading-none w-5 sm:w-7 text-center flex-shrink-0">{flag}</span>
                      <span className="text-xs sm:text-sm text-foreground font-medium w-16 sm:w-28 truncate flex-shrink-0">
                        {name}
                      </span>
                      <div className="flex-1 h-2 sm:h-3 bg-muted rounded-full overflow-hidden relative hidden xs:block">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.max(pct, 3)}%`,
                            background: index === 0
                              ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                              : index === 1
                              ? 'linear-gradient(90deg, #3b82f6, #6366f1)'
                              : index === 2
                              ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                              : 'linear-gradient(90deg, #94a3b8, #64748b)',
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
                        <span className="text-xs sm:text-sm font-bold text-foreground w-8 sm:w-12 text-right tabular-nums">
                          {count.toLocaleString()}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground w-8 sm:w-10 text-right tabular-nums hidden sm:inline">
                          {sharePct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Cities */}
        {stats.topCities.length > 0 && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20 overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="p-1 sm:p-1.5 bg-rose-100 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground/80">Top Cities</span>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                {stats.topCities.map((city, i) => {
                  const maxCity = stats.topCities[0]?.count || 1;
                  const pct = Math.round((city.count / maxCity) * 100);
                  return (
                    <div key={city.name} className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-[10px] sm:text-xs text-muted-foreground w-3 sm:w-4 text-right tabular-nums">{i + 1}</span>
                      <span className="text-xs sm:text-sm text-foreground font-medium flex-1 truncate">{city.name}</span>
                      <div className="w-12 sm:w-20 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(pct, 5)}%`,
                            background: 'linear-gradient(90deg, #f43f5e, #fb923c)',
                          }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-foreground/80 w-8 sm:w-10 text-right tabular-nums">
                        {city.count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer timestamp */}
      {stats.lastUpdated && (
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-white/50 px-2 gap-1">
          <span>Updates automatically when new visitors arrive</span>
          <span>Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

export default CommunityStats;
