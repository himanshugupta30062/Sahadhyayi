import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import type { ExploreCategory, ExploreMapItem, SavedMapPlace } from '@/types/mapExplore';

interface ExploreSpotsParams {
  category?: ExploreCategory;
  userCoords?: { lat: number; lng: number } | null;
  radiusKm?: number;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

const distanceBetween = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number => {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fetchOpenMapPlaces = async (
  coords: { lat: number; lng: number },
  category: ExploreCategory,
  radiusKm: number,
  signal: AbortSignal,
): Promise<ExploreMapItem[]> => {
  if (category === 'events') return [];

  const radiusMeters = Math.min(Math.max(radiusKm, 1), 50) * 1000;
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((coords.lat * Math.PI) / 180), 0.15));
  const south = coords.lat - latDelta;
  const north = coords.lat + latDelta;
  const west = coords.lng - lngDelta;
  const east = coords.lng + lngDelta;
  const bounds = `${south},${west},${north},${east}`;

  const selectors = category === 'library'
    ? `nwr["amenity"="library"](${bounds});`
    : category === 'bookstore'
      ? `nwr["shop"="books"](${bounds});`
      : category === 'cafe'
        ? `nwr["amenity"="cafe"](${bounds});`
        : category === 'places'
          ? `nwr["amenity"="library"](${bounds});nwr["shop"="books"](${bounds});`
          : `nwr["amenity"="library"](${bounds});nwr["shop"="books"](${bounds});nwr["amenity"="cafe"](${bounds});`;

  const query = `[out:json][timeout:20];(${selectors})out center tags;`;
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: query,
    signal,
  });
  if (!response.ok) throw new Error(`OpenStreetMap search failed (${response.status})`);

  const payload = await response.json() as { elements?: OverpassElement[] };
  return (payload.elements ?? []).flatMap((element): ExploreMapItem[] => {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const tags = element.tags ?? {};
    const name = tags.name || tags['name:en'];
    if (!name || lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    const itemCategory = tags.amenity === 'library' ? 'library'
      : tags.shop === 'books' ? 'bookstore' : 'cafe';
    const distance = distanceBetween(coords, { lat, lng });
    if (distance > radiusMeters / 1000) return [];

    const address = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:suburb'],
    ].filter(Boolean).join(', ') || tags['addr:full'] || 'Address not listed on OpenStreetMap';

    return [{
      id: `osm-${element.type}-${element.id}`,
      item_type: 'reading_spot',
      title: name,
      slug: `osm-${element.type}-${element.id}`,
      category: itemCategory,
      latitude: lat,
      longitude: lng,
      address,
      city: tags['addr:city'] || tags['addr:town'] || tags['addr:city_district'] || null,
      image_url: null,
      description: itemCategory === 'cafe'
        ? 'Nearby café listed on OpenStreetMap. Check the venue details for reading-friendly seating.'
        : tags.description || tags.note || null,
      distance_km: Math.round(distance * 10) / 10,
      extra_meta: {
        website_url: tags.website || tags['contact:website'] || null,
        opening_hours: tags.opening_hours || null,
        phone: tags.phone || tags['contact:phone'] || null,
        source: 'OpenStreetMap',
        osm_url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      },
    }];
  });
};

export function useExploreSpots({ category = 'all', userCoords, radiusKm = 25 }: ExploreSpotsParams = {}) {
  return useQuery({
    queryKey: ['explore-map-items', category, userCoords?.lat, userCoords?.lng, radiusKm],
    queryFn: async ({ signal }): Promise<ExploreMapItem[]> => {
      const itemsById = new Map<string, ExploreMapItem>();
      let rpcSucceeded = false;

      // Curated and admin-verified Sahadhyayi locations remain the trusted baseline.
      try {
        const { data, error } = await supabase.rpc('get_explore_map_items', {
          p_lat: userCoords?.lat ?? null,
          p_lng: userCoords?.lng ?? null,
          p_radius_km: radiusKm,
          p_category: category,
        });
        if (!error && Array.isArray(data)) {
          rpcSucceeded = true;
          (data as ExploreMapItem[]).forEach((item) => itemsById.set(item.id, item));
        }
      } catch (err) {
        console.warn('Explore map RPC unavailable; using direct table queries.', err);
      }

      // Direct-table fallback also runs when the RPC returns an empty array.
      if (!rpcSucceeded || itemsById.size === 0) {
        if (category !== 'events') {
          let spotsQuery = supabase.from('reading_spots').select('*').eq('is_verified', true);
          if (category !== 'all' && category !== 'places') {
            spotsQuery = spotsQuery.eq('category', category);
          }
          const { data: spots, error: spotsError } = await spotsQuery;
          if (spotsError) {
            console.warn('Could not load curated reading spots:', spotsError.message);
          } else {
            (spots ?? []).forEach((spot: any) => {
              const latitude = Number(spot.latitude);
              const longitude = Number(spot.longitude);
              if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
              const distance = userCoords
                ? distanceBetween(userCoords, { lat: latitude, lng: longitude })
                : null;
              if (distance != null && distance > radiusKm) return;
              itemsById.set(spot.id, {
                id: spot.id,
                item_type: 'reading_spot',
                title: spot.name,
                slug: spot.slug,
                category: spot.category,
                latitude,
                longitude,
                address: spot.address,
                city: spot.city,
                image_url: spot.image_url,
                description: spot.description,
                distance_km: distance == null ? null : Math.round(distance * 10) / 10,
                extra_meta: {
                  amenities: spot.amenities,
                  website_url: spot.website_url,
                  country: spot.country,
                  source: 'Sahadhyayi verified directory',
                },
              });
            });
          }
        }
      }

      // Events are supplied by Sahadhyayi's editorial/event database, not inferred from POIs.
      if (category === 'all' || category === 'events') {
        const { data: events, error: eventsError } = await supabase
          .from('literary_events')
          .select('*')
          .eq('status', 'published')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        if (eventsError) {
          console.warn('Could not load geocoded literary events:', eventsError.message);
        } else {
          (events ?? []).forEach((event: any) => {
            const latitude = Number(event.latitude);
            const longitude = Number(event.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
            const distance = userCoords
              ? distanceBetween(userCoords, { lat: latitude, lng: longitude })
              : null;
            if (distance != null && distance > radiusKm) return;
            itemsById.set(event.id, {
              id: event.id,
              item_type: 'literary_event',
              title: event.title,
              slug: event.slug,
              category: 'event',
              latitude,
              longitude,
              address: event.venue || event.city || 'Event venue',
              city: event.city,
              image_url: event.image_url,
              description: event.description,
              distance_km: distance == null ? null : Math.round(distance * 10) / 10,
              extra_meta: {
                start_at: event.start_at,
                end_at: event.end_at,
                price_type: event.price_type,
                registration_url: event.registration_url,
                organizer_name: event.organizer_name,
                source: 'Sahadhyayi events',
              },
            });
          });
        }
      }

      // OpenStreetMap adds real nearby public POIs without requiring another paid API key.
      if (userCoords && category !== 'events') {
        try {
          const openMapItems = await fetchOpenMapPlaces(userCoords, category, radiusKm, signal);
          openMapItems.forEach((item) => {
            if (!itemsById.has(item.id)) itemsById.set(item.id, item);
          });
        } catch (error) {
          if (signal.aborted) throw error;
          console.warn('OpenStreetMap nearby discovery is temporarily unavailable:', error);
        }
      }

      return [...itemsById.values()].sort((a, b) => {
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
      });
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
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
