
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin } from 'lucide-react';

// Declare google maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Reader {
  id: string;
  name: string;
  avatar?: string;
  lat: number;
  lng: number;
  currentBook: string;
  isOnline: boolean;
}

interface GoogleMapsContainerProps {
  friends: any[];
  onFriendClick: (friend: any) => void;
  userLocation: { lat: number; lng: number };
}

// Sample readers data - centralized for easy editing
const SAMPLE_READERS: Reader[] = [
  {
    id: '1',
    name: 'Anjali',
    lat: 28.60,
    lng: 77.25,
    currentBook: 'Atomic Habits',
    isOnline: true
  },
  {
    id: '2', 
    name: 'Ravi',
    lat: 28.63,
    lng: 77.21,
    currentBook: 'Rich Dad Poor Dad',
    isOnline: true
  },
  {
    id: '3',
    name: 'Himanshu', 
    lat: 28.6139,
    lng: 77.2090,
    currentBook: 'Sapiens',
    isOnline: true
  }
];

export const GoogleMapsContainer: React.FC<GoogleMapsContainerProps> = ({
  friends,
  onFriendClick,
  userLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;

      try {
        // Center on New Delhi
        const newDelhiCenter = { lat: 28.6139, lng: 77.2090 };
        
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: newDelhiCenter,
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
          fullscreenControl: false
        });

        // Add markers for sample readers
        SAMPLE_READERS.forEach((reader) => {
          const marker = new window.google.maps.Marker({
            position: { lat: reader.lat, lng: reader.lng },
            map: mapInstance,
            title: reader.name,
            icon: {
              url: `data:image/svg+xml,${encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#f97316" stroke="white" stroke-width="3"/>
                  <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                    ${reader.name.charAt(0)}
                  </text>
                  ${reader.isOnline ? '<circle cx="32" cy="8" r="6" fill="#10b981" stroke="white" stroke-width="2"/>' : ''}
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20)
            }
          });

          // Create info window for each marker
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                  ${reader.name}
                </h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Currently reading: <strong>${reader.currentBook}</strong>
                </p>
                <div style="margin-top: 8px;">
                  <span style="display: inline-block; width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; margin-right: 6px;"></span>
                  <span style="font-size: 12px; color: #10b981;">Online</span>
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
            // Also trigger the onFriendClick callback
            onFriendClick(reader);
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

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDPBJ3hdp-aILWTyyAJQtDku30yiLA4P2Y'}&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Set the callback function on window
      window.initMap = initMap;
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    } else {
      // Google Maps is already loaded
      initMap();
    }

    // Cleanup function
    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, [onFriendClick]);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            Readers Near You 📚
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
            Readers Near You 📚
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
          Readers Near You 📚
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Discover fellow readers in your area and connect over shared book interests
        </p>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-[500px] rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          style={{ minHeight: '500px' }}
        />
        
        {/* Readers List */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600" />
            Active Readers ({SAMPLE_READERS.length})
          </h3>
          <div className="grid gap-3">
            {SAMPLE_READERS.map((reader) => (
              <div
                key={reader.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
                onClick={() => onFriendClick(reader)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={reader.avatar} />
                    <AvatarFallback className="text-sm bg-orange-100 text-orange-700 font-medium">
                      {reader.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reader.name}</p>
                    <p className="text-xs text-gray-600">
                      Reading: <span className="font-medium">{reader.currentBook}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reader.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
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
