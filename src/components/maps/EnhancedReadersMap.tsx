import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Share2, Users, BookOpen, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserProfile {
  full_name?: string;
  username?: string;
  profile_photo_url?: string;
  bio?: string;
}

interface Reader {
  id: string;
  user_id: string;
  name: string;
  book: string;
  lat: number;
  lng: number;
  created_at: string;
  updated_at?: string;
  user_profile?: UserProfile;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const libraries: ("places")[] = ["places"];

const EnhancedReadersMap = () => {
  const { user } = useAuth();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentlyReading, setCurrentlyReading] = useState('');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredReader, setHoveredReader] = useState<Reader | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // Load readers from database
  const loadReaders = useCallback(async () => {
    try {
      console.log('Loading readers from database...');
      
      const { data, error } = await supabase
        .from('readers')
        .select(`
          *,
          user_profile:profiles(full_name, username, profile_photo_url, bio)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading readers:', error);
        return;
      }

      console.log('Loaded readers:', data?.length || 0);
      
      // Transform the data to handle potential errors in the join
      const processedReaders: Reader[] = (data || []).map(reader => {
        // Handle the case where user_profile might be null or an error object
        const userProfile = reader.user_profile;
        
        // If userProfile is null or undefined, use fallback
        if (userProfile === null || userProfile === undefined) {
          return {
            ...reader,
            user_profile: {
              full_name: reader.name,
              username: '',
            }
          };
        }
        
        // Check if userProfile is an error object (now TypeScript knows it's not null)
        if (typeof userProfile === 'object' && 'error' in userProfile) {
          return {
            ...reader,
            user_profile: {
              full_name: reader.name,
              username: '',
            }
          };
        }
        
        return reader as Reader;
      });
      
      setReaders(processedReaders);
    } catch (error) {
      console.error('Error loading readers:', error);
    }
  }, []);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          console.log('Got user location:', location);
          
          // Center map on user location
          if (map) {
            map.panTo(location);
            map.setZoom(12);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Could not get your current location. Using default location.",
            variant: "destructive",
          });
        }
      );
    }
  }, [map]);

  // Share user's location
  const shareLocation = async () => {
    if (!user || !userLocation || !currentlyReading.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter what you're reading and allow location access.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    try {
      // Check if user already has a location shared
      const { data: existingReader } = await supabase
        .from('readers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingReader) {
        // Update existing location
        const { error } = await supabase
          .from('readers')
          .update({
            lat: userLocation.lat,
            lng: userLocation.lng,
            book: currentlyReading,
            name: user.user_metadata?.full_name || user.email || 'Anonymous Reader',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new location
        const { error } = await supabase
          .from('readers')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email || 'Anonymous Reader',
            book: currentlyReading,
            lat: userLocation.lat,
            lng: userLocation.lng
          });

        if (error) throw error;
      }

      toast({
        title: "Location Shared!",
        description: "Your reading location has been shared with the community.",
      });

      await loadReaders();
    } catch (error) {
      console.error('Error sharing location:', error);
      toast({
        title: "Error",
        description: "Failed to share your location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Remove user's location
  const removeLocation = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('readers')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Location Removed",
        description: "Your location has been removed from the map.",
      });

      await loadReaders();
    } catch (error) {
      console.error('Error removing location:', error);
      toast({
        title: "Error",
        description: "Failed to remove your location.",
        variant: "destructive",
      });
    }
  };

  // Initialize map and load data
  useEffect(() => {
    if (isLoaded) {
      loadReaders();
      getCurrentLocation();
    }
  }, [isLoaded, loadReaders, getCurrentLocation]);

  // Custom marker icon for current user
  const createUserMarkerIcon = (): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: 12,
    fillColor: '#3B82F6',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 3
  });

  // Custom marker icon for other readers
  const createReaderMarkerIcon = (): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: '#F59E0B',
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 2
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isUserReader = (reader: Reader) => {
    return user && reader.user_id === user.id;
  };

  if (loadError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading maps</p>
          <p className="text-gray-600">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Reading Community Map</h3>
                <Badge variant="secondary" className="ml-2">
                  {readers.length} readers online
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Find My Location
              </Button>
            </div>

            {userLocation && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Share what you're reading</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter the book you're currently reading..."
                      value={currentlyReading}
                      onChange={(e) => setCurrentlyReading(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={shareLocation}
                      disabled={isSharing || !currentlyReading.trim()}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {isSharing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Location
                        </>
                      )}
                    </Button>
                    {readers.some(r => isUserReader(r)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeLocation}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={userLocation || defaultCenter}
            zoom={userLocation ? 12 : 6}
            onLoad={setMap}
            options={{
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {/* User's current location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={createUserMarkerIcon()}
                title="Your Location"
              />
            )}

            {/* Other readers markers */}
            {readers.map((reader) => (
              <Marker
                key={reader.id}
                position={{ lat: reader.lat, lng: reader.lng }}
                icon={createReaderMarkerIcon()}
                title={`${reader.name} is reading ${reader.book}`}
                onClick={() => setSelectedReader(reader)}
                onMouseOver={() => setHoveredReader(reader)}
                onMouseOut={() => setHoveredReader(null)}
              />
            ))}

            {/* Info window for selected reader */}
            {selectedReader && (
              <InfoWindow
                position={{ lat: selectedReader.lat, lng: selectedReader.lng }}
                onCloseClick={() => setSelectedReader(null)}
              >
                <div className="p-3 max-w-sm">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedReader.user_profile?.profile_photo_url} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {getInitials(selectedReader.user_profile?.full_name || selectedReader.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {selectedReader.user_profile?.full_name || selectedReader.name}
                      </h4>
                      {selectedReader.user_profile?.username && (
                        <p className="text-sm text-gray-500">@{selectedReader.user_profile.username}</p>
                      )}
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Currently Reading:</p>
                        <p className="text-sm text-gray-600">{selectedReader.book}</p>
                      </div>
                      {selectedReader.user_profile?.bio && (
                        <p className="text-xs text-gray-500 mt-2">{selectedReader.user_profile.bio}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(selectedReader.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!isUserReader(selectedReader) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button size="sm" variant="outline" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}

            {/* Hover info window */}
            {hoveredReader && hoveredReader !== selectedReader && isLoaded && (
              <InfoWindow
                position={{ lat: hoveredReader.lat, lng: hoveredReader.lng }}
                options={{
                  disableAutoPan: true,
                  pixelOffset: new google.maps.Size(0, -40)
                }}
              >
                <div className="p-2 text-center">
                  <p className="font-medium text-sm">
                    {hoveredReader.user_profile?.full_name || hoveredReader.name}
                  </p>
                  <p className="text-xs text-gray-600">Reading: {hoveredReader.book}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </CardContent>
      </Card>

      {/* Readers List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Active Readers</h3>
          </div>
          
          {readers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No readers are currently sharing their location</p>
              <p className="text-sm">Be the first to share what you're reading!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {readers.map((reader) => (
                <div
                  key={reader.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isUserReader(reader) 
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  )}
                  onClick={() => {
                    setSelectedReader(reader);
                    if (map) {
                      map.panTo({ lat: reader.lat, lng: reader.lng });
                      map.setZoom(15);
                    }
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={reader.user_profile?.profile_photo_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {getInitials(reader.user_profile?.full_name || reader.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">
                        {reader.user_profile?.full_name || reader.name}
                      </h4>
                      {isUserReader(reader) && (
                        <Badge variant="default" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Reading: {reader.book}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(reader.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedReadersMap;
