import { useEffect, useRef, useState } from 'react';
import { createCustomMarker, createTooltipContent, createHoverTooltip, type MarkerConfig } from './MapMarkerUtils';

interface ReaderLocation {
  latitude: number;
  longitude: number;
  user_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
    profile_photo_url?: string | null;
  };
  book_status?: string;
  distance?: number;
}

interface BookOption {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
}

interface ReadersMapProps {
  readers: ReaderLocation[];
  readersLoading: boolean;
  readersError: string | null;
  mapsLoaded: boolean;
  darkMapStyle: google.maps.MapTypeStyle[];
  selectedBook: BookOption | null;
  userLocation?: { lat: number; lng: number } | null;
}

export const ReadersMap = ({ 
  readers, 
  readersLoading, 
  readersError, 
  mapsLoaded, 
  darkMapStyle, 
  selectedBook,
  userLocation
}: ReadersMapProps) => {
  const readerMapRef = useRef<HTMLDivElement>(null);
  const [readerMap, setReaderMap] = useState<google.maps.Map | null>(null);
  const [readerMarkers, setReaderMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindows, setInfoWindows] = useState<google.maps.InfoWindow[]>([]);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(userLocation || null);

  useEffect(() => {
    if (!mapsLoaded || !readerMapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(readerMapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      styles: darkMapStyle,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setReaderMap(map);

    // Try to get user's location if not provided
    if (!currentUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentUserLocation(userPos);
          map.setCenter(userPos);
          map.setZoom(8);
        },
        () => {
          // Fallback to default center if geolocation fails
        }
      );
    } else if (currentUserLocation) {
      map.setCenter(currentUserLocation);
      map.setZoom(8);
    }
  }, [mapsLoaded, darkMapStyle, currentUserLocation]);

  useEffect(() => {
    if (!readerMap || !window.google?.maps) return;

    // Clear existing markers and info windows
    readerMarkers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(infoWindow => infoWindow.close());
    setReaderMarkers([]);
    setInfoWindows([]);

    const newMarkers: any[] = [];
    const newInfoWindows: any[] = [];

    // Add current user's location marker if available
    if (currentUserLocation) {
      const userMarkerConfig: MarkerConfig = {
        position: currentUserLocation,
        title: 'Your Location',
        isCurrentUser: true,
        userName: 'You',
        bookTitle: selectedBook?.title
      };

      const userMarkerIcon = createCustomMarker(userMarkerConfig, true);
      
      const userMarker = new window.google.maps.Marker({
        position: currentUserLocation,
        map: readerMap,
        title: 'Your Location',
        icon: userMarkerIcon,
        zIndex: 1000,
      });

      // Enhanced tooltip for current user
      const userTooltipContent = createTooltipContent(userMarkerConfig, true);
      const userInfoWindow = new window.google.maps.InfoWindow({
        content: userTooltipContent,
        disableAutoPan: false,
        pixelOffset: new window.google.maps.Size(0, -10),
      });

      // Hover tooltip for current user
      let hoverTimeout: NodeJS.Timeout;
      userMarker.addListener('mouseover', () => {
        const hoverContent = createHoverTooltip(userMarkerConfig, true);
        const hoverInfoWindow = new window.google.maps.InfoWindow({
          content: hoverContent,
          disableAutoPan: true,
        });
        
        hoverInfoWindow.open(readerMap, userMarker);
        
        hoverTimeout = setTimeout(() => {
          hoverInfoWindow.close();
        }, 3000);
      });

      userMarker.addListener('mouseout', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
      });

      userMarker.addListener('click', () => {
        newInfoWindows.forEach(iw => iw.close());
        userInfoWindow.open(readerMap, userMarker);
      });

      newMarkers.push(userMarker);
      newInfoWindows.push(userInfoWindow);
    }

    // Add readers markers with enhanced tooltips
    readers.forEach((reader, index) => {
      const displayName = reader.profiles?.full_name || reader.profiles?.username || 'Anonymous Reader';
      const avatarUrl = reader.profiles?.profile_photo_url;
      const bookStatus = reader.book_status || 'Reading';
      const distance = reader.distance;
      
      const readerMarkerConfig: MarkerConfig = {
        position: { lat: reader.latitude, lng: reader.longitude },
        title: displayName,
        isCurrentUser: false,
        avatarUrl,
        userName: displayName,
        distance,
        bookTitle: selectedBook?.title,
        isFriend: false // This would need to be determined based on friends list
      };

      const readerMarkerIcon = createCustomMarker(readerMarkerConfig, true);

      const marker = new window.google.maps.Marker({
        position: { lat: reader.latitude, lng: reader.longitude },
        map: readerMap,
        title: displayName,
        icon: readerMarkerIcon,
        animation: window.google.maps.Animation.DROP,
        zIndex: index + 1,
      });

      // Enhanced tooltip content
      const tooltipContent = createTooltipContent(readerMarkerConfig, true);
      const infoWindow = new window.google.maps.InfoWindow({
        content: tooltipContent,
        disableAutoPan: false,
        pixelOffset: new window.google.maps.Size(0, -10),
      });

      // Enhanced hover effects with proper tooltips
      let hoverTimeout: NodeJS.Timeout;
      marker.addListener('mouseover', () => {
        // Scale up the marker on hover
        const currentIcon = marker.getIcon();
        if (currentIcon && typeof currentIcon === 'object' && 'scaledSize' in currentIcon) {
          const hoverIcon = { ...currentIcon };
          hoverIcon.scaledSize = avatarUrl ? 
            new window.google.maps.Size(60, 60) : 
            new window.google.maps.Size(18, 18);
          if (avatarUrl) {
            hoverIcon.anchor = new window.google.maps.Point(30, 30);
          }
          marker.setIcon(hoverIcon);
        } else if (currentIcon && typeof currentIcon === 'object' && 'scale' in currentIcon) {
          const hoverIcon = { ...currentIcon };
          hoverIcon.scale = 18;
          marker.setIcon(hoverIcon);
        }
        
        // Show hover tooltip
        const hoverContent = createHoverTooltip(readerMarkerConfig, true);
        const hoverInfoWindow = new window.google.maps.InfoWindow({
          content: hoverContent,
          disableAutoPan: true,
        });
        
        hoverInfoWindow.open(readerMap, marker);
        
        hoverTimeout = setTimeout(() => {
          hoverInfoWindow.close();
        }, 3000);
      });

      marker.addListener('mouseout', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        
        // Scale back to original size
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
        // Close all other info windows
        newInfoWindows.forEach(iw => iw.close());
        infoWindow.open(readerMap, marker);
      });

      newMarkers.push(marker);
      newInfoWindows.push(infoWindow);
    });

    setReaderMarkers(newMarkers);
    setInfoWindows(newInfoWindows);

    // Fit map to show all markers if there are multiple
    if (newMarkers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!);
        }
      });
      readerMap.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(readerMap, 'idle', () => {
        if (readerMap.getZoom() > 15) readerMap.setZoom(15);
        window.google.maps.event.removeListener(listener);
      });
    }

    // Add global functions for info window buttons
    (window as any).sendFriendRequest = (userId: string) => {
      console.log('Sending friend request to:', userId);
    };

    (window as any).viewProfile = (userId: string) => {
      console.log('Viewing profile:', userId);
    };

  }, [readers, readerMap, selectedBook, currentUserLocation]);

  if (readersLoading || !mapsLoaded) {
    return (
      <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading readers map...</p>
        </div>
      </div>
    );
  }

  if (!selectedBook) {
    return (
      <div className="h-96 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg flex items-center justify-center border border-orange-200">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-lg font-medium mb-2 text-gray-800">Select a book to view readers</p>
          <p className="text-sm text-gray-600">Choose a book from your bookshelf to see who else is reading it nearby</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={readerMapRef} className="h-96 w-full rounded-lg shadow-lg border border-gray-200" />
      
      {readersError && (
        <div className="text-center text-red-600 py-4 bg-red-50 rounded-lg border border-red-200">
          <p className="font-medium">Unable to load readers</p>
          <p className="text-sm">{readersError}</p>
        </div>
      )}
      
      {!readersError && readers.length === 0 && (
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🔍</span>
          </div>
          <p className="text-lg font-medium mb-2">No readers found nearby</p>
          <p className="text-sm">Be the first to share your location for "{selectedBook.title}"</p>
        </div>
      )}
      
      {readers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="font-medium text-gray-800">
                Found {readers.length} reader{readers.length === 1 ? '' : 's'} nearby
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Reading "{selectedBook.title}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
