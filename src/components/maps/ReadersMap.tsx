
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ReaderProfile {
  full_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

interface ReadersMapProps {
  readers: ReaderProfile[];
  readersLoading: boolean;
  readersError: string | null;
  mapsLoaded: boolean;
  darkMapStyle: any[];
}

export const ReadersMap = ({ 
  readers, 
  readersLoading, 
  readersError, 
  mapsLoaded, 
  darkMapStyle 
}: ReadersMapProps) => {
  const readerMapRef = useRef<HTMLDivElement>(null);
  const [readerMap, setReaderMap] = useState<any>(null);
  const [readerMarkers, setReaderMarkers] = useState<any[]>([]);

  useEffect(() => {
    if (!mapsLoaded || !window.google?.maps) return;

    if (!readerMap && readerMapRef.current) {
      const center = { lat: 20, lng: 0 };
      const map = new window.google.maps.Map(readerMapRef.current, {
        center,
        zoom: 2,
        styles: darkMapStyle
      });
      setReaderMap(map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          map.setZoom(8);
        });
      }
    }
  }, [mapsLoaded, readerMap, darkMapStyle]);

  useEffect(() => {
    if (!readerMap || !mapsLoaded || !window.google?.maps) return;

    // Clear existing markers
    readerMarkers.forEach(marker => marker.setMap(null));
    
    const newMarkers: any[] = [];

    readers.forEach(reader => {
      if (reader.location_lat != null && reader.location_lng != null) {
        const marker = new window.google.maps.Marker({
          position: { lat: Number(reader.location_lat), lng: Number(reader.location_lng) },
          map: readerMap,
          title: reader.full_name || 'Reader'
        });
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div class="p-1">${reader.full_name || 'Reader'}</div>`
        });
        marker.addListener('click', () => infoWindow.open(readerMap, marker));
        newMarkers.push(marker);
      }
    });

    setReaderMarkers(newMarkers);
  }, [readers, readerMap, mapsLoaded, readerMarkers]);

  if (readersLoading) {
    return <div className="h-[500px] flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <div ref={readerMapRef} style={{ height: '500px' }} />
      {!readersLoading && readers.length === 0 && (
        <Card className="mt-4">
          <CardContent className="p-4 text-center text-sm text-gray-600">
            {readersError || 'No readers found for this book'}
          </CardContent>
        </Card>
      )}
    </>
  );
};
