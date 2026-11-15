import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import type { ExploreCategory, ExploreMapItem, SavedMapPlace } from '@/types/mapExplore';

interface ExploreSpotsParams {
  category?: ExploreCategory;
  userCoords?: { lat: number; lng: number } | null;
  radiusKm?: number;
}

export function useExploreSpots({ category = 'all', userCoords, radiusKm = 100 }: ExploreSpotsParams = {}) {
  return useQuery({
    queryKey: ['explore-map-items', category, userCoords?.lat, userCoords?.lng, radiusKm],
    queryFn: async (): Promise<ExploreMapItem[]> => {
      try {
        const { data, error } = await supabase.rpc('get_explore_map_items', {
          p_lat: userCoords?.lat ?? null,
          p_lng: userCoords?.lng ?? null,
          p_radius_km: radiusKm,
          p_category: category,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as ExploreMapItem[];
        }
      } catch (err) {
        console.warn('get_explore_map_items RPC unavailable, falling back to direct table queries:', err);
      }

      // Fallback: direct table select from reading_spots
      let query = supabase
        .from('reading_spots')
        .select('*')
        .eq('is_verified', true);

      if (category !== 'all' && category !== 'places' && category !== 'events') {
        query = query.eq('category', category);
      }

      const { data: spots, error: spotsErr } = await query;
      if (spotsErr) {
        console.error('Failed to load reading spots:', spotsErr);
        return [];
      }

      const items: ExploreMapItem[] = (spots || []).map((spot: any) => ({
        id: spot.id,
        item_type: 'reading_spot',
        title: spot.name,
        slug: spot.slug,
        category: spot.category,
        latitude: Number(spot.latitude),
        longitude: Number(spot.longitude),
        address: spot.address,
        city: spot.city,
        image_url: spot.image_url,
        description: spot.description,
        extra_meta: {
          amenities: spot.amenities,
          website_url: spot.website_url,
          country: spot.country,
        },
      }));

      // Also include literary events if category allows
      if (category === 'all' || category === 'events') {
        const { data: events } = await supabase
          .from('literary_events')
          .select('*')
          .eq('status', 'published')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (events && Array.isArray(events)) {
          events.forEach((ev: any) => {
            items.push({
              id: ev.id,
              item_type: 'literary_event',
              title: ev.title,
              slug: ev.slug,
              category: 'event',
              latitude: Number(ev.latitude),
              longitude: Number(ev.longitude),
              address: ev.venue || ev.city || 'Event Venue',
              city: ev.city,
              image_url: ev.image_url,
              description: ev.description,
              extra_meta: {
                start_at: ev.start_at,
                end_at: ev.end_at,
                price_type: ev.price_type,
                registration_url: ev.registration_url,
                organizer_name: ev.organizer_name,
              },
            });
          });
        }
      }

      return items;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSavedMapPlaces() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['saved-map-places', user?.id],
    queryFn: async (): Promise<SavedMapPlace[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('saved_map_places')
        .select('id, user_id, spot_id, notes, created_at, spot:reading_spots(*)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to load saved places:', error);
        return [];
      }
      return (data || []) as unknown as SavedMapPlace[];
    },
    enabled: !!user?.id,
  });

  const savePlaceMutation = useMutation({
    mutationFn: async ({ spotId, notes }: { spotId: string; notes?: string }) => {
      if (!user?.id) throw new Error('Sign in to save favorite reading spots.');
      const { data, error } = await supabase
        .from('saved_map_places')
        .insert({
          user_id: user.id,
          spot_id: spotId,
          notes: notes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-map-places', user?.id] });
    },
  });

  const removePlaceMutation = useMutation({
    mutationFn: async ({ spotId }: { spotId: string }) => {
      if (!user?.id) throw new Error('Sign in to manage saved reading spots.');
      const { error } = await supabase
        .from('saved_map_places')
        .delete()
        .eq('user_id', user.id)
        .eq('spot_id', spotId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-map-places', user?.id] });
    },
  });

  return {
    savedPlaces: query.data ?? [],
    isLoading: query.isLoading,
    isSaved: (spotId: string) => (query.data ?? []).some((item) => item.spot_id === spotId),
    savePlace: savePlaceMutation.mutateAsync,
    removePlace: removePlaceMutation.mutateAsync,
    isSaving: savePlaceMutation.isPending || removePlaceMutation.isPending,
  };
}
