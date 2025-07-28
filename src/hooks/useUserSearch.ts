
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, profile_photo_url, bio')
          .neq('id', user?.id || '')
          .limit(50);
        
        if (error) {
          console.error('All users API error:', error);
          return [];
        }
        
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
