import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client-universal';
import { useParams } from 'react-router-dom';
import { MapplsMap, type MapplsPoint } from '@/components/maps/MapplsMap';
import { MAPPLS_API_KEY } from '@/config/mappls';

interface ReaderProfile {
  id: string;
  full_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

const ReaderMap = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [readers, setReaders] = useState<ReaderProfile[]>([]);

  useEffect(() => {
    let active = true;
    const fetchReaders = async () => {
      if (!bookId) return;
      const { data, error } = await supabase.rpc('get_friend_locations');
      if (error) {
        console.error('Failed to fetch reader locations', { errorName: error instanceof Error ? error.name : 'UnknownError' });
        return;
      }
      if (active) setReaders((data || []) as ReaderProfile[]);
    };
    void fetchReaders();
    return () => { active = false; };
  }, [bookId]);

  const points = useMemo<MapplsPoint[]>(() => readers
    .filter((reader) => reader.location_lat != null && reader.location_lng != null)
    .map((reader) => ({
      id: reader.id,
      lat: Number(reader.location_lat),
      lng: Number(reader.location_lng),
      title: reader.full_name || 'Reader',
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)), [readers]);

  return (
    <>
      <SEO
        title="Reader Map"
        description="Readers currently on this book"
        canonical={`https://sahadhyayi.com/map/${bookId ?? ''}`}
        url={`https://sahadhyayi.com/map/${bookId ?? ''}`}
      />
      <MapplsMap apiKey={MAPPLS_API_KEY} points={points} emptyMessage="No readers have shared a mappable location for this book yet." />
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
