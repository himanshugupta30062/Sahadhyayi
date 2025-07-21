
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, BookOpen, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { LocationPermissionModal } from './LocationPermissionModal';
import { BookFilterDropdown } from './BookFilterDropdown';
import { getCurrentLocation, calculateDistance, type LocationCoords } from '@/lib/locationService';
import { useFriends } from '@/hooks/useFriends';
import { useUpdateUserLocation } from '@/hooks/useUserLocation';

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
  avatar_img_url?: string;
}

interface BookOption {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
}

export const ReadersNearMeMap: React.FC = () => {
  const { user } = useAuth();
  const { data: friends = [] } = useFriends();
  const updateLocationMutation = useUpdateUserLocation();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [nearbyReaders, setNearbyReaders] = useState<NearbyReader[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDPBJ3hdp-aILWTyyAJQtDku30yiLA4P2Y';
  const MAX_DISTANCE_KM = 50;

  // Auto-load map and request location on component mount
  useEffect(() => {
    const autoRequestLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        
        // Save location to database
        await updateLocationMutation.mutateAsync(location);
        
        toast.success('Location detected for map');
      } catch (error: any) {
        console.log('Location permission not available, loading map without location');
        // Still load the map even without location
      }
    };

    autoRequestLocation();
  }, []);

  const handleRequestLocation = async () => {
    try {
      setLocationError(null);
      const location = await getCurrentLocation();
      setUserLocation(location);
      
      // Save location to database
      await updateLocationMutation.mutateAsync(location);
      
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

  // Initialize map when loaded (with or without user location)
  useEffect(() => {
    if (isLoaded && mapRef.current && window.google) {
      initializeMap();
    }
  }, [isLoaded]);

  // Fetch nearby readers when location and selected book are available
  useEffect(() => {
    if (userLocation && selectedBook) {
      fetchNearbyReaders();
    } else {
      setNearbyReaders([]);
    }
  }, [userLocation, selectedBook]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = { lat: 20, lng: 0 }; // World center as fallback
    const mapOptions = {
      center: userLocation || defaultCenter,
      zoom: userLocation ? 12 : 2,
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

    // Try to get user location after map is initialized if not already available
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          newMap.setCenter(location);
          newMap.setZoom(12);
          
          // Save location to database
          try {
            await updateLocationMutation.mutateAsync(location);
          } catch (error) {
            console.log('Failed to save location to database');
          }
        },
        () => {
          console.log('Geolocation failed, using default map view');
        }
      );
    }
  };

  const fetchNearbyReaders = async () => {
    if (!userLocation || !selectedBook || !user) return;

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
          user_bookshelf!inner(book_id, status),
          user_avatars(avatar_img_url)
        `)
        .eq('user_bookshelf.book_id', selectedBook.id)
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
          current_book_title: selectedBook.title,
          avatar_img_url: reader.user_avatars?.[0]?.avatar_img_url,
        }))
        .filter((reader: NearbyReader) => reader.distance <= MAX_DISTANCE_KM)
        .sort((a: NearbyReader, b: NearbyReader) => a.distance - b.distance);

      setNearbyReaders(readersWithDistance);
    } catch (error) {
      console.error('Error fetching nearby readers:', error);
    }
  };

  // Create custom marker icon from avatar
  const createAvatarMarker = (avatarUrl: string, isUser: boolean = false) => {
    if (!window.google) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 40;
    canvas.height = 40;

    if (ctx) {
      // Draw circle background
      ctx.beginPath();
      ctx.arc(20, 20, 18, 0, 2 * Math.PI);
      ctx.fillStyle = isUser ? '#3b82f6' : '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Load and draw avatar image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(20, 20, 15, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 5, 5, 30, 30);
        ctx.restore();
      };
      img.src = avatarUrl;
    }

    return canvas.toDataURL();
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
            ${selectedBook ? `Looking for readers of: ${selectedBook.title}` : 'Select a book to find nearby readers'}
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
        icon: reader.avatar_img_url ? {
          url: reader.avatar_img_url,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        } : {
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
                ${reader.avatar_img_url ? `<img src="${reader.avatar_img_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />` : reader.full_name.charAt(0).toUpperCase()}
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
  }, [map, nearbyReaders, userLocation, friends, selectedBook]);

  // Global handler for connect button in info windows
  useEffect(() => {
    (window as any).handleConnectReader = (readerId: string) => {
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


  return (
    <>
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            📚 Readers Near Me
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Select a book from your library to find nearby readers
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Book Selection Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Book
            </label>
            <BookFilterDropdown
              selectedBookId={selectedBook?.id || null}
              onBookSelect={setSelectedBook}
            />
          </div>

          <div
            ref={mapRef}
            className="w-full h-[500px] rounded-xl border border-gray-200 overflow-hidden shadow-lg"
          />
          
          {/* Nearby Readers List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              Nearby Readers ({nearbyReaders.length})
              {selectedBook && (
                <span className="text-sm font-normal text-gray-600">
                  reading "{selectedBook.title}"
                </span>
              )}
            </h3>
            {!selectedBook ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Please select a book from the dropdown above to find nearby readers
                </p>
              </div>
            ) : nearbyReaders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No readers found for "{selectedBook.title}" yet
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
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm overflow-hidden ${isFriend ? 'border-2 border-green-400' : 'border-2 border-orange-400'}`}>
                          {reader.avatar_img_url ? (
                            <img 
                              src={reader.avatar_img_url} 
                              alt={reader.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className={`text-sm font-bold text-white bg-gradient-to-br ${isFriend ? 'from-green-400 to-green-600' : 'from-orange-400 to-orange-600'} w-full h-full flex items-center justify-center`}>
                              {reader.full_name.charAt(0).toUpperCase()}
                            </span>
                          )}
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

    </>
  );
};
