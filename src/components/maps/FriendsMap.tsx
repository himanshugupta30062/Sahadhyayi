
import { useEffect, useRef, useState } from 'react';

interface FriendsMapProps {
  friends: any[];
  friendsLoading: boolean;
  mapsLoaded: boolean;
  darkMapStyle: any[];
}

export const FriendsMap = ({ 
  friends, 
  friendsLoading, 
  mapsLoaded, 
  darkMapStyle 
}: FriendsMapProps) => {
  const friendsMapRef = useRef<HTMLDivElement>(null);
  const [friendsMap, setFriendsMap] = useState<any>(null);
  const [friendMarkers, setFriendMarkers] = useState<any[]>([]);
  const [infoWindows, setInfoWindows] = useState<any[]>([]);

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
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.setCenter(userLocation);
          map.setZoom(8);
          
          // Add user's location marker
          new window.google.maps.Marker({
            position: userLocation,
            map: map,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#3B82F6" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20),
            },
          });
        });
      }
    }
  }, [mapsLoaded, friendsMap, darkMapStyle]);

  useEffect(() => {
    if (!friendsMap || !mapsLoaded || !window.google?.maps) return;

    // Clear existing markers and info windows
    friendMarkers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(infoWindow => infoWindow.close());
    
    const newMarkers: any[] = [];
    const newInfoWindows: any[] = [];

    const friendsList = Array.isArray(friends) ? friends : [];
    
    friendsList.forEach((friend: any, index: number) => {
      const profile = friend?.friend_profile;
      if (profile?.location_sharing && profile.location_lat != null && profile.location_lng != null) {
        const friendName = profile.full_name || profile.username || 'Friend';
        const avatarUrl = profile.profile_photo_url;
        
        // Create custom marker with friend's avatar
        const markerIcon = avatarUrl ? {
          url: avatarUrl,
          scaledSize: new window.google.maps.Size(50, 50),
          anchor: new window.google.maps.Point(25, 50),
          origin: new window.google.maps.Point(0, 0),
        } : {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#10B981" stroke="white" stroke-width="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40),
        };

        const marker = new window.google.maps.Marker({
          position: { lat: Number(profile.location_lat), lng: Number(profile.location_lng) },
          map: friendsMap,
          title: friendName,
          icon: markerIcon,
          animation: window.google.maps.Animation.DROP,
          zIndex: index + 1,
        });

        // Enhanced info window for friends
        const infoWindowContent = `
          <div style="padding: 12px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              ${avatarUrl ? 
                `<img src="${avatarUrl}" alt="${friendName}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 3px solid #10B981;">` : 
                `<div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #10B981, #34D399); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">${friendName.charAt(0).toUpperCase()}</div>`
              }
              <div>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1F2937;">${friendName}</h3>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #10B981; font-weight: 500;">🟢 Online</p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-bottom: 8px;">
              <p style="margin: 0; font-size: 13px; color: #6B7280;">
                📍 Last seen at this location
              </p>
            </div>
            
            <div style="display: flex; gap: 8px;">
              <button onclick="openChat('${friend.user_id}')" style="
                background: #10B981; 
                color: white; 
                border: none; 
                padding: 8px 12px; 
                border-radius: 6px; 
                font-size: 12px; 
                font-weight: 500; 
                cursor: pointer;
                flex: 1;
                transition: background 0.2s;
              " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10B981'">
                💬 Chat
              </button>
              <button onclick="viewFriendProfile('${friend.user_id}')" style="
                background: transparent; 
                color: #10B981; 
                border: 1px solid #10B981; 
                padding: 8px 12px; 
                border-radius: 6px; 
                font-size: 12px; 
                font-weight: 500; 
                cursor: pointer;
                flex: 1;
                transition: all 0.2s;
              " onmouseover="this.style.background='#ECFDF5'" onmouseout="this.style.background='transparent'">
                👤 Profile
              </button>
            </div>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoWindowContent,
          disableAutoPan: false,
          pixelOffset: new window.google.maps.Size(0, -10),
        });

        // Enhanced hover effects for friends
        marker.addListener('mouseover', () => {
          const currentIcon = marker.getIcon();
          if (currentIcon && typeof currentIcon === 'object' && 'scaledSize' in currentIcon) {
            const hoverIcon = { ...currentIcon };
            hoverIcon.scaledSize = avatarUrl ? 
              new window.google.maps.Size(60, 60) : 
              new window.google.maps.Size(50, 50);
            hoverIcon.anchor = avatarUrl ? 
              new window.google.maps.Point(30, 60) : 
              new window.google.maps.Point(25, 50);
            marker.setIcon(hoverIcon);
          }
          
          // Quick preview for friends
          const previewContent = `
            <div style="padding: 8px; font-family: system-ui; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">👋 ${friendName}</div>
              <div style="font-size: 11px; color: #10B981;">🟢 Your friend is here</div>
            </div>
          `;
          
          const hoverInfoWindow = new window.google.maps.InfoWindow({
            content: previewContent,
            disableAutoPan: true,
          });
          
          hoverInfoWindow.open(friendsMap, marker);
          
          setTimeout(() => {
            hoverInfoWindow.close();
          }, 2000);
        });

        marker.addListener('mouseout', () => {
          const currentIcon = marker.getIcon();
          if (currentIcon && typeof currentIcon === 'object' && 'scaledSize' in currentIcon) {
            const originalIcon = { ...currentIcon };
            originalIcon.scaledSize = avatarUrl ? 
              new window.google.maps.Size(50, 50) : 
              new window.google.maps.Size(40, 40);
            originalIcon.anchor = avatarUrl ? 
              new window.google.maps.Point(25, 50) : 
              new window.google.maps.Point(20, 40);
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

  }, [friends, friendsMap, mapsLoaded, friendMarkers, infoWindows]);

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
