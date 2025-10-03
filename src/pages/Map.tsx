
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client-universal';
import { useFriends } from '@/hooks/useFriends';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { ReadersMap } from '@/components/maps/ReadersMap';
import { FriendsMap } from '@/components/maps/FriendsMap';
import { BookFilterDropdown } from '@/components/social/BookFilterDropdown';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

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

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    googleMapsLoadingPromise?: Promise<void>;
  }
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

const MapPage = () => {
  const [tab, setTab] = useState<'readers' | 'friends'>('readers');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [readers, setReaders] = useState<ReaderLocation[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);

  // Simplify friends data handling
  const friendsQuery = useFriends();
  const friends = friendsQuery.data || [];
  const friendsLoading = friendsQuery.isLoading;

  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => setMapsLoaded(true))
      .catch(err => {
        console.error('Failed to load Google Maps', err);
      });
  }, [GOOGLE_MAPS_API_KEY]);

  useEffect(() => {
    if (!selectedBook?.id) {
      setReaders([]);
      return;
    }

    const fetchReaders = async () => {
      setReadersLoading(true);
      setReadersError(null);
      try {
        // Use the new secure function to get nearby book readers
        const { data, error } = await supabase.rpc('get_nearby_book_readers', {
          book_uuid: selectedBook.id,
          radius_km: 10
        });

        if (error) {
          console.error('Error fetching nearby readers:', error);
          setReadersError('Unable to load nearby readers. Make sure you have location sharing enabled and are connected with friends.');
          setReaders([]);
          return;
        }

        if (!data || data.length === 0) {
          setReaders([]);
          setReadersError('No friends are currently reading this book nearby. Invite friends to join!');
          return;
        }

        // Transform the secure data (no exact coordinates exposed to frontend)
        const readerList = data.map((reader: any) => ({
          user_id: reader.reader_id,
          latitude: 0, // Don't expose exact coordinates for privacy
          longitude: 0, // Don't expose exact coordinates for privacy
          profiles: {
            full_name: reader.reader_name,
            username: reader.reader_name?.toLowerCase().replace(/\s+/g, '_')
          },
          distance: reader.distance_km,
          reading_since: reader.reading_since
        }));

        setReaders(readerList);
      } catch (err) {
        console.error('Error in fetchReaders:', err);
        setReadersError('Failed to fetch readers');
        setReaders([]);
      }
      setReadersLoading(false);
    };

    fetchReaders();
  }, [selectedBook?.id]);

  return (
    <>
      <SEO title="Map" description="Readers and friends map" canonical="https://sahadhyayi.com/map" url="https://sahadhyayi.com/map" />
      <div className="min-h-screen pt-8 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Tabs value={tab} onValueChange={value => setTab(value as 'readers' | 'friends')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="readers">📚 Readers Map</TabsTrigger>
              <TabsTrigger value="friends">🧑‍🤝‍🧑 Friends Map</TabsTrigger>
            </TabsList>

            <TabsContent value="readers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Book to View Readers</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookFilterDropdown
                    selectedBookId={selectedBook?.id || null}
                    onBookSelect={setSelectedBook}
                  />
                </CardContent>
              </Card>
              
              <ReadersMap
                readers={readers}
                readersLoading={readersLoading}
                readersError={readersError}
                mapsLoaded={mapsLoaded}
                darkMapStyle={darkMapStyle}
                selectedBook={selectedBook}
              />
            </TabsContent>

            <TabsContent value="friends">
              <FriendsMap
                friends={friends}
                friendsLoading={friendsLoading}
                mapsLoaded={mapsLoaded}
                darkMapStyle={darkMapStyle}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default MapPage;
