
import { useEffect, useRef, useState } from 'react';
import { createCustomMarker, createTooltipContent, createHoverTooltip, type MarkerConfig } from './MapMarkerUtils';

interface FriendsMapProps {
  friends: any[];
  friendsLoading: boolean;
  mapsLoaded: boolean;
  darkMapStyle: any[];
  userLocation?: { lat: number; lng: number } | null;
}

export const FriendsMap = ({ 
  friends, 
  friendsLoading, 
  mapsLoaded, 
  darkMapStyle,
  userLocation
}: FriendsMapProps) => {
  const friendsMapRef = useRef<HTMLDivElement>(null);
  const [friendsMap, setFriendsMap] = useState<any>(null);
  const [friendMarkers, setFriendMarkers] = useState<any[]>([]);
  const [infoWindows, setInfoWindows] = useState<any[]>([]);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(userLocation || null);

  useEffect(() => {
    if (!mapsLoaded || !window.google?.maps) return;

    if (!friendsMap && friendsMapRef.current) {
      const center = { lat: 20, lng: 0 };
      const map = new window.google.maps.Map(friendsMapRef.current, {
        center,
        zoom: 2,
        styles: darkMapStyle,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      setFriendsMap(map);

      // Center on user's location if available
      if (currentUserLocation) {
        map.setCenter(currentUserLocation);
        map.setZoom(8);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentUserLocation(userPos);
          map.setCenter(userPos);
          map.setZoom(8);
        });
      }
    }
  }, [mapsLoaded, friendsMap, darkMapStyle, currentUserLocation]);

  useEffect(() => {
    if (!friendsMap || !mapsLoaded || !window.google?.maps) return;

    // Clear existing markers and info windows
    friendMarkers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(infoWindow => infoWindow.close());
    
    const newMarkers: any[] = [];
    const newInfoWindows: any[] = [];

    // Add current user's location marker with Bitmoji style
    if (currentUserLocation) {
      const userMarkerConfig: MarkerConfig = {
        position: currentUserLocation,
        title: 'Your Location',
        isCurrentUser: true,
        userName: 'You',
        avatarUrl: undefined // This would come from user's bitmoji/avatar
      };

      const userMarkerIcon = createCustomMarker(userMarkerConfig, false);
      
      const userMarker = new window.google.maps.Marker({
        position: currentUserLocation,
        map: friendsMap,
        title: 'Your Location',
        icon: userMarkerIcon,
        zIndex: 1000,
      });

      // Enhanced tooltip for current user
      const userTooltipContent = createTooltipContent(userMarkerConfig, false);
      const userInfoWindow = new window.google.maps.InfoWindow({
        content: userTooltipContent,
        disableAutoPan: false,
        pixelOffset: new window.google.maps.Size(0, -10),
      });

      // Hover tooltip for current user
      let hoverTimeout: NodeJS.Timeout;
      userMarker.addListener('mouseover', () => {
        const hoverContent = createHoverTooltip(userMarkerConfig, false);
        const hoverInfoWindow = new window.google.maps.InfoWindow({
          content: hoverContent,
          disableAutoPan: true,
        });
        
        hoverInfoWindow.open(friendsMap, userMarker);
        
        hoverTimeout = setTimeout(() => {
          hoverInfoWindow.close();
        }, 3000);
      });

      userMarker.addListener('mouseout', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
      });

      userMarker.addListener('click', () => {
        newInfoWindows.forEach(iw => iw.close());
        userInfoWindow.open(friendsMap, userMarker);
      });

      newMarkers.push(userMarker);
      newInfoWindows.push(userInfoWindow);
    }

    const friendsList = Array.isArray(friends) ? friends : [];
    
    friendsList.forEach((friend: any, index: number) => {
      const profile = friend?.friend_profile;
      if (profile?.location_sharing && profile.location_lat != null && profile.location_lng != null) {
        const friendName = profile.full_name || profile.username || 'Friend';
        const avatarUrl = profile.profile_photo_url || profile.avatar_img_url;
        
        const friendMarkerConfig: MarkerConfig = {
          position: { lat: Number(profile.location_lat), lng: Number(profile.location_lng) },
          title: friendName,
          isCurrentUser: false,
          avatarUrl,
          userName: friendName,
          isFriend: true
        };

        const friendMarkerIcon = createCustomMarker(friendMarkerConfig, false);

        const marker = new window.google.maps.Marker({
          position: { lat: Number(profile.location_lat), lng: Number(profile.location_lng) },
          map: friendsMap,
          title: friendName,
          icon: friendMarkerIcon,
          animation: window.google.maps.Animation.DROP,
          zIndex: index + 1,
        });

        // Enhanced tooltip content for friends
        const tooltipContent = createTooltipContent(friendMarkerConfig, false);
        const infoWindow = new window.google.maps.InfoWindow({
          content: tooltipContent,
          disableAutoPan: false,
          pixelOffset: new window.google.maps.Size(0, -10),
        });

        // Enhanced hover effects for friends
        let hoverTimeout: NodeJS.Timeout;
        marker.addListener('mouseover', () => {
          const currentIcon = marker.getIcon();
          if (currentIcon && typeof currentIcon === 'object' && 'scaledSize' in currentIcon) {
            const hoverIcon = { ...currentIcon };
            hoverIcon.scaledSize = avatarUrl ? 
              new window.google.maps.Size(70, 70) : 
              new window.google.maps.Size(18, 18);
            if (avatarUrl) {
              hoverIcon.anchor = new window.google.maps.Point(35, 35);
            }
            marker.setIcon(hoverIcon);
          } else if (currentIcon && typeof currentIcon === 'object' && 'scale' in currentIcon) {
            const hoverIcon = { ...currentIcon };
            hoverIcon.scale = 18;
            marker.setIcon(hoverIcon);
          }
          
          // Show hover tooltip
          const hoverContent = createHoverTooltip(friendMarkerConfig, false);
          const hoverInfoWindow = new window.google.maps.InfoWindow({
            content: hoverContent,
            disableAutoPan: true,
          });
          
          hoverInfoWindow.open(friendsMap, marker);
          
          hoverTimeout = setTimeout(() => {
            hoverInfoWindow.close();
          }, 3000);
        });

        marker.addListener('mouseout', () => {
          if (hoverTimeout) clearTimeout(hoverTimeout);
          
          const currentIcon = marker.getIcon();
          if (currentIcon && typeof currentIcon === 'object' && 'scaledSize' in currentIcon) {
            const originalIcon = { ...currentIcon };
            originalIcon.scaledSize = avatarUrl ? 
              new window.google.maps.Size(50, 50) : 
              new window.google.maps.Size(15, 15);
            if (avatarUrl) {
              originalIcon.anchor = new window.google.maps.Point(25, 25);
            }
            marker.setIcon(originalIcon);
          } else if (currentIcon && typeof currentIcon === 'object' && 'scale' in currentIcon) {
            const originalIcon = { ...currentIcon };
            originalIcon.scale = 15;
            marker.setIcon(originalIcon);
          }
        });

        marker.addListener('click', () => {
          newInfoWindows.forEach(iw => iw.close());
          infoWindow.open(friendsMap, marker);
        });

        newMarkers.push(marker);
        newInfoWindows.push(infoWindow);
      }
    });

    setFriendMarkers(newMarkers);
    setInfoWindows(newInfoWindows);

    // Fit bounds if multiple friends
    if (newMarkers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!);
        }
      });
      friendsMap.fitBounds(bounds);
    }

    // Add global functions for friend interactions
    (window as any).openChat = (friendId: string) => {
      console.log('Opening chat with friend:', friendId);
    };

    (window as any).viewFriendProfile = (friendId: string) => {
      console.log('Viewing friend profile:', friendId);
    };

  }, [friends, friendsMap, mapsLoaded, friendMarkers, infoWindows, currentUserLocation]);

  if (friendsLoading) {
    return (
      <div className="h-[500px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading friends map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={friendsMapRef} style={{ height: '500px' }} className="rounded-lg shadow-lg border border-gray-200" />
      
      {friends.length === 0 && (
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">👥</span>
          </div>
          <p className="text-lg font-medium mb-2">No friends sharing location</p>
          <p className="text-sm">Invite friends to share their reading locations!</p>
        </div>
      )}
    </div>
  );
};
