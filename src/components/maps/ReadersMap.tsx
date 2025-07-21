import { useEffect, useRef, useState } from 'react';

interface ReaderLocation {
  latitude: number;
  longitude: number;
  user_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
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

  useEffect(() => {
    if (!mapsLoaded || !readerMapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(readerMapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      styles: darkMapStyle,
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
        },
        () => {
          // Fallback to default center if geolocation fails
        }
      );
    }
  }, [mapsLoaded, darkMapStyle]);

  useEffect(() => {
    if (!readerMap || !window.google?.maps || !readers.length) return;

    // Clear existing markers
    readerMarkers.forEach(marker => marker.setMap(null));
    setReaderMarkers([]);

    // Add new markers
    const newMarkers = readers.map(reader => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: reader.latitude,
          lng: reader.longitude,
        },
        map: readerMap,
        title: reader.profiles?.full_name || reader.profiles?.username || 'Reader',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
        },
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">
              ${reader.profiles?.full_name || reader.profiles?.username || 'Reader'}
            </h3>
            <p style="margin: 0; color: #666;">Reading: ${selectedBook?.title || 'Unknown Book'}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(readerMap, marker);
      });

      return marker;
    });

    setReaderMarkers(newMarkers);

    // Fit map to show all markers if there are multiple readers
    if (newMarkers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!);
        }
      });
      readerMap.fitBounds(bounds);
    }
  }, [readers, readerMap, selectedBook]);

  if (readersLoading || !mapsLoaded) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  if (!selectedBook) {
    return (
      <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Select a book to view readers</p>
          <p className="text-sm">Choose a book from your bookshelf to see who else is reading it</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={readerMapRef} className="h-96 w-full rounded-lg" />
      {readersError && (
        <div className="text-center text-destructive py-4">
          {readersError}
        </div>
      )}
      {!readersError && readers.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-lg font-medium mb-2">No readers found</p>
          <p className="text-sm">Be the first to share your location for "{selectedBook.title}"</p>
        </div>
      )}
      {readers.length > 0 && (
        <div className="text-center text-muted-foreground text-sm">
          Found {readers.length} reader{readers.length === 1 ? '' : 's'} reading "{selectedBook.title}"
        </div>
      )}
    </div>
  );
};