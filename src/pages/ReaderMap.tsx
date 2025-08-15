
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client-universal';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { useParams } from 'react-router-dom';

interface ReaderProfile {
  id: string;
  full_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    googleMapsLoadingPromise?: Promise<void>;
  }
}

const ReaderMap = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [readers, setReaders] = useState<ReaderProfile[]>([]);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured');
  }

  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (mapRef.current && window.google && window.google.maps) {
          const center = { lat: 20, lng: 0 };
          const newMap = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 2,
          });
          setMap(newMap);
        }
      })
      .catch(err => {
        console.error('Failed to load Google Maps', err);
      });
  }, [GOOGLE_MAPS_API_KEY]);

  useEffect(() => {
    const fetchReaders = async () => {
      if (!bookId) return;
      const { data, error } = await supabase
        .rpc('get_friend_locations');
      
      if (error) {
        console.error('Error fetching readers', error);
        return;
      }
      setReaders((data || []) as ReaderProfile[]);
    };

    fetchReaders();
  }, [bookId]);

  useEffect(() => {
    if (!map || !window.google) return;
    readers.forEach(reader => {
      if (
        reader.location_lat != null &&
        reader.location_lng != null
      ) {
        new window.google.maps.Marker({
          position: {
            lat: Number(reader.location_lat),
            lng: Number(reader.location_lng),
          },
          map,
          title: reader.full_name || 'Reader',
        });
      }
    });
  }, [readers, map]);

  return (
    <>
      <SEO
        title="Reader Map"
        description="Readers currently on this book"
        canonical={`https://sahadhyayi.com/map/${bookId ?? ''}`}
        url={`https://sahadhyayi.com/map/${bookId ?? ''}`}
      />
      <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
      {readers.length === 0 && (
        <Card className="mt-4">
          <CardContent className="p-4 text-center text-sm text-gray-600">
            No readers found for this book.
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ReaderMap;
