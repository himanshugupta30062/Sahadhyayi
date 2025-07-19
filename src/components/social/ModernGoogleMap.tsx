
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users } from 'lucide-react';

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
}

const SAMPLE_READERS: Reader[] = [
  {
    id: '1',
    name: 'Himanshu',
    book: 'Sapiens',
    lat: 28.6139,
    lng: 77.2090
  },
  {
    id: '2', 
    name: 'Anjali',
    book: 'Atomic Habits',
    lat: 28.60,
    lng: 77.25
  },
  {
    id: '3',
    name: 'Ravi',
    book: 'Rich Dad Poor Dad',
    lat: 28.63,
    lng: 77.21
  }
];

export const ModernGoogleMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userMarker, setUserMarker] = useState<any>(null);


  const initializeMap = async () => {
    try {
      // Load Google Maps using importLibrary method
      const { Map } = await window.google.maps.importLibrary("maps") as any;
      const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as any;

      if (!mapRef.current) return;

      // Create map centered on New Delhi
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
            stylers: [{ color: '#e0f2fe' }]
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
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        mapId: 'DEMO_MAP_ID'
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow();

      // Add markers for sample readers
      SAMPLE_READERS.forEach((reader) => {
        // Create custom pin
        const pin = new PinElement({
          background: '#f97316',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          glyph: reader.name.charAt(0)
        });

        const marker = new AdvancedMarkerElement({
          map: mapInstance,
          position: { lat: reader.lat, lng: reader.lng },
          content: pin.element,
          title: reader.name
        });

        // Add click listener for info window
        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                📚 ${reader.name}
              </h3>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Currently reading: <br>
                <strong style="color: #f97316;">${reader.book}</strong>
              </p>
              <div style="margin-top: 8px; display: flex; align-items: center; gap: 4px;">
                <span style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; display: inline-block;"></span>
                <span style="font-size: 12px; color: #10b981;">Online now</span>
              </div>
            </div>
          `);
          infoWindow.open(mapInstance, marker);
        });
      });

      setMap(mapInstance);
      setIsLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      setIsLoading(false);
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!map) return;

        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        try {
          const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as any;

          // Remove existing user marker if it exists
          if (userMarker) {
            userMarker.map = null;
          }

          // Create user pin
          const userPin = new PinElement({
            background: '#10b981',
            borderColor: '#ffffff',
            glyphColor: '#ffffff',
            glyph: '👤',
            scale: 1.2
          });

          const newUserMarker = new AdvancedMarkerElement({
            map: map,
            position: { lat: userLat, lng: userLng },
            content: userPin.element,
            title: 'Your Location'
          });

          // Create info window for user
          const infoWindow = new window.google.maps.InfoWindow();
          newUserMarker.addListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                  📍 You
                </h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Currently reading: <br>
                  <strong style="color: #10b981;">The Alchemist</strong>
                </p>
                <div style="margin-top: 8px; display: flex; align-items: center; gap: 4px;">
                  <span style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; display: inline-block;"></span>
                  <span style="font-size: 12px; color: #10b981;">Your location</span>
                </div>
              </div>
            `);
            infoWindow.open(map, newUserMarker);
          });

          setUserMarker(newUserMarker);

          // Center map on user location
          map.setCenter({ lat: userLat, lng: userLng });
          map.setZoom(14);

        } catch (error) {
          console.error('Failed to add user marker:', error);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please allow location access and try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
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
        // Google Maps already loaded
        initializeMap();
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup if needed
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
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          📍 Readers Near You
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Discover fellow readers in your area and connect over shared book interests
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          ref={mapRef} 
          className="w-full h-[500px] rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          style={{ minHeight: '500px' }}
        />
        
        <div className="flex justify-center">
          <Button 
            onClick={shareLocation}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium"
          >
            <MapPin className="w-4 h-4" />
            📍 Share My Location
          </Button>
        </div>
        
        {/* Readers List */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            Active Readers ({SAMPLE_READERS.length})
          </h3>
          <div className="grid gap-3">
            {SAMPLE_READERS.map((reader) => (
              <div
                key={reader.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-700">
                      {reader.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reader.name}</p>
                    <p className="text-xs text-gray-600">
                      Reading: <span className="font-medium">{reader.book}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
