import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, User, MessageCircle } from 'lucide-react';

// Declare google maps types
declare global {
  interface Window {
    google: any;
  }
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  currentBook?: string;
  bitmoji?: string; // Bitmoji avatar URL
  lastSeen?: string;
}

interface GoogleMapsContainerProps {
  friends: Friend[];
  onFriendClick: (friend: any) => void;
  userLocation: { lat: number; lng: number };
}

export const GoogleMapsContainer: React.FC<GoogleMapsContainerProps> = ({
  friends,
  onFriendClick,
  userLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || isLoaded) return;

      try {
        // Load Google Maps API
        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
          script.async = true;
          script.defer = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Initialize map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: userLocation,
          zoom: 12,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry.fill',
              stylers: [{ color: '#f3f4f6' }]
            },
            {
              featureType: 'water',
              elementType: 'all',
              stylers: [{ color: '#dbeafe' }]
            }
          ]
        });

        setMap(mapInstance);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setIsLoaded(false);
      }
    };

    initMap();
  }, [userLocation, isLoaded]);

  // Add markers for friends
  useEffect(() => {
    if (!map || !friends.length) return;

    // Clear existing markers
    // (In a real app, you'd keep track of markers to remove them)

    // Add user marker
    new window.google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'You',
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
            <circle cx="16" cy="16" r="4" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    // Add friend markers
    friends.forEach((friend) => {
      const marker = new window.google.maps.Marker({
        position: { lat: friend.lat, lng: friend.lng },
        map: map,
        title: friend.name,
        icon: {
          url: friend.bitmoji || friend.avatar || 'data:image/svg+xml,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#f97316" stroke="white" stroke-width="3"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                ${friend.name.charAt(0)}
              </text>
              ${friend.isOnline ? '<circle cx="32" cy="8" r="6" fill="#10b981" stroke="white" stroke-width="2"/>' : ''}
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });

      marker.addListener('click', () => {
        onFriendClick(friend);
      });
    });
  }, [map, friends, userLocation, onFriendClick]);

  if (!isLoaded) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Real-Time Reading Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-80 border overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
              <p className="text-gray-600">Loading interactive map...</p>
              <p className="text-sm text-gray-500 mt-2">Please configure Google Maps API key</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Real-Time Reading Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-80 rounded-lg border overflow-hidden"
          style={{ minHeight: '320px' }}
        />
        
        {/* Friends List */}
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Friends on Map ({friends.length})</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => onFriendClick(friend)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={friend.bitmoji || friend.avatar} />
                    <AvatarFallback className="text-sm bg-orange-100 text-orange-700">
                      {friend.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                    <p className="text-xs text-gray-500">
                      {friend.isOnline ? 'Online' : 'Offline'}
                      {friend.currentBook && ` • Reading ${friend.currentBook}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {friend.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
