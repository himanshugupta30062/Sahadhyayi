
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import type { LocationCoords } from '@/lib/locationService';

export interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  last_updated: string;
  is_active: boolean;
}

export const useUserLocation = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-location', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserLocation | null;
    },
    enabled: !!user,
  });
};

export const useUpdateUserLocation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (location: LocationCoords) => {
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: location.lat,
          longitude: location.lng,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-location'] });
    },
  });
};

export const useFriendsLocations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends-locations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_locations')
        .select(`
          *,
          profiles!inner(id, full_name, profile_photo_url)
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};
