
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { getCurrentLocation, type LocationCoords } from '@/lib/locationService';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

declare global {
  interface Window {
    google: any;
  }
}

export const FriendsLocationMap: React.FC = () => {
  const { user } = useAuth();
  const { data: friends = [], refetch } = useFriends();

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-6">
          <div className="text-gray-600 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4M9 7l6 3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Google Maps API Key Required</h3>
          <p className="text-gray-600 mb-4">
            To display the map, please configure your Google Maps API key.
          </p>
          <div className="text-sm text-gray-500">
            <p>1. Get an API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Google Cloud Console</a></p>
            <p>2. Update src/config/maps.ts with your API key</p>
          </div>
        </div>
      </div>
    );
  }

  // Load Google Maps
  useEffect(() => {
    const loadMap = async () => {
      try {
        setIsLoading(true);
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast.error('Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, [GOOGLE_MAPS_API_KEY]);

  // Initialize map when loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && window.google) {
      initializeMap();
    }
  }, [isLoaded]);

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

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
    
    const center = { lat: 28.6139, lng: 77.2090 }; // Default to Delhi
    const mapOptions = {
      center,
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // Try to center on user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          newMap.setCenter(userPos);
        },
        (error) => {
          console.log('Could not get user location:', error);
        }
      );
    }
  };

  // Update markers when friends or map change
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear old markers
    markers.forEach(m => m.setMap(null));
    const newMarkers: any[] = [];

    // Add user's location if available
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        }
      });

      const userInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <div style="font-weight: bold; color: #3b82f6;">
              📍 Your Location
            </div>
          </div>
        `
      });

      userMarker.addListener('click', () => {
        userInfoWindow.open(map, userMarker);
      });

      newMarkers.push(userMarker);
    }

    // Add friends markers
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
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 200px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 32px; height: 32px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 14px; font-weight: 600;">
                    ${profile.full_name}
                  </h3>
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    Friend
                  </p>
                </div>
              </div>
              ${profile.bio ? `<p style="margin: 0; font-size: 12px; color: #374151;">${profile.bio}</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    // Adjust map bounds if we have multiple markers
    if (newMarkers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);
    }
  }, [friends, map, userLocation]);

  const shareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to share location');
      return;
    }

    try {
      // Show loading state
      toast.loading('Getting your location...');
      
      const position = await getCurrentLocation();
      
      // Check if user profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let updateResult;
      
      // Record location sharing consent first
      const { error: consentError } = await supabase.rpc('record_location_consent', {
        ip_addr: null,
        user_agent_string: navigator.userAgent
      });

      if (consentError) {
        console.error('Failed to record consent:', consentError);
        toast.error('Failed to record location sharing consent');
        return;
      }

      if (existingProfile) {
        // Update existing profile
        updateResult = await supabase
          .from('profiles')
          .update({
            location_lat: position.lat,
            location_lng: position.lng,
            last_seen: new Date().toISOString(),
          })
          .eq('id', user.id);
      } else {
        // Insert new profile
        updateResult = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            location_lat: position.lat,
            location_lng: position.lng,
            last_seen: new Date().toISOString(),
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          });
      }

      if (updateResult.error) {
        console.error('Failed to share location:', updateResult.error);
        toast.error('Failed to share location: ' + updateResult.error.message);
      } else {
        setUserLocation(position);
        toast.success('Location shared with friends!');
        refetch();
        
        // Center map on user location
        if (map) {
          map.setCenter(position);
          map.setZoom(14);
        }
      }
    } catch (error: any) {
      console.error('Location error:', error);
      toast.error(error.message || 'Unable to retrieve location');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5" />
            Friends Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg border flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5" />
            Friends Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg border flex items-center justify-center">
            <div className="text-center max-w-md">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <h3 className="font-semibold text-gray-900 mb-2">Map Loading Error</h3>
              <p className="text-gray-600 mb-4">Unable to load the map. Please refresh the page.</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-orange-600 hover:bg-orange-700"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const friendsWithLocation = friends.filter(f => 
    f.friend_profile?.location_sharing && 
    f.friend_profile?.location_lat != null && 
    f.friend_profile?.location_lng != null
  );

  return (
    <Card className="bg-white shadow-sm border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <MapPin className="w-5 h-5" />
          Friends Map
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          See where your reading friends are located
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={mapRef}
          className="w-full h-[400px] rounded-lg border border-gray-200 overflow-hidden"
        />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{friendsWithLocation.length} friends sharing location</span>
          </div>
          <Button
            onClick={shareLocation}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Share My Location
          </Button>
        </div>

        {friendsWithLocation.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No friends are currently sharing their location</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
