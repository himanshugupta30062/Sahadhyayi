import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export const useUserFollows = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-follows', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as string[];

      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;
      return (data || []).map((row: { following_id: string }) => row.following_id);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
};

export const useToggleUserFollow = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      if (!user?.id) throw new Error('You must be signed in to follow readers.');
      if (!targetUserId || targetUserId === user.id) {
        throw new Error('You cannot follow your own account.');
      }

      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
        return { targetUserId, isFollowing: false };
      }

      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (error && error.code !== '23505') throw error;
      return { targetUserId, isFollowing: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-follows', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-search'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
};


/**
 * Fetches the public profile cards for the current reader's outgoing follows.
 * Uses the same public-profile search RPC as discovery rather than querying
 * private profile records directly.
 */
export const useFollowedReaders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followed-readers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;

      const followingIds = (follows || []).map((row: { following_id: string }) => row.following_id);
      if (followingIds.length === 0) return [];

      const { data, error } = await supabase
        .rpc('get_public_profiles_for_search', { search_term: '' })
        .in('id', followingIds);

      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        full_name: string;
        username?: string;
        profile_photo_url?: string;
        bio?: string;
      }>;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
};
