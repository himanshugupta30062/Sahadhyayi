import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Users, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Declare global types for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface Reader {
  id: string;
  name: string;
  book: string;
  lat: number;
  lng: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const ModernGoogleMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentBook, setCurrentBook] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Load readers from Supabase with real-time updates
  useEffect(() => {
    const fetchReaders = async () => {
      const { data, error } = await supabase
        .from('readers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching readers:', error);
        return;
      }

      setReaders(data || []);
      
      // Update markers when readers change
      if (map && isLoaded) {
        updateMarkersOnMap(data || []);
      }
    };

    fetchReaders();

    // Set up real-time subscription
    const channel = supabase
      .channel('readers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'readers' }, 
        () => {
          fetchReaders(); // Refetch data when any change occurs
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [map, isLoaded]);

  const updateMarkersOnMap = async (readersData: Reader[]) => {
    try {
      const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as any;
      
      // Clear existing markers
      markers.forEach(marker => {
        marker.map = null;
      });
      
      const newMarkers: any[] = [];
      const infoWindow = new window.google.maps.InfoWindow();

      // Add markers for each reader
      readersData.forEach((reader) => {
        const pin = new PinElement({
          background: '#f97316',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          glyph: reader.name.charAt(0),
          scale: 1.0
        });

        const marker = new AdvancedMarkerElement({
          map: map,
          position: { lat: Number(reader.lat), lng: Number(reader.lng) },
          content: pin.element,
          title: reader.name
        });

        marker.addListener('click', () => {
          const timeAgo = reader.created_at ? 
            new Date(reader.created_at).toLocaleString() : 
            'Just now';
          
          infoWindow.setContent(`
            <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; max-width: 220px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <div style="width: 32px; height: 32px; background: #f97316; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${reader.name.charAt(0)}
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                    ${reader.name}
                  </h3>
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">${timeAgo}</p>
                </div>
              </div>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                📖 Currently reading: <br>
                <strong style="color: #f97316;">${reader.book}</strong>
              </p>
              <div style="margin-top: 12px; display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; display: inline-block;"></span>
                <span style="font-size: 12px; color: #10b981; font-weight: 500;">Reading now</span>
              </div>
            </div>
          `);
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error('Failed to update markers:', error);
    }
  };

  const initializeMap = async () => {
    try {
      const { Map } = await window.google.maps.importLibrary("maps") as any;
      
      if (!mapRef.current) return;

      const mapInstance = new Map(mapRef.current, {
        center: { lat: 28.6139, lng: 77.2090 },
        zoom: 12,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f8fafc' }]
          },
          {
            featureType: 'water',
            elementType: 'all',
            stylers: [{ color: '#dbeafe' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        mapId: 'DEMO_MAP_ID',
        gestureHandling: 'cooperative'
      });

      setMap(mapInstance);
      setIsLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      setIsLoading(false);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsDialogOpen(true);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to retrieve your location. Please allow location access and try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSaveLocation = async () => {
    if (!userLocation || !userName.trim() || !currentBook.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('readers')
        .insert({
          name: userName.trim(),
          book: currentBook.trim(),
          lat: userLocation.lat,
          lng: userLocation.lng,
          user_id: user?.id || null
        });

      if (error) {
        throw error;
      }

      toast.success('📍 Your location has been shared with other readers!');
      
      // Center map on user location
      if (map) {
        map.setCenter(userLocation);
        map.setZoom(14);
      }

      // Reset form and close dialog
      setUserName('');
      setCurrentBook('');
      setUserLocation(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to share location. Please try again.');
    }
  };

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDPBJ3hdp-aILWTyyAJQtDku30yiLA4P2Y&libraries=marker&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('Google Maps API loaded successfully');
          initializeMap();
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup markers
      markers.forEach(marker => {
        if (marker.map) marker.map = null;
      });
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            📍 Readers Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl h-[500px] border overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-pulse" />
              <p className="text-gray-600 font-medium">Loading interactive map...</p>
              <p className="text-sm text-gray-500 mt-2">Connecting to Google Maps & Supabase</p>
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
            📍 Readers Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-red-50 to-orange-50 rounded-xl h-[500px] border overflow-hidden flex items-center justify-center">
            <div className="text-center max-w-md">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Error</h3>
              <p className="text-gray-600 mb-4">
                Unable to load the interactive map. Please check your internet connection and try again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          📍 Readers Near You
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Discover fellow readers in your area and connect over shared book interests - Snapchat style!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          ref={mapRef} 
          className="w-full h-[500px] rounded-xl border border-gray-200 overflow-hidden shadow-lg"
          style={{ minHeight: '500px' }}
        />
        
        <div className="flex justify-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleShareLocation}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl flex items-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                📍 Share My Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-center">
                  📍 Share Your Reading Location
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Currently Reading</label>
                  <Input
                    placeholder="What book are you reading?"
                    value={currentBook}
                    onChange={(e) => setCurrentBook(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveLocation}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Share Location
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Live Readers List */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            Live Readers ({readers.length})
          </h3>
          {readers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No readers are currently sharing their location.</p>
              <p className="text-xs mt-1">Be the first to share your reading spot!</p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {readers.map((reader) => (
                <div
                  key={reader.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 border border-gray-100 hover:border-orange-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-sm font-bold text-white">
                        {reader.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{reader.name}</p>
                      <p className="text-xs text-gray-600">
                        📖 <span className="font-medium">{reader.book}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {reader.created_at ? 
                          new Date(reader.created_at).toLocaleString() : 
                          'Just shared'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};