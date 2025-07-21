
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

  useEffect(() => {
    if (!mapsLoaded || !window.google?.maps) return;

    if (!friendsMap && friendsMapRef.current) {
      const center = { lat: 20, lng: 0 };
      const map = new window.google.maps.Map(friendsMapRef.current, {
        center,
        zoom: 2,
        styles: darkMapStyle
      });
      setFriendsMap(map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          map.setZoom(8);
        });
      }
    }
  }, [mapsLoaded, friendsMap, darkMapStyle]);

  useEffect(() => {
    if (!friendsMap || !mapsLoaded || !window.google?.maps) return;

    // Clear existing markers
    friendMarkers.forEach(marker => marker.setMap(null));
    
    const newMarkers: any[] = [];

    const friendsList = Array.isArray(friends) ? friends : [];
    
    friendsList.forEach((friend: any) => {
      const profile = friend?.friend_profile;
      if (profile?.location_sharing && profile.location_lat != null && profile.location_lng != null) {
        const marker = new window.google.maps.Marker({
          position: { lat: Number(profile.location_lat), lng: Number(profile.location_lng) },
          map: friendsMap,
          title: profile.full_name
        });
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div class="p-1">${profile.full_name}</div>`
        });
        marker.addListener('click', () => infoWindow.open(friendsMap, marker));
        newMarkers.push(marker);
      }
    });

    setFriendMarkers(newMarkers);
  }, [friends, friendsMap, mapsLoaded, friendMarkers]);

  if (friendsLoading) {
    return <div className="h-[500px] flex items-center justify-center">Loading...</div>;
  }

  return <div ref={friendsMapRef} style={{ height: '500px' }} />;
};
