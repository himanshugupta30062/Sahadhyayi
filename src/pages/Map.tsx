import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useFriends } from '@/hooks/useFriends';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

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
  const readerMapRef = useRef<HTMLDivElement>(null);
  const friendsMapRef = useRef<HTMLDivElement>(null);
  const [readerMap, setReaderMap] = useState<any>(null);
  const [friendsMap, setFriendsMap] = useState<any>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [readerMarkers, setReaderMarkers] = useState<any[]>([]);
  const [friendMarkers, setFriendMarkers] = useState<any[]>([]);
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);

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

    if (!friendsMap && friendsMapRef.current) {
      const center = { lat: 20, lng: 0 };
      const map = new window.google.maps.Map(friendsMapRef.current, {
        center,
        zoom: 2,
        styles: darkMapStyle
      });
      setFriendsMap(map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          map.setZoom(8);
        });
      }
    }
  }, [mapsLoaded, readerMap, friendsMap]);

  useEffect(() => {
    if (!selectedBookId) {
      setReaders([]);
      return;
    }

    const fetchReaders = async () => {
      setReadersLoading(true);
      setReadersError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, location_lat, location_lng')
        .eq('current_book_id', selectedBookId)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);
      if (error) {
        setReadersError(error.message);
        setReaders([]);
      } else {
        setReaders((data || []) as ReaderProfile[]);
      }
      setReadersLoading(false);
    };

    fetchReaders();
  }, [selectedBookId]);

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
  }, [readers, readerMap, mapsLoaded]);

  useEffect(() => {
    if (!friendsMap || !mapsLoaded || !window.google?.maps) return;

    // Clear existing markers
    friendMarkers.forEach(marker => marker.setMap(null));
    
    const newMarkers: any[] = [];

    // Process friends data more explicitly to avoid type issues
    const friendsList = Array.isArray(friends) ? friends : [];
    
    friendsList.forEach((friend: any) => {
      const profile = friend?.friend_profile;
      if (profile?.location_sharing && profile.location_lat != null && profile.location_lng != null) {
        const marker = new window.google.maps.Marker({
          position: { lat: Number(profile.location_lat), lng: Number(profile.location_lng) },
          map: friendsMap,
          title: profile.full_name
        });
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div class="p-1">${profile.full_name}</div>`
        });
        marker.addListener('click', () => infoWindow.open(friendsMap, marker));
        newMarkers.push(marker);
      }
    });

    setFriendMarkers(newMarkers);
  }, [friends, friendsMap, mapsLoaded]);

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
              {readersLoading && <div className="h-[500px] flex items-center justify-center">Loading...</div>}
              <div ref={readerMapRef} style={{ height: '500px' }} />
              {!readersLoading && readers.length === 0 && (
                <Card className="mt-4">
                  <CardContent className="p-4 text-center text-sm text-gray-600">{readersError || 'No readers found for this book'}</CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="friends">
              <div ref={friendsMapRef} style={{ height: '500px' }} />
              {friendsLoading && <div className="h-[500px] flex items-center justify-center">Loading...</div>}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default MapPage;
