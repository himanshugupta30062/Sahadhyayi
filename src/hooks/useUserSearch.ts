
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
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
  
  const normalizedSearchTerm = debouncedSearchTerm.trim();

  const query = useQuery({
    // The current user affects the RPC filters, so their identity must be part of the cache key.
    queryKey: ['user-search', user?.id, normalizedSearchTerm],
    queryFn: async () => {
      if (!user?.id || normalizedSearchTerm.length < 2) return [];
      
      
      try {
        const { data, error } = await supabase
          .rpc('get_public_profiles_for_search', { search_term: normalizedSearchTerm })
          .neq('id', user?.id || '');
        
        if (error) throw error;
        return data as SearchUser[];
      } catch (err) {
        console.error('User search failed', { errorName: err instanceof Error ? err.name : 'UnknownError' });
        throw err;
      }
    },
    enabled: !!user?.id && normalizedSearchTerm.length >= 2,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // The query key changes only after the debounce timer. Expose that transition so
  // the UI does not briefly show results for the previous search under the new term.
  return {
    ...query,
    isDebouncing: searchTerm.trim() !== normalizedSearchTerm,
  };
};

export const useAllUsers = (options: { enabled?: boolean } = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    // Suggestions depend on the signed-in user's friend/request exclusions.
    queryKey: ['all-users', user?.id],
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

        if (friendsResponse.error) throw friendsResponse.error;
        if (requestsResponse.error) throw requestsResponse.error;

        // Never show existing friends or pending connections as new suggestions.
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
          .rpc('get_public_profiles_for_search', { search_term: '' })
          .not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`)
          .limit(50);
        
        if (error) throw error;
        return data as SearchUser[];
      } catch (err) {
        console.error('Loading user suggestions failed', { errorName: err instanceof Error ? err.name : 'UnknownError' });
        throw err;
      }
    },
    enabled: !!user?.id && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
};
