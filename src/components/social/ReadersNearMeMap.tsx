
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, BookOpen, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { LocationPermissionModal } from './LocationPermissionModal';
import { getCurrentLocation, calculateDistance, type LocationCoords } from '@/lib/locationService';
import { useCurrentBook } from '@/hooks/useCurrentBook';
import { useFriends } from '@/hooks/useFriends';

declare global {
  interface Window {
    google: any;
  }
}

interface NearbyReader {
  id: string;
  full_name: string;
  profile_photo_url?: string;
  location_lat: number;
  location_lng: number;
  distance: number;
  current_book_title?: string;
}

export const ReadersNearMeMap: React.FC = () => {
  const { user } = useAuth();
  const { data: currentBook } = useCurrentBook();
  const { data: friends = [] } = useFriends();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [nearbyReaders, setNearbyReaders] = useState<NearbyReader[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDPBJ3hdp-aILWTyyAJQtDku30yiLA4P2Y';
  const MAX_DISTANCE_KM = 50;

  // Request location permission on component mount
  useEffect(() => {
    setShowLocationModal(true);
  }, []);

  const handleRequestLocation = async () => {
    try {
      setLocationError(null);
      const location = await getCurrentLocation();
      setUserLocation(location);
      setShowLocationModal(false);
      toast.success('Location access granted!');
    } catch (error: any) {
      setLocationError(error.message);
    }
  };

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

  // Initialize map when loaded and user location is available
  useEffect(() => {
    if (isLoaded && userLocation && mapRef.current && window.google) {
      initializeMap();
    }
  }, [isLoaded, userLocation]);

  // Fetch nearby readers when location and current book are available
  useEffect(() => {
    if (userLocation && currentBook) {
      fetchNearbyReaders();
    }
  }, [userLocation, currentBook]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !userLocation) return;

    const mapOptions = {
      center: userLocation,
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
  };

  const fetchNearbyReaders = async () => {
    if (!userLocation || !currentBook || !user) return;

    try {
      // Fetch users reading the same book with location data
      const { data: readersData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          profile_photo_url,
          location_lat,
          location_lng,
          user_bookshelf!inner(book_id, status)
        `)
        .eq('user_bookshelf.book_id', currentBook.id)
        .in('user_bookshelf.status', ['reading', 'want_to_read'])
        .eq('location_sharing', true)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .neq('id', user.id);

      if (error) {
        console.error('Error fetching nearby readers:', error);
        return;
      }

      if (!readersData || readersData.length === 0) {
        setNearbyReaders([]);
        return;
      }

      // Calculate distances and filter within radius
      const readersWithDistance = readersData
        .map((reader: any) => ({
          id: reader.id,
          full_name: reader.full_name,
          profile_photo_url: reader.profile_photo_url,
          location_lat: Number(reader.location_lat),
          location_lng: Number(reader.location_lng),
          distance: calculateDistance(
            userLocation,
            { lat: Number(reader.location_lat), lng: Number(reader.location_lng) }
          ),
          current_book_title: currentBook.title,
        }))
        .filter((reader: NearbyReader) => reader.distance <= MAX_DISTANCE_KM)
        .sort((a: NearbyReader, b: NearbyReader) => a.distance - b.distance);

      setNearbyReaders(readersWithDistance);
    } catch (error) {
      console.error('Error fetching nearby readers:', error);
    }
  };

  // Update markers when readers or map change
  useEffect(() => {
    if (!map || !window.google || !userLocation) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];

    // Add user's own marker
    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: map,
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
        <div style="padding: 10px; max-width: 200px;">
          <div style="font-weight: bold; color: #3b82f6; margin-bottom: 5px;">
            📍 Your Location
          </div>
          <p style="margin: 0; font-size: 14px;">
            ${currentBook ? `Reading: ${currentBook.title}` : 'No current book'}
          </p>
        </div>
      `
    });

    userMarker.addListener('click', () => {
      userInfoWindow.open(map, userMarker);
    });

    newMarkers.push(userMarker);

    // Add nearby readers markers
    nearbyReaders.forEach((reader) => {
      const marker = new window.google.maps.Marker({
        position: { lat: reader.location_lat, lng: reader.location_lng },
        map: map,
        title: reader.full_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#f97316',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        }
      });

      const isFriend = friends.some(f => f.friend_profile?.id === reader.id);

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <div style="width: 40px; height: 40px; background: ${isFriend ? '#10b981' : '#f97316'}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ${reader.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                  ${reader.full_name} ${isFriend ? '👥' : ''}
                </h3>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                  ${reader.distance.toFixed(1)} km away
                </p>
              </div>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 14px;">
              📖 Reading: <strong>${reader.current_book_title}</strong>
            </p>
            <button 
              onclick="window.handleConnectReader('${reader.id}')"
              style="
                background: #f97316; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                width: 100%;
              "
            >
              ${isFriend ? '💬 Chat' : '🤝 Connect'}
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Adjust map bounds to show all markers
    if (newMarkers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);
    }
  }, [map, nearbyReaders, userLocation, friends]);

  // Global handler for connect button in info windows
  useEffect(() => {
    (window as any).handleConnectReader = (readerId: string) => {
      // You can implement connect logic here
      toast.success('Connect feature coming soon!');
    };

    return () => {
      delete (window as any).handleConnectReader;
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            📚 Readers Near Me
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl h-[500px] border overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
              <p className="text-gray-600 font-medium">Loading interactive map...</p>
              <p className="text-sm text-gray-500 mt-2">Connecting to Google Maps</p>
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
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            📚 Readers Near Me
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-red-50 to-orange-50 rounded-xl h-[500px] border overflow-hidden flex items-center justify-center">
            <div className="text-center max-w-md">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Error</h3>
              <p className="text-gray-600 mb-4">
                Unable to load the interactive map. Please refresh the page.
              </p>
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

  if (!userLocation) {
    return (
      <>
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              📚 Readers Near Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl h-[500px] border overflow-hidden flex items-center justify-center">
              <div className="text-center max-w-md">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Required</h3>
                <p className="text-gray-600 mb-4">
                  We need your location to show readers near you who are reading the same book.
                </p>
                <Button 
                  onClick={() => setShowLocationModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Enable Location
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <LocationPermissionModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onRequestLocation={handleRequestLocation}
          hasError={!!locationError}
          errorMessage={locationError || undefined}
        />
      </>
    );
  }

  return (
    <>
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            📚 Readers Near Me
            {currentBook && (
              <span className="text-sm font-normal text-gray-600">
                • {currentBook.title}
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            {currentBook ? 
              `Find other readers near you reading "${currentBook.title}"` :
              'Set a current book to see nearby readers'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            ref={mapRef}
            className="w-full h-[500px] rounded-xl border border-gray-200 overflow-hidden shadow-lg"
          />
          
          {/* Nearby Readers List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              Nearby Readers ({nearbyReaders.length})
            </h3>
            {nearbyReaders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {currentBook ? 
                    `No nearby readers found for "${currentBook.title}"` :
                    'Set your current book to find nearby readers'
                  }
                </p>
                <p className="text-xs mt-1">
                  Readers within {MAX_DISTANCE_KM} km will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {nearbyReaders.map((reader) => {
                  const isFriend = friends.some(f => f.friend_profile?.id === reader.id);
                  return (
                    <div
                      key={reader.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 border border-gray-100 hover:border-orange-200 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${isFriend ? 'from-green-400 to-green-600' : 'from-orange-400 to-orange-600'} rounded-full flex items-center justify-center shadow-sm`}>
                          <span className="text-sm font-bold text-white">
                            {reader.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            {reader.full_name}
                            {isFriend && <span className="text-green-600">👥</span>}
                          </p>
                          <p className="text-xs text-gray-600">
                            📖 {reader.current_book_title}
                          </p>
                          <p className="text-xs text-gray-400">
                            📍 {reader.distance.toFixed(1)} km away
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className={`${isFriend ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
                        >
                          {isFriend ? (
                            <>
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Chat
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRequestLocation={handleRequestLocation}
        hasError={!!locationError}
        errorMessage={locationError || undefined}
      />
    </>
  );
};
