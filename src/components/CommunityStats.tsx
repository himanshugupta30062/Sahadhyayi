
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [stats, setStats] = useState<CommunityStatsData>({
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

  const getCommunityUserCount = async () => {
    try {
      setStats(prev => ({
        ...prev,
        loading: { ...prev.loading, members: true },
        errors: { ...prev.errors, members: null },
      }));

      // Get count of registered users from profiles table
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        registeredMembers: count || 0,
        loading: { ...prev.loading, members: false },
      }));
    } catch (error) {
      console.error('Error fetching user count:', error);
      setStats(prev => ({
        ...prev,
        loading: { ...prev.loading, members: false },
        errors: { ...prev.errors, members: 'Unable to load member count' },
      }));
    }
  };

  const getTotalPageViews = async () => {
    try {
      setStats(prev => ({
        ...prev,
        loading: { ...prev.loading, visitors: true },
        errors: { ...prev.errors, visitors: null },
      }));

      // Get count from website_visits table
      const { count, error } = await supabase
        .from('website_visits')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        totalVisitors: count || 0,
        loading: { ...prev.loading, visitors: false },
      }));
    } catch (error) {
      console.error('Error fetching page views:', error);
      setStats(prev => ({
        ...prev,
        loading: { ...prev.loading, visitors: false },
        errors: { ...prev.errors, visitors: 'Unable to load visit data' },
      }));
    }
  };

  useEffect(() => {
    getCommunityUserCount();
    getTotalPageViews();

    // Set up real-time updates for user registrations
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'profiles' }, 
        () => {
          getCommunityUserCount();
        }
      )
      .subscribe();

    // Set up real-time updates for page visits
    const visitsChannel = supabase
      .channel('visits-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'website_visits' }, 
        () => {
          getTotalPageViews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(visitsChannel);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          📊 Sahadhyayi Community Stats
        </h2>
        <p className="text-gray-600">Real-time community growth metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registered Members Card */}
        <Card className="bg-white shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              📚 Registered Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.loading.members ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading members...</span>
              </div>
            ) : stats.errors.members ? (
              <p className="text-red-600 font-medium">{stats.errors.members}</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.registeredMembers.toLocaleString()}
                </div>
                <p className="text-gray-700">
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
        <Card className="bg-white shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              👀 Visitors to Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.loading.visitors ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Tracking visits...</span>
              </div>
            ) : stats.errors.visitors ? (
              <p className="text-red-600 font-medium">{stats.errors.visitors}</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.totalVisitors.toLocaleString()}
                </div>
                <p className="text-gray-700">
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
