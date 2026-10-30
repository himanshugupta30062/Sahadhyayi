import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client-universal';
import { useFriends } from '@/hooks/useFriends';
import { BookFilterDropdown } from '@/components/social/BookFilterDropdown';
import { MapplsMap, type MapplsPoint } from '@/components/maps/MapplsMap';
import { MAPPLS_API_KEY } from '@/config/mappls';
import { useAuth } from '@/contexts/authHelpers';

interface ReaderLocation {
  latitude: number | null;
  longitude: number | null;
  user_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
  distance?: number;
  reading_since?: string | null;
}

interface BookOption {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
}

const MapPage = () => {
  const [tab, setTab] = useState<'readers' | 'friends'>('readers');
  const [readers, setReaders] = useState<ReaderLocation[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [locationConsentChecked, setLocationConsentChecked] = useState(false);
  const { user } = useAuth();

  const friendsQuery = useFriends();
  const friends = friendsQuery.data || [];

  // Use only the location the signed-in user has already chosen to share.
  // Opening this page must never trigger a new GPS permission prompt.
  useEffect(() => {
    let active = true;
    const loadSharingState = async () => {
      setLocationConsentChecked(false);
      setLocationSharingEnabled(false);
      setCurrentLocation(null);
      if (!user?.id) {
        setLocationConsentChecked(true);
        return;
      }
      const [profileResult, consentResult] = await Promise.all([
        supabase.from('profiles').select('location_lat, location_lng, location_sharing').eq('id', user.id).maybeSingle(),
        supabase.rpc('has_location_consent', { user_uuid: user.id }),
      ]);
      if (!active) return;
      const enabled = !profileResult.error &&
        !consentResult.error &&
        consentResult.data === true &&
        profileResult.data?.location_sharing === true &&
        profileResult.data.location_lat != null &&
        profileResult.data.location_lng != null;
      setLocationSharingEnabled(enabled);
      if (enabled) {
        setCurrentLocation({
          lat: Number(profileResult.data!.location_lat),
          lng: Number(profileResult.data!.location_lng),
        });
      }
      setLocationConsentChecked(true);
    };
    void loadSharingState().catch((error) => {
      console.error('Failed to check saved location-sharing state', { errorName: error instanceof Error ? error.name : 'UnknownError' });
      if (active) setLocationConsentChecked(true);
    });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedBook?.id || !locationSharingEnabled) {
      setReaders([]);
      setReadersError(null);
      setReadersLoading(false);
      return;
    }

    const fetchReaders = async () => {
      setReadersLoading(true);
      setReadersError(null);
      try {
        const { data, error } = await supabase.rpc('get_nearby_book_readers', {
          book_uuid: selectedBook.id,
          radius_km: 10,
        });

        if (cancelled) return;
        if (error) {
          console.error('Failed to fetch nearby readers', { errorName: error.name });
          setReadersError('Unable to load nearby readers. Check location-sharing permissions and try again.');
          setReaders([]);
          return;
        }

        // The current RPC intentionally returns distance but not coordinates. Do not fabricate
        // map positions; the backend must provide privacy-preserving approximate coordinates
        // before these readers can be pinned to a map.
        const readerList = (data || []).map((reader: any) => ({
          user_id: reader.reader_id,
          latitude: reader.approximate_latitude == null ? null : Number(reader.approximate_latitude),
          longitude: reader.approximate_longitude == null ? null : Number(reader.approximate_longitude),
          profiles: {
            full_name: reader.reader_name ?? null,
            username: (reader.reader_name || 'reader').toLowerCase().replace(/\\s+/g, '_'),
          },
          distance: reader.distance_km,
          reading_since: reader.reading_since,
        }));
        setReaders(readerList);
        if (readerList.length === 0) {
          setReadersError(null);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Nearby readers request failed', { errorName: error instanceof Error ? error.name : 'UnknownError' });
        setReadersError('Failed to fetch readers. Please try again.');
        setReaders([]);
      } finally {
        if (!cancelled) setReadersLoading(false);
      }
    };

    void fetchReaders();
    return () => {
      cancelled = true;
    };
  }, [selectedBook?.id, locationSharingEnabled]);

  const readerPoints = useMemo<MapplsPoint[]>(
    () =>
      readers
        .filter((reader) => reader.latitude != null && reader.longitude != null && Number.isFinite(reader.latitude) && Number.isFinite(reader.longitude) && !(reader.latitude === 0 && reader.longitude === 0))
        .map((reader) => ({
          id: reader.user_id,
          lat: reader.latitude!,
          lng: reader.longitude!,
          title: reader.profiles?.full_name || reader.profiles?.username || 'Reader',
          description: reader.distance == null ? 'Reading this book' : `${reader.distance.toFixed(1)} km away`,
        })),
    [readers]
  );

  const friendPoints = useMemo<MapplsPoint[]>(() => {
    if (!Array.isArray(friends)) return [];
    return friends.flatMap((friend: any) => {
      const profile = friend?.friend_profile;
      if (
        !profile?.location_sharing ||
        profile.location_lat == null ||
        profile.location_lng == null
      ) {
        return [];
      }

      const lat = Number(profile.location_lat);
      const lng = Number(profile.location_lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return [];

      return [{
        id: String(friend.id ?? profile.id ?? `${lat},${lng}`),
        lat,
        lng,
        title: profile.full_name || profile.username || 'Friend',
        description: 'Friend who has enabled location sharing',
      }];
    });
  }, [friends]);

  return (
    <>
      <SEO title="Reader Map" description="Discover readers and friends who choose to share their location" canonical="https://sahadhyayi.com/map" url="https://sahadhyayi.com/map" />
      <main className="min-h-screen px-4 pb-12 pt-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reader Map</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover reading connections while respecting each reader’s location-sharing choices.
            </p>
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as 'readers' | 'friends')} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="readers">📚 Readers Map</TabsTrigger>
              <TabsTrigger value="friends">🧑‍🤝‍🧑 Friends Map</TabsTrigger>
            </TabsList>

            <TabsContent value="readers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select a book</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookFilterDropdown
                    selectedBookId={selectedBook?.id || null}
                    onBookSelect={setSelectedBook}
                  />
                </CardContent>
              </Card>

              {!user && <p className="text-sm text-muted-foreground" role="status">Sign in to discover readers near you.</p>}
              {user && !locationConsentChecked && <p className="text-sm text-muted-foreground" role="status">Checking your saved location-sharing settings…</p>}
              {user && locationConsentChecked && !locationSharingEnabled && <p className="text-sm text-muted-foreground" role="status">Enable location sharing in your social settings to discover nearby readers. Your location is not requested automatically.</p>}
              {readersLoading && (
                <p className="text-sm text-muted-foreground" role="status">Finding readers for this book…</p>
              )}
              {readersError && !readersLoading && (
                <p className="text-sm text-muted-foreground" role="status">{readersError}</p>
              )}
              <MapplsMap
                apiKey={MAPPLS_API_KEY}
                points={readerPoints}
                center={currentLocation}
                emptyMessage={!selectedBook ? 'Choose a book to discover readers.' : !locationSharingEnabled ? 'Enable location sharing to discover nearby readers.' : 'No nearby friends are sharing this book location yet.'}
              />
              <p className="text-xs text-muted-foreground">
                This map shows friends who share the selected book and have both enabled location sharing. Pins use approximate coordinates; exact reader coordinates are never displayed.
              </p>
            </TabsContent>

            <TabsContent value="friends" className="space-y-3">
              {friendsQuery.isLoading && (
                <p className="text-sm text-muted-foreground" role="status">Loading friends…</p>
              )}
              <MapplsMap
                apiKey={MAPPLS_API_KEY}
                points={friendPoints}
                center={currentLocation}
                emptyMessage="No friends have shared a mappable location with you yet."
              />
              <p className="text-xs text-muted-foreground">
                Only friends whose location-sharing setting is enabled are shown.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default MapPage;
