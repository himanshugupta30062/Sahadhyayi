
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/SEO';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rknxtatvlzunatpyqxro.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';
const supabase = createClient(supabaseUrl, supabaseKey);
import { useFriends } from '@/hooks/useFriends';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { ReadersMap } from '@/components/maps/ReadersMap';
import { FriendsMap } from '@/components/maps/FriendsMap';

interface ReaderProfile {
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
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);

  // Simplify friends data handling
  const friendsQuery = useFriends();
  const friends = friendsQuery.data || [];
  const friendsLoading = friendsQuery.isLoading;
  
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const selectedBookId = params.get('bookId');

  const GOOGLE_MAPS_API_KEY =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
    'AIzaSyDPBJ3hdp-aILWTyyAJQtDku30yiLA4P2Y';

  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => setMapsLoaded(true))
      .catch(err => {
        console.error('Failed to load Google Maps', err);
      });
  }, [GOOGLE_MAPS_API_KEY]);

  useEffect(() => {
    if (!selectedBookId) {
      setReaders([]);
      return;
    }

    const fetchReaders = async () => {
      setReadersLoading(true);
      setReadersError(null);
      try {
        const response = await supabase
          .from('profiles')
          .select('full_name, location_lat, location_lng')
          .eq('current_book_id', selectedBookId)
          .not('location_lat', 'is', null)
          .not('location_lng', 'is', null);
        
        if (response.error) {
          setReadersError(response.error.message);
          setReaders([]);
        } else {
          const profileData = response.data as any[];
          const readerProfiles: ReaderProfile[] = profileData ? profileData.map((item: any) => ({
            full_name: item.full_name,
            location_lat: item.location_lat,
            location_lng: item.location_lng
          })) : [];
          setReaders(readerProfiles);
        }
      } catch (err) {
        setReadersError('Failed to fetch readers');
        setReaders([]);
      }
      setReadersLoading(false);
    };

    fetchReaders();
  }, [selectedBookId]);

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

            <TabsContent value="readers">
              <ReadersMap
                readers={readers}
                readersLoading={readersLoading}
                readersError={readersError}
                mapsLoaded={mapsLoaded}
                darkMapStyle={darkMapStyle}
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
