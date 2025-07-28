
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';

export interface SearchUser {
  id: string;
  full_name: string;
  username?: string;
  profile_photo_url?: string;
  bio?: string;
  email?: string;
}

export const useUserSearch = (searchTerm: string) => {
  const { user } = useAuth();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  return useQuery({
    queryKey: ['user-search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
      
      console.log('Searching for users with term:', debouncedSearchTerm);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, profile_photo_url, bio')
          .or(`full_name.ilike.%${debouncedSearchTerm}%,username.ilike.%${debouncedSearchTerm}%,bio.ilike.%${debouncedSearchTerm}%`)
          .neq('id', user?.id || '')
          .limit(20);
        
        if (error) {
          console.error('User search API error:', error);
          // Return empty array on error rather than throwing
          return [];
        }
        
        console.log('User search results:', data?.length || 0, 'users found');
        return data as SearchUser[];
      } catch (err) {
        console.error('User search exception:', err);
        return [];
      }
    },
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllUsers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      try {
        // Get current user's friends and pending requests to exclude them
        const [friendsResponse, requestsResponse] = await Promise.all([
          supabase
            .from('friends')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`),
          supabase
            .from('friend_requests')
            .select('requester_id, addressee_id')
            .or(`requester_id.eq.${user?.id},addressee_id.eq.${user?.id}`)
            .eq('status', 'pending')
        ]);

        // Extract friend and pending request user IDs
        const friendIds = new Set<string>();
        friendsResponse.data?.forEach(friend => {
          if (friend.user1_id !== user?.id) friendIds.add(friend.user1_id);
          if (friend.user2_id !== user?.id) friendIds.add(friend.user2_id);
        });

        const pendingIds = new Set<string>();
        requestsResponse.data?.forEach(request => {
          if (request.requester_id !== user?.id) pendingIds.add(request.requester_id);
          if (request.addressee_id !== user?.id) pendingIds.add(request.addressee_id);
        });

        // Combine all IDs to exclude (friends + pending requests + current user)
        const excludeIds = [...friendIds, ...pendingIds, user?.id || ''];

        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, profile_photo_url, bio')
          .not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`)
          .limit(50);
        
        if (error) {
          console.error('All users API error:', error);
          return [];
        }
        
        console.log(`Discover users: ${data.length} found (excluded ${excludeIds.length} friends/pending)`);
        return data as SearchUser[];
      } catch (err) {
        console.error('All users exception:', err);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
