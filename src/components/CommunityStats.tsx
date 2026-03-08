
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, Loader2, AlertTriangle, Globe, Clock, Activity } from 'lucide-react';
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

interface CommunityStatsData {
  registeredMembers: number;
  totalVisitors: number;
  last24hVisits: number;
  topCountries: { code: string; count: number }[];
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

    // Real-time: refetch on new visits or signups
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
      <div className="w-full max-w-5xl mx-auto p-4 flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-white/70" />
        <span className="ml-2 text-white/70 text-sm">Loading community stats...</span>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 text-center">
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

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
          📊 Sahadhyayi Community Stats
        </h2>
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm md:text-base">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live · Real-time community metrics
        </div>
      </div>

      {/* Top row: 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Registered Members */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              Registered Members
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">
              {stats.registeredMembers.toLocaleString()}
            </div>
            <p className="text-gray-500 text-xs mt-1">Total sign-ups</p>
          </CardContent>
        </Card>

        {/* Total Visitors */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Eye className="w-4 h-4 text-amber-600" />
              </div>
              Total Visitors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl md:text-3xl font-bold text-amber-600">
              {stats.totalVisitors.toLocaleString()}
            </div>
            <p className="text-gray-500 text-xs mt-1">All-time page views</p>
          </CardContent>
        </Card>

        {/* Last 24h */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              Last 24 Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {stats.last24hVisits.toLocaleString()}
            </div>
            <p className="text-gray-500 text-xs mt-1">Recent visitors</p>
          </CardContent>
        </Card>
      </div>

      {/* Country visitors card — improved */}
      {stats.topCountries.length > 0 && (
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                Visitors by Country
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {stats.topCountries.length} countries
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-2.5">
              {stats.topCountries.map(({ code, count }, index) => {
                const { flag, name } = getCountryInfo(code);
                const pct = Math.round((count / maxCountryCount) * 100);
                const sharePct = ((count / totalCountryVisits) * 100).toFixed(1);
                
                return (
                  <div
                    key={code}
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Rank */}
                    <span className="text-xs font-medium text-gray-400 w-5 text-right tabular-nums">
                      {index + 1}
                    </span>
                    
                    {/* Flag */}
                    <span className="text-xl leading-none w-7 text-center flex-shrink-0">{flag}</span>
                    
                    {/* Country name */}
                    <span className="text-sm text-gray-800 font-medium w-28 truncate flex-shrink-0">
                      {name}
                    </span>
                    
                    {/* Progress bar */}
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
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
                    
                    {/* Count & percentage */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-800 w-12 text-right tabular-nums">
                        {count.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 w-10 text-right tabular-nums">
                        {sharePct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
            {stats.lastUpdated && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  Updates automatically when new visitors arrive
                </span>
                <span className="text-[10px] text-gray-400">
                  Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunityStats;
