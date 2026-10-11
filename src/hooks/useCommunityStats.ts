import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export interface CommunityActivityDay {
  day: string;
  count: number;
}

export interface CommunityStats {
  registeredReaders: number;
  eligibleBooks: number;
  activeRooms: number;
  communityActivity: number;
  activityTrend: CommunityActivityDay[];
  lastUpdated: string;
}

export const useCommunityStats = (autoFetch = true) => {
  const queryClient = useQueryClient();
  const query = useQuery<CommunityStats>({
    queryKey: ['community-pulse'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-stats');
      if (error) throw error;
      if (!data || typeof data.registeredReaders !== 'number') {
        throw new Error('Community pulse returned incomplete data.');
      }
      return data as CommunityStats;
    },
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const fetchStats = async () => {
    const result = await query.refetch();
    return result.data ?? null;
  };

  const joinCommunity = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return false;
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
    if (!profile) {
      const { error } = await supabase.from('profiles').insert({ id: session.user.id });
      if (error) return false;
    }
    await queryClient.invalidateQueries({ queryKey: ['community-pulse'] });
    return true;
  };

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    fetchStats,
    joinCommunity,
  };
};
