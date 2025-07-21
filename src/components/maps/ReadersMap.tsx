
import { useEffect, useRef, useState } from 'react';

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
  darkMapStyle: any[];
  selectedBook: BookOption | null;
}

export const ReadersMap = ({ readers, readersLoading, readersError, mapsLoaded, darkMapStyle, selectedBook }: ReadersMapProps) => {
  const readerMapRef = useRef<HTMLDivElement>(null);
  const [readerMap, setReaderMap] = useState<any>(null);
  const [readerMarkers, setReaderMarkers] = useState<any[]>([]);
  const [infoWindows, setInfoWindows] = useState<any[]>([]);

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

    // Try to center map on user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(userLocation);
          map.setZoom(8);
          
          // Add user's current location marker
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
        },
        () => {
          // Fallback to default center if geolocation fails
        }
      );
    }
  }, [mapsLoaded, darkMapStyle]);

  useEffect(() => {
    if (!readerMap || !window.google?.maps || !readers.length) return;

    // Clear existing markers and info windows
    readerMarkers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(infoWindow => infoWindow.close());
    setReaderMarkers([]);
    setInfoWindows([]);

    const newMarkers: any[] = [];
    const newInfoWindows: any[] = [];

    // Add new markers with enhanced hover effects
    readers.forEach((reader, index) => {
      const displayName = reader.profiles?.full_name || reader.profiles?.username || 'Anonymous Reader';
      const avatarUrl = reader.profiles?.profile_photo_url;
      const bookStatus = reader.book_status || 'Reading';
      const distance = reader.distance ? `${reader.distance.toFixed(1)} km away` : 'Distance unknown';
      
      // Create custom marker with user avatar or default icon
      const markerIcon = avatarUrl ? {
        url: avatarUrl,
        scaledSize: new window.google.maps.Size(50, 50),
        anchor: new window.google.maps.Point(25, 50),
        origin: new window.google.maps.Point(0, 0),
        labelOrigin: new window.google.maps.Point(25, -10)
      } : {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#F97316" stroke="white" stroke-width="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      };

      const marker = new window.google.maps.Marker({
        position: {
          lat: reader.latitude,
          lng: reader.longitude,
        },
        map: readerMap,
        title: displayName,
        icon: markerIcon,
        animation: window.google.maps.Animation.DROP,
        zIndex: index + 1,
      });

      // Enhanced info window content
      const infoWindowContent = `
        <div style="padding: 12px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="${displayName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #F97316;">` : 
              `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #F97316, #FB923C); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">${displayName.charAt(0).toUpperCase()}</div>`
            }
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937;">${displayName}</h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #6B7280;">${distance}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 12px; padding: 2px 8px; background: #FEF3C7; color: #92400E; border-radius: 12px; font-weight: 500;">${bookStatus}</span>
            </div>
            
            <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 500;">
              📖 Reading: ${selectedBook?.title || 'Unknown Book'}
            </p>
            
            ${selectedBook?.author ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">by ${selectedBook.author}</p>` : ''}
          </div>
          
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button onclick="sendFriendRequest('${reader.user_id}')" style="
              background: #F97316; 
              color: white; 
              border: none; 
              padding: 6px 12px; 
              border-radius: 6px; 
              font-size: 12px; 
              font-weight: 500; 
              cursor: pointer;
              transition: background 0.2s;
            " onmouseover="this.style.background='#EA580C'" onmouseout="this.style.background='#F97316'">
              👋 Connect
            </button>
            <button onclick="viewProfile('${reader.user_id}')" style="
              background: transparent; 
              color: #F97316; 
              border: 1px solid #F97316; 
              padding: 6px 12px; 
              border-radius: 6px; 
              font-size: 12px; 
              font-weight: 500; 
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#FEF3C7'" onmouseout="this.style.background='transparent'">
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

      // Enhanced hover effects
      marker.addListener('mouseover', () => {
        // Scale up the marker on hover
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
        
        // Show a preview tooltip with enhanced user information
        const previewContent = `
          <div style="padding: 12px; font-family: system-ui; background: white; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <img src="${avatarUrl}" alt="${displayName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #F3F4F6;" 
                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTEzIDEzdi0xYTIgMiAwIDAgMC0yLTJINWEyIDIgMCAwIDAtMiAydjEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSI4IiBjeT0iNSIgcj0iMiIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4K'">
              <div style="font-weight: 700; color: #1F2937; font-size: 14px;">${displayName}</div>
            </div>
            <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 8px; border-radius: 6px; margin-bottom: 6px;">
              <div style="font-size: 12px; color: #92400E; font-weight: 600; margin-bottom: 2px;">📖 Currently Reading:</div>
              <div style="font-size: 11px; color: #451A03; font-weight: 500;">${selectedBook?.title || 'Unknown Book'}</div>
              ${selectedBook?.author ? `<div style="font-size: 10px; color: #78716C; margin-top: 1px;">by ${selectedBook.author}</div>` : ''}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 11px; color: #6B7280; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 4px; height: 4px; background: #10B981; border-radius: 50%;"></span>
                ${distance}
              </div>
              <div style="font-size: 10px; color: #9CA3AF; background: #F9FAFB; padding: 2px 6px; border-radius: 4px;">
                Click for details
              </div>
            </div>
          </div>`;
        
        const hoverInfoWindow = new window.google.maps.InfoWindow({
          content: previewContent,
          disableAutoPan: true,
        });
        
        hoverInfoWindow.open(readerMap, marker);
        
        // Close hover info window after 2 seconds
        setTimeout(() => {
          hoverInfoWindow.close();
        }, 2000);
      });

      marker.addListener('mouseout', () => {
        // Scale back to original size
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
        // Close all other info windows
        newInfoWindows.forEach(iw => iw.close());
        infoWindow.open(readerMap, marker);
      });

      newMarkers.push(marker);
      newInfoWindows.push(infoWindow);
    });

    setReaderMarkers(newMarkers);
    setInfoWindows(newInfoWindows);

    // Fit map to show all markers if there are multiple readers
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
      // This will be handled by the parent component
    };

    (window as any).viewProfile = (userId: string) => {
      console.log('Viewing profile:', userId);
      // This will be handled by the parent component
    };

  }, [readers, readerMap, selectedBook]);

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
