
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';

interface CommunityStatsData {
  registeredMembers: number;
  totalVisitors: number;
  loading: {
    members: boolean;
    visitors: boolean;
  };
  errors: {
    members: string | null;
    visitors: string | null;
  };
}

const CommunityStats = () => {
  const [stats, setStats] = React.useState<CommunityStatsData>({
    registeredMembers: 0,
    totalVisitors: 0,
    loading: {
      members: true,
      visitors: true,
    },
    errors: {
      members: null,
      visitors: null,
    },
  });

  const fetchCommunityStats = async () => {
    try {
      setStats(prev => ({
        ...prev,
        loading: { members: true, visitors: true },
        errors: { members: null, visitors: null },
      }));

      const { data, error } = await supabase.functions.invoke('community-stats');
      if (error) {
        console.error('Error fetching community stats:', error);
        throw error;
      }

      setStats(prev => ({
        ...prev,
        registeredMembers: data?.totalSignups || 0,
        totalVisitors: data?.totalVisits || 0,
        loading: { members: false, visitors: false },
      }));
    } catch (error) {
      console.error('Error fetching community stats:', error);
      setStats(prev => ({
        ...prev,
        registeredMembers: 0,
        totalVisitors: 0,
        loading: { members: false, visitors: false },
        errors: {
          members: 'Unable to load member count',
          visitors: 'Unable to load visit data',
        },
      }));
    }
  };

  React.useEffect(() => {
    fetchCommunityStats();

    // Set up real-time updates for user registrations and page visits
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => {
          fetchCommunityStats();
        }
      )
      .subscribe();

    const visitsChannel = supabase
      .channel('visits-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'website_visits' },
        () => {
          fetchCommunityStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(visitsChannel);
    };
  }, []);

  const handleRetry = () => {
    fetchCommunityStats();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
          📊 Sahadhyayi Community Stats
        </h2>
        <p className="text-white/90 text-sm md:text-base">Real-time community growth metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Registered Members Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-semibold text-gray-800">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <span className="text-sm md:text-base">📚 Registered Members</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.loading.members ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading members...</span>
              </div>
            ) : stats.errors.members ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="font-medium text-sm">{stats.errors.members}</p>
                </div>
                <button 
                  onClick={handleRetry}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div>
                <div className="text-xl md:text-2xl font-bold text-orange-600 mb-1">
                  {stats.registeredMembers.toLocaleString()}
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  {stats.registeredMembers === 1 
                    ? '1 person has joined Sahadhyayi' 
                    : `${stats.registeredMembers.toLocaleString()} people have joined Sahadhyayi`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Site Visitors Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/20 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-semibold text-gray-800">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Eye className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
              </div>
              <span className="text-sm md:text-base">👀 Visitors to Site</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.loading.visitors ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Tracking visits...</span>
              </div>
            ) : stats.errors.visitors ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="font-medium text-sm">{stats.errors.visitors}</p>
                </div>
                <button 
                  onClick={handleRetry}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div>
                <div className="text-xl md:text-2xl font-bold text-amber-600 mb-1">
                  {stats.totalVisitors.toLocaleString()}
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  {stats.totalVisitors === 1 
                    ? '1 person has visited this site' 
                    : `${stats.totalVisitors.toLocaleString()} people have visited this site`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityStats;
