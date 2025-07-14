
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  
  return useQuery({
    queryKey: ['user-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_photo_url, bio')
        .or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
        .neq('id', user?.id || '')
        .limit(20);
      
      if (error) throw error;
      return data as SearchUser[];
    },
    enabled: searchTerm.length >= 2,
  });
};

export const useAllUsers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_photo_url, bio')
        .neq('id', user?.id || '')
        .limit(50);
      
      if (error) throw error;
      return data as SearchUser[];
    },
    enabled: !!user?.id,
  });
};
