
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester_profile?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    username?: string;
  };
  addressee_profile?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    username?: string;
  };
}

export interface Friend {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    username?: string;
    bio?: string;
    location_lat?: number | null;
    location_lng?: number | null;
    location_sharing?: boolean;
    last_seen?: string | null;
  };
}

type SocialProfile = NonNullable<Friend['friend_profile']>;

const fetchSocialProfiles = async (profileIds: string[]): Promise<SocialProfile[]> => {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const { data, error } = await supabase.rpc('get_profiles_for_social_context', {
    profile_ids: uniqueIds,
  });
  if (error) throw error;
  return (data || []) as SocialProfile[];
};

export const useFriendRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      const requests = data || [];
      const profiles = await fetchSocialProfiles(
        requests.flatMap((request) => [request.requester_id, request.addressee_id]),
      );
      const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

      return requests.map((request) => ({
        ...request,
        requester_profile: profilesById.get(request.requester_id),
        addressee_profile: profilesById.get(request.addressee_id),
      })) as FriendRequest[];
    },
    enabled: !!user?.id,
  });
};

export const useFriends = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('friends')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      const friendships = data || [];
      const friendIds = friendships.map((friendship) =>
        friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id,
      );
      const profiles = await fetchSocialProfiles(friendIds);
      const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

      return friendships.map((friendship) => {
        const friendId = friendship.user1_id === user.id
          ? friendship.user2_id
          : friendship.user1_id;
        return {
          ...friendship,
          friend_profile: profilesById.get(friendId),
        };
      }) as Friend[];
    },
    enabled: !!user?.id,
  });
};

export const useSendFriendRequest = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ addresseeId }: { addresseeId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('friend_requests')
        .insert([{ requester_id: user.id, addressee_id: addresseeId, status: 'pending' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
};

export const useRespondToFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'accepted' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
};

export const useCancelFriendRequest = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('requester_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
};
