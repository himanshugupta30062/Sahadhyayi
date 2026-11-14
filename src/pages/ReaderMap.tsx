import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client-universal';
import { useParams } from 'react-router-dom';
import { MapplsMap, type MapplsPoint } from '@/components/maps/MapplsMap';
import { MAPPLS_API_KEY } from '@/config/mappls';
import { getMyLocationSharingState } from '@/lib/locationSharingService';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useAuth } from '@/contexts/authHelpers';

interface ReaderProfile {
  id: string;
  full_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  avatar_img_url?: string | null;
}

const ReaderMap = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const { data: userAvatar } = useUserAvatar();
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  // Load current user's location if sharing is enabled
  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setUserLocation(null);
      setIsSharingLocation(false);
      return;
    }

    const checkUserLocation = async () => {
      try {
        const locationState = await getMyLocationSharingState(user.id);
        if (!active) return;

        const sharingEnabled = locationState.isSharing && locationState.location !== null;
        setIsSharingLocation(sharingEnabled);
        setUserLocation(sharingEnabled ? locationState.location : null);

        if (sharingEnabled && locationState.location && bookId) {
          const { error } = await supabase.rpc('share_book_location', {
            book_uuid: bookId,
            lat: locationState.location.lat,
            lng: locationState.location.lng,
          });
          if (error) console.warn('Could not sync user book location:', error);
        }
      } catch (err) {
        console.warn('Could not verify reader location state:', err);
      }
    };

    void checkUserLocation();
    return () => {
      active = false;
    };
  }, [user?.id, bookId]);

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

  const points = useMemo<MapplsPoint[]>(() => {
    const list: MapplsPoint[] = [];
    if (isSharingLocation && userLocation) {
      list.push({
        id: 'self',
        lat: userLocation.lat,
        lng: userLocation.lng,
        title: 'You (Your location)',
        description: 'Your shared location',
        avatarUrl: userAvatar?.avatar_img_url ?? null,
      });
    }
    readers
      .filter((reader) => reader.location_lat != null && reader.location_lng != null)
      .forEach((reader) => {
        const lat = Number(reader.location_lat);
        const lng = Number(reader.location_lng);
        if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
          list.push({
            id: reader.id,
            lat,
            lng,
            title: reader.full_name || 'Reader',
            avatarUrl: reader.avatar_img_url ?? null,
          });
        }
      });
    return list;
  }, [readers, isSharingLocation, userLocation, userAvatar?.avatar_img_url]);

  return (
    <>
      <SEO
        title="Reader Map"
        description="Readers currently on this book"
        canonical={`https://sahadhyayi.com/map/${bookId ?? ''}`}
        url={`https://sahadhyayi.com/map/${bookId ?? ''}`}
      />
      <MapplsMap
        apiKey={MAPPLS_API_KEY}
        points={points}
        center={userLocation}
        emptyMessage="No readers have shared a mappable location for this book yet."
      />
      {readers.length === 0 && !isSharingLocation && (
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
