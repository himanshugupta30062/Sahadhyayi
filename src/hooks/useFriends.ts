
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
    location_lat?: number;
    location_lng?: number;
    location_sharing?: boolean;
    last_seen?: string;
  };
}

export const useFriendRequests = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          requester_profile:profiles!requester_id(id, full_name, profile_photo_url, username),
          addressee_profile:profiles!addressee_id(id, full_name, profile_photo_url, username)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      if (error) throw error;
      return data || [];
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
        .select(`
          *,
          user1_profile:profiles!user1_id(id, full_name, profile_photo_url, username, bio, location_lat, location_lng, location_sharing, last_seen),
          user2_profile:profiles!user2_id(id, full_name, profile_photo_url, username, bio, location_lat, location_lng, location_sharing, last_seen)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      if (error) throw error;
      
      // Transform data to include friend_profile
      return (data || []).map(friendship => ({
        ...friendship,
        friend_profile: friendship.user1_id === user.id ? friendship.user2_profile : friendship.user1_profile
      }));
    },
    enabled: !!user?.id,
  });
};

export const useSendFriendRequest = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ addresseeId }: { addresseeId: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from('friend_requests')
        .insert([{
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] }); // Refresh discover section
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
      queryClient.invalidateQueries({ queryKey: ['all-users'] }); // Refresh discover section
    },
  });
};
