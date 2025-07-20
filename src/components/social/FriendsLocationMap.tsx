import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

// Google Maps types
declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    googleMapsLoadingPromise?: Promise<void>;
  }
}

export const FriendsLocationMap: React.FC = () => {
  const { user } = useAuth();
  const { data: friends = [], refetch } = useFriends();

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  const GOOGLE_MAPS_API_KEY =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
    'AIzaSyDPBJ3hdp-aILWTyyAJQtDku30yiLA4P2Y';

  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(initializeMap)
      .catch(err => {
        console.error('Failed to load Google Maps', err);
        toast.error('Failed to load map');
      });
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !(window.google && window.google.maps)) return;
    const center = { lat: 28.6139, lng: 77.2090 };
    const newMap = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
    });
    setMap(newMap);
  };

  // Update markers when friends or map change
  useEffect(() => {
    if (!map || !(window.google && window.google.maps)) return;

    // Clear old markers
    markers.forEach(m => m.setMap(null));
    const newMarkers: any[] = [];

    friends.forEach(friend => {
      const profile = friend.friend_profile;
      if (
        profile?.location_sharing &&
        profile.location_lat != null &&
        profile.location_lng != null
      ) {
        const marker = new window.google.maps.Marker({
          position: {
            lat: Number(profile.location_lat),
            lng: Number(profile.location_lng),
          },
          map,
          title: profile.full_name,
        });
        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
  }, [friends, map]);

  // Subscribe to profile updates to refresh data
  useEffect(() => {
    const channel = supabase
      .channel('friend_location_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          refetch();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        if (!user) return;
        const { error } = await supabase
          .from('profiles')
          .update({
            location_lat: pos.coords.latitude,
            location_lng: pos.coords.longitude,
            location_sharing: true,
            last_seen: new Date().toISOString(),
          })
          .eq('id', user.id);
        if (error) {
          console.error('Failed to share location:', error);
          toast.error('Failed to share location');
        } else {
          toast.success('Location shared');
          refetch();
        }
      },
      () => {
        toast.error('Unable to retrieve location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Card className="bg-white shadow-sm border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <MapPin className="w-5 h-5" />
          Friends Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          style={{ height: '400px', width: '100%' }}
          className="rounded-lg border"
        />
        <div className="flex justify-center mt-4">
          <Button onClick={shareLocation} className="bg-green-600 hover:bg-green-700">
            Share My Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

