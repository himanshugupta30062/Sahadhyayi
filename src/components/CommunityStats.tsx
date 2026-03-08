
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, Loader2, AlertTriangle, Globe, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { logger } from '@/utils/consoleOptimizer';

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
  loading: boolean;
  error: string | null;
}

const CommunityStats = () => {
  const [stats, setStats] = React.useState<CommunityStatsData>({
    registeredMembers: 0,
    totalVisitors: 0,
    last24hVisits: 0,
    topCountries: [],
    loading: true,
    error: null,
  });

  const fetchAllStats = React.useCallback(async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.functions.invoke('community-stats');
      if (error) throw error;

      setStats({
        registeredMembers: data.totalSignups ?? 0,
        totalVisitors: data.totalVisits ?? 0,
        last24hVisits: data.last24hVisits ?? 0,
        topCountries: data.topCountries ?? [],
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching community stats:', err);

      // Fallback to direct RPC calls
      try {
        const [usersRes, visitsRes] = await Promise.all([
          supabase.rpc('get_total_users_count'),
          supabase.rpc('get_website_visit_count'),
        ]);

        setStats({
          registeredMembers: Number(usersRes.data) || 0,
          totalVisitors: Number(visitsRes.data) || 0,
          last24hVisits: 0,
          topCountries: [],
          loading: false,
          error: null,
        });
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

    // Real-time updates
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

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
          📊 Sahadhyayi Community Stats
        </h2>
        <p className="text-white/80 text-sm md:text-base">Real-time community growth metrics</p>
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

      {/* Country visitors card */}
      {stats.topCountries.length > 0 && (
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              Visitors by Country
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {stats.topCountries.map(({ code, count }) => {
                const { flag, name } = getCountryInfo(code);
                const pct = Math.round((count / maxCountryCount) * 100);
                return (
                  <div key={code} className="flex items-center gap-2">
                    <span className="text-lg leading-none w-6 text-center flex-shrink-0">{flag}</span>
                    <span className="text-xs text-gray-700 w-24 truncate flex-shrink-0">{name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-10 text-right flex-shrink-0">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunityStats;
