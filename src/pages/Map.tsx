import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client-universal';
import { useFriends } from '@/hooks/useFriends';
import { BookFilterDropdown } from '@/components/social/BookFilterDropdown';
import { MapplsMap, type MapplsPoint, type MapplsMapActions } from '@/components/maps/MapplsMap';
import { BitmojiCreator } from '@/components/social/BitmojiCreator';
import { AvatarUploadDialog } from '@/components/social/AvatarUploadDialog';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { MAPPLS_API_KEY } from '@/config/mappls';
import { disableMyLocationSharing, getMyLocationSharingState, saveMyLocation } from '@/lib/locationSharingService';
import { useAuth } from '@/contexts/authHelpers';
import { getCurrentLocation } from '@/lib/locationService';
import { LocationConsentModal } from '@/components/social/LocationConsentModal';
import { LocationPermissionModal } from '@/components/social/LocationPermissionModal';
import { MapTopHUD } from '@/components/maps/MapTopHUD';
import { MapCategoryFilters } from '@/components/maps/MapCategoryFilters';
import { MapBottomSheetPreview } from '@/components/maps/MapBottomSheetPreview';
import { MapFloatingControls } from '@/components/maps/MapFloatingControls';
import { MapDiscoveryDrawer } from '@/components/maps/MapDiscoveryDrawer';
import { useExploreSpots } from '@/hooks/useExploreSpots';
import type { ExploreCategory, MapMode, SelectedMapMarker } from '@/types/mapExplore';
import {
  BookOpen,
  Camera,
  Compass,
  Eye,
  EyeOff,
  MapPin,
  MessageCircle,
  Palette,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReaderLocation {
  latitude: number | null;
  longitude: number | null;
  user_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
  avatar_img_url?: string | null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = (searchParams.get('tab') as MapMode) || 'readers';

  const [tab, setTab] = useState<MapMode>(initialMode);
  const [readers, setReaders] = useState<ReaderLocation[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [exploreLocation, setExploreLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [exploreLocationLoading, setExploreLocationLoading] = useState(false);
  const [exploreLocationError, setExploreLocationError] = useState<string | null>(null);
  const [exploreAreaQuery, setExploreAreaQuery] = useState('');
  const [exploreAreaSearching, setExploreAreaSearching] = useState(false);
  const [exploreLocationLabel, setExploreLocationLabel] = useState<string | null>(null);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [locationConsentChecked, setLocationConsentChecked] = useState(false);
  const [showBitmojiCreator, setShowBitmojiCreator] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExploreCategory>('all');
  const [selectedMarker, setSelectedMarker] = useState<SelectedMapMarker | null>(null);
  const [is3DMap, setIs3DMap] = useState<Record<MapMode, boolean>>({
    readers: false,
    friends: false,
    explore: false,
  });
  const mapActionsRef = useRef<Record<MapMode, MapplsMapActions | null>>({
    readers: null,
    friends: null,
    explore: null,
  });

  const handleToggle3D = (mode: MapMode) => {
    const next = mapActionsRef.current[mode]?.toggle3D();
    if (next !== undefined) {
      setIs3DMap((prev) => ({ ...prev, [mode]: next }));
      toast.info(next ? 'Switched to 3D perspective' : 'Switched to flat 2D view');
    }
  };

  const handleZoomIn = (mode: MapMode) => {
    mapActionsRef.current[mode]?.zoomIn();
  };

  const handleZoomOut = (mode: MapMode) => {
    mapActionsRef.current[mode]?.zoomOut();
  };

  const handleRecenter = (mode: MapMode) => {
    if (currentLocation) {
      mapActionsRef.current[mode]?.recenter(currentLocation);
      toast.info('Recentered to your location');
    } else {
      void handleToggleSharing();
    }
  };

  const handleResetView = (mode: MapMode) => {
    mapActionsRef.current[mode]?.resetView();
    setIs3DMap((prev) => ({ ...prev, [mode]: false }));
    toast.info('Reset map view to all markers');
  };

  const { user } = useAuth();
  const { data: userAvatar } = useUserAvatar();
  const { data: userProfile } = useUserProfile();

  const selfAvatarUrl = userAvatar?.avatar_img_url
    ?? userProfile?.profile_photo_url
    ?? userProfile?.profile_picture_url
    ?? (user?.user_metadata?.avatar_url as string | undefined)
    ?? (user?.user_metadata?.picture as string | undefined)
    ?? null;

  const friendsQuery = useFriends();
  // Reuse an already-consented shared location when available; otherwise use
  // the one-time Explore location obtained from the explicit "Find near me" action.
  // This keeps Explore discovery independent from enabling social location sharing.
  const exploreSearchLocation = exploreLocation ?? (locationSharingEnabled ? currentLocation : null);
  const { data: exploreItems = [], isLoading: exploreItemsLoading, isFetching: exploreItemsFetching } = useExploreSpots({
    category: selectedCategory,
    userCoords: exploreSearchLocation,
    radiusKm: 25,
  });

  const handleFindNearbyPlaces = async () => {
    setExploreLocationLoading(true);
    setExploreLocationError(null);
    try {
      const coords = await getCurrentLocation();
      setExploreLocation(coords);
      setExploreLocationLabel(null);
      mapActionsRef.current.explore?.recenter(coords);
      toast.success('Showing reading places and literary events within 25 km.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not determine your location.';
      setExploreLocationError(message);
      toast.error(message);
    } finally {
      setExploreLocationLoading(false);
    }
  };

  // City/area search is an explicit, one-shot geocoding request. It provides
  // an alternative when GPS permission is unavailable and never enables
  // social location sharing.
  const handleSearchExploreArea = async () => {
    const query = exploreAreaQuery.trim();
    if (query.length < 2) {
      setExploreLocationError('Enter a city, town or area to search.');
      return;
    }

    setExploreAreaSearching(true);
    setExploreLocationError(null);
    try {
      const params = new URLSearchParams({ q: query, limit: '1', lang: 'en' });
      const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
        headers: { Accept: 'application/geo+json' },
      });
      if (!response.ok) throw new Error(`Place search is temporarily unavailable (${response.status}).`);
      const payload = await response.json() as {
        features?: Array<{
          geometry?: { coordinates?: [number, number] };
          properties?: { name?: string; city?: string; state?: string; country?: string; countrycode?: string };
        }>;
      };
      const feature = payload.features?.[0];
      const coordinates = feature?.geometry?.coordinates;
      const lng = coordinates?.[0];
      const lat = coordinates?.[1];
      if (typeof lat !== 'number' || typeof lng !== 'number' ||
          !Number.isFinite(lat) || !Number.isFinite(lng) ||
          Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new Error('We could not find that place. Try adding the state or country.');
      }

      const properties = feature?.properties;
      const label = [properties?.name, properties?.city, properties?.state, properties?.country]
        .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
        .join(', ') || query;
      const coords = { lat, lng };
      setExploreLocation(coords);
      setExploreLocationLabel(label);
      setSelectedMarker(null);
      mapActionsRef.current.explore?.recenter(coords);
      toast.success(`Showing nearby reading places around ${label}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not search for that area.';
      setExploreLocationError(message);
      toast.error(message);
    } finally {
      setExploreAreaSearching(false);
    }
  };

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
      const locationState = await getMyLocationSharingState(user.id);
      if (!active) return;
      setLocationSharingEnabled(locationState.isSharing && locationState.location !== null);
      setCurrentLocation(locationState.isSharing ? locationState.location : null);
      setLocationConsentChecked(true);
    };
    void loadSharingState().catch((error) => {
      console.error('Failed to check saved location-sharing state', { errorName: error instanceof Error ? error.name : 'UnknownError' });
      if (active) setLocationConsentChecked(true);
    });
    return () => { active = false; };
  }, [user?.id]);

  // Fetch nearby readers when in readers tab and book is selected
  useEffect(() => {
    let cancelled = false;

    if (tab !== 'readers') {
      setReadersLoading(false);
      return () => { cancelled = true; };
    }

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

        const readerList = (data || []).map((reader: any) => ({
          user_id: reader.reader_id,
          latitude: reader.approximate_latitude == null ? null : Number(reader.approximate_latitude),
          longitude: reader.approximate_longitude == null ? null : Number(reader.approximate_longitude),
          avatar_img_url: reader.avatar_img_url ?? null,
          profiles: {
            full_name: reader.reader_name ?? null,
            username: (reader.reader_name || 'reader').toLowerCase().replace(/\s+/g, '_'),
          },
          distance: reader.distance_km == null ? undefined : Number(reader.distance_km),
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
  }, [selectedBook?.id, locationSharingEnabled, tab]);

  // Sync reader book location so other users reading this book can discover this reader
  useEffect(() => {
    if (!user?.id || !selectedBook?.id || !locationSharingEnabled || !currentLocation) return;
    let active = true;
    const syncBookLocation = async () => {
      try {
        await supabase.rpc('share_book_location', {
          book_uuid: selectedBook.id,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        });
      } catch (err) {
        if (active) console.warn('Could not register book location for reader discovery:', err);
      }
    };
    void syncBookLocation();
    return () => {
      active = false;
    };
  }, [user?.id, selectedBook?.id, locationSharingEnabled, currentLocation]);

  // Toggle location sharing / Ghost mode
  const handleToggleSharing = async () => {
    if (!user?.id) {
      toast.info('Sign in to manage your map location sharing.');
      return;
    }

    if (locationSharingEnabled) {
      try {
        await disableMyLocationSharing();
        setLocationSharingEnabled(false);
        setCurrentLocation(null);
        toast.success('Ghost Mode activated. Your location is now hidden from other readers.');
      } catch (err) {
        toast.error('Could not activate Ghost Mode. Please try again.');
      }
    } else {
      setShowConsentModal(true);
    }
  };

  const handleConsentGiven = () => {
    setShowConsentModal(false);
    setShowPermissionModal(true);
  };

  const handleRequestLocation = async () => {
    try {
      setShowPermissionModal(false);
      const coords = await getCurrentLocation();
      await saveMyLocation(coords);
      setCurrentLocation(coords);
      setLocationSharingEnabled(true);
      toast.success('Location sharing enabled! Your Bitmoji is now active on the map.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your location.');
    }
  };

  const readerPoints = useMemo<MapplsPoint[]>(() => {
    const points: MapplsPoint[] = [];
    if (locationSharingEnabled && currentLocation) {
      points.push({
        id: 'self',
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        title: 'You (Your location)',
        description: selectedBook ? `Reading: ${selectedBook.title}` : 'Your shared location',
        avatarUrl: selfAvatarUrl,
        avatarSeed: user?.id ?? 'self',
        markerType: 'avatar',
      });
    }
    readers
      .filter(
        (reader) =>
          reader.latitude != null &&
          reader.longitude != null &&
          Number.isFinite(reader.latitude) &&
          Number.isFinite(reader.longitude) &&
          !(reader.latitude === 0 && reader.longitude === 0),
      )
      .forEach((reader) => {
        const title = reader.profiles?.full_name || reader.profiles?.username || 'Reader';
        if (
          searchQuery.trim() &&
          !title.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ) {
          return;
        }
        points.push({
          id: reader.user_id,
          lat: reader.latitude!,
          lng: reader.longitude!,
          title,
          description: reader.distance != null && Number.isFinite(reader.distance)
            ? `${reader.distance.toFixed(1)} km away`
            : 'Reading this book',
          avatarUrl: reader.avatar_img_url ?? null,
          avatarSeed: reader.user_id,
          markerType: 'avatar',
          data: reader,
        });
      });
    return points;
  }, [readers, locationSharingEnabled, currentLocation, selectedBook, selfAvatarUrl, searchQuery]);

  const friendPoints = useMemo<MapplsPoint[]>(() => {
    const points: MapplsPoint[] = [];
    if (locationSharingEnabled && currentLocation) {
      points.push({
        id: 'self',
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        title: 'You (Your location)',
        description: 'Your shared location',
        avatarUrl: selfAvatarUrl,
        avatarSeed: user?.id ?? 'self',
        markerType: 'avatar',
      });
    }
    const friends = friendsQuery.data || [];
    if (!Array.isArray(friends)) return points;
    friends.forEach((friend: any) => {
      const profile = friend?.friend_profile;
      if (
        !profile?.location_sharing ||
        profile.location_lat == null ||
        profile.location_lng == null
      ) {
        return;
      }

      const lat = Number(profile.location_lat);
      const lng = Number(profile.location_lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;

      const title = profile.full_name || profile.username || 'Friend';
      if (
        searchQuery.trim() &&
        !title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      ) {
        return;
      }

      points.push({
        id: String(friend.id ?? profile.id ?? `${lat},${lng}`),
        lat,
        lng,
        title,
        description: 'Friend who has enabled location sharing',
        avatarUrl: profile.avatar_img_url ?? profile.profile_photo_url ?? null,
        avatarSeed: String(profile.id ?? friend.id ?? title),
        markerType: 'avatar',
        data: friend,
      });
    });
    return points;
  }, [friendsQuery.data, locationSharingEnabled, currentLocation, selfAvatarUrl, searchQuery]);

  const explorePoints = useMemo<MapplsPoint[]>(() => {
    const points: MapplsPoint[] = [];
    if (exploreSearchLocation && !exploreLocationLabel) {
      points.push({
        id: 'self',
        lat: exploreSearchLocation.lat,
        lng: exploreSearchLocation.lng,
        title: 'Your search location',
        description: 'Used only to find nearby places; not shared with readers',
        avatarUrl: selfAvatarUrl,
        avatarSeed: user?.id ?? 'explore-location',
        markerType: 'avatar',
      });
    }

    const q = searchQuery.toLowerCase().trim();
    exploreItems.forEach((item) => {
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.address.toLowerCase().includes(q) &&
        !(item.city && item.city.toLowerCase().includes(q))
      ) {
        return;
      }

      points.push({
        id: item.id,
        lat: item.latitude,
        lng: item.longitude,
        title: item.title,
        description: item.address ? (item.city ? `${item.address}, ${item.city}` : item.address) : item.category,
        avatarUrl: item.image_url,
        markerType: item.item_type === 'literary_event' ? 'event' : 'place',
        category: item.category,
        data: item,
      });
    });

    return points;
  }, [exploreItems, exploreSearchLocation, exploreLocationLabel, selfAvatarUrl, user?.id, searchQuery]);

  const handleMarkerClick = (point: MapplsPoint) => {
    if (point.id === 'self') {
      setSelectedMarker({
        type: 'self',
        id: 'self',
        title: point.title,
        avatarUrl: point.avatarUrl,
        lat: point.lat,
        lng: point.lng,
        readingActivity: selectedBook ? selectedBook.title : 'Active on Sahadhyayi Map',
      });
      return;
    }

    if (tab === 'readers') {
      const reader = point.data as ReaderLocation | undefined;
      setSelectedMarker({
        type: 'user',
        id: point.id,
        userId: reader?.user_id || point.id,
        title: point.title,
        avatarUrl: point.avatarUrl,
        lat: point.lat,
        lng: point.lng,
        distanceKm: reader?.distance,
        readingActivity: selectedBook ? selectedBook.title : 'Reader',
      });
      return;
    }

    if (tab === 'friends') {
      const friend = point.data as any;
      const profile = friend?.friend_profile;
      setSelectedMarker({
        type: 'user',
        id: point.id,
        userId: profile?.id,
        title: point.title,
        avatarUrl: point.avatarUrl,
        lat: point.lat,
        lng: point.lng,
        readingActivity: 'Friend sharing location',
      });
      return;
    }

    // Explore tab
    const item = point.data as any;
    if (point.markerType === 'event') {
      setSelectedMarker({
        type: 'event',
        id: point.id,
        title: point.title,
        category: point.category || 'Literary Event',
        imageUrl: point.avatarUrl,
        lat: point.lat,
        lng: point.lng,
        address: item?.address || point.description || '',
        city: item?.city,
        distanceKm: item?.distance_km,
        description: item?.description,
        startAt: item?.extra_meta?.start_at,
        priceType: item?.extra_meta?.price_type,
        registrationUrl: item?.extra_meta?.registration_url,
        organizerName: item?.extra_meta?.organizer_name,
      });
    } else {
      setSelectedMarker({
        type: 'spot',
        id: point.id,
        title: point.title,
        category: point.category || 'Reading Spot',
        imageUrl: point.avatarUrl,
        lat: point.lat,
        lng: point.lng,
        address: item?.address || point.description || '',
        city: item?.city,
        distanceKm: item?.distance_km,
        description: item?.description,
        amenities: item?.extra_meta?.amenities,
        websiteUrl: item?.extra_meta?.website_url,
        openingHours: item?.extra_meta?.opening_hours,
        phone: item?.extra_meta?.phone,
        source: item?.extra_meta?.source,
        sourceUrl: item?.extra_meta?.osm_url,
        isSaveable: item?.extra_meta?.source !== 'OpenStreetMap',
      });
    }
  };

  const handleModeChange = (nextMode: MapMode) => {
    setTab(nextMode);
    setSelectedMarker(null);
    setSearchParams({ tab: nextMode }, { replace: true });
    if (nextMode === 'friends' && user?.id) void friendsQuery.refetch();
  };

  return (
    <>
      <SEO
        title="Reader Community Map — Live Readers & Book Discovery | Sahadhyayi"
        description="Discover readers, friends, libraries, bookstores and literary events around you with custom avatars and book sharing."
        canonical="https://sahadhyayi.com/map"
        url="https://sahadhyayi.com/map"
      />

      <main className="min-h-screen px-3 sm:px-4 pb-16 pt-3 bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#202820] dark:text-[#F3F0E7] space-y-3">
        <div className="mx-auto max-w-5xl space-y-3">
          {/* Top Navigation HUD */}
          <MapTopHUD
            mode={tab}
            onModeChange={handleModeChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isSharing={locationSharingEnabled}
            onToggleSharing={handleToggleSharing}
            onOpenAvatarModal={() => setShowBitmojiCreator(true)}
            userAvatarUrl={selfAvatarUrl}
            readersCount={readers.length}
            friendsCount={(friendsQuery.data || []).length}
            exploreCount={exploreItems.length}
          />

          {tab === 'explore' && (
            <MapCategoryFilters
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}

          {/* Unified Accessible Tabs List */}
          <Tabs
            value={tab}
            onValueChange={(val) => handleModeChange(val as MapMode)}
            className="w-full space-y-3"
          >
            <TabsList className="grid w-full grid-cols-3 rounded-xl p-1 bg-[#EFECE6] dark:bg-[#161D19] border border-[#DCD5C9] dark:border-[#29332D]">
              <TabsTrigger
                value="readers"
                onClick={() => handleModeChange('readers')}
                className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D] data-[state=active]:shadow-xs"
              >
                📚 Readers Map {readers.length > 0 && `(${readers.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="friends"
                onClick={() => {
                  handleModeChange('friends');
                  if (user?.id) void friendsQuery.refetch();
                }}
                className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D] data-[state=active]:shadow-xs"
              >
                🧑‍🤝‍🧑 Friends Map
              </TabsTrigger>
              <TabsTrigger
                value="explore"
                onClick={() => handleModeChange('explore')}
                className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C442D] data-[state=active]:shadow-xs"
              >
                🧭 Explore Map {exploreItems.length > 0 && `(${exploreItems.length})`}
              </TabsTrigger>
            </TabsList>

            {/* Readers Map Content */}
            <TabsContent value="readers" className="space-y-4">
              <Card className="rounded-2xl border-[#E5DED2] dark:border-[#29332D] shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#1C442D] dark:text-[#D5B16D]" />
                      Filter Map by Book
                    </CardTitle>
                    {selectedBook && (
                      <Badge variant="outline" className="text-xs font-serif">
                        {selectedBook.title}
                      </Badge>
                    )}
                  </div>
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
              {user && locationConsentChecked && !locationSharingEnabled && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                  <p role="status">
                    Enable location sharing in your social settings to discover nearby readers. Your location is not requested automatically.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleSharing}
                    className="text-xs h-7 shrink-0 border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-950 text-amber-900 dark:text-amber-100"
                  >
                    Enable Now →
                  </Button>
                </div>
              )}
              {readersLoading && (
                <p className="text-sm text-muted-foreground" role="status">Finding readers for this book…</p>
              )}
              {readersError && !readersLoading && (
                <p className="text-sm text-muted-foreground" role="status">{readersError}</p>
              )}

              {/* Map Canvas */}
              <div className="relative overflow-hidden rounded-2xl border border-[#E5DED2] dark:border-[#29332D] shadow-md bg-white dark:bg-[#111614] h-[480px] sm:h-[540px]">
                <MapplsMap
                  key="readers-map"
                  apiKey={MAPPLS_API_KEY}
                  points={readerPoints}
                  center={currentLocation}
                  onMarkerClick={handleMarkerClick}
                  onMapActionsReady={(actions) => {
                    mapActionsRef.current.readers = actions;
                  }}
                  emptyMessage={!selectedBook ? 'Choose a book above to discover active readers.' : !locationSharingEnabled ? 'Enable location sharing to discover nearby readers on the map.' : 'No nearby readers are sharing this book location yet.'}
                />
                <MapFloatingControls
                  hasUserLocation={Boolean(currentLocation)}
                  is3D={is3DMap.readers}
                  onToggle3D={() => handleToggle3D('readers')}
                  onZoomIn={() => handleZoomIn('readers')}
                  onZoomOut={() => handleZoomOut('readers')}
                  onRecenter={() => handleRecenter('readers')}
                  onResetView={() => handleResetView('readers')}
                />
              </div>

              {/* Bottom Drawer of Active Readers */}
              {readers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#98733A] dark:text-[#D5B16D]">
                      Active Readers Nearby ({readers.length})
                    </span>
                    <span className="text-[11px] text-muted-foreground">Approximate distances</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {readers.map((reader) => (
                      <div
                        key={reader.user_id}
                        className="rounded-xl border border-[#E5DED2] dark:border-[#29332D] bg-white dark:bg-[#111614] p-3 flex items-center justify-between gap-3 shadow-xs hover:border-[#1C442D]/40 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-9 w-9 border border-amber-400 shrink-0">
                            {reader.avatar_img_url ? (
                              <img
                                src={reader.avatar_img_url}
                                alt={reader.profiles?.full_name || 'Reader'}
                                className="h-full w-full rounded-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <AvatarFallback className="bg-[#1C442D] text-white text-xs font-bold">
                              {(reader.profiles?.full_name || 'R')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-[#1C201D] dark:text-[#F3F0E7]">
                              {reader.profiles?.full_name || 'Reader'}
                            </p>
                            <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                              {reader.distance != null && Number.isFinite(reader.distance) ? `${reader.distance.toFixed(1)} km away` : 'Active nearby'}
                            </p>
                          </div>
                        </div>
                        <Link to={`/messages?recipient=${reader.user_id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-[#1C442D] dark:text-[#D5B16D]">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Friends Map Content */}
            <TabsContent value="friends" className="space-y-4">
              {friendsQuery.isLoading && (
                <p className="text-sm text-muted-foreground" role="status">Loading friends and their shared locations…</p>
              )}
              {friendsQuery.error && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300/60 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200" role="alert">
                  <span>Friends and their map locations could not be loaded. Your map is still available.</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => void friendsQuery.refetch()}>
                    Retry friends
                  </Button>
                </div>
              )}
              <div className="relative overflow-hidden rounded-2xl border border-[#E5DED2] dark:border-[#29332D] shadow-md bg-white dark:bg-[#111614] h-[500px] sm:h-[560px]">
                <MapplsMap
                  key="friends-map"
                  apiKey={MAPPLS_API_KEY}
                  points={friendPoints}
                  center={currentLocation}
                  onMarkerClick={handleMarkerClick}
                  onMapActionsReady={(actions) => {
                    mapActionsRef.current.friends = actions;
                  }}
                  emptyMessage="No friends have shared a mappable location with you yet."
                />
                <MapFloatingControls
                  hasUserLocation={Boolean(currentLocation)}
                  is3D={is3DMap.friends}
                  onToggle3D={() => handleToggle3D('friends')}
                  onZoomIn={() => handleZoomIn('friends')}
                  onZoomOut={() => handleZoomOut('friends')}
                  onRecenter={() => handleRecenter('friends')}
                  onResetView={() => handleResetView('friends')}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Only accepted friends who have enabled location sharing and given consent are shown. Your own marker appears here when you have enabled sharing too.
              </p>
            </TabsContent>

            {/* Explore Map Content */}
            <TabsContent value="explore" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5DED2] dark:border-[#29332D] bg-white/80 dark:bg-[#111614]/80 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Discover reading places around you</p>
                  <p className="text-xs text-muted-foreground">Libraries, bookstores, cafés and geocoded literary events within 25 km.</p>
                  {exploreSearchLocation && <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">{exploreLocationLabel ? `Showing places around ${exploreLocationLabel}.` : 'Nearby search is active. Your location is used only for this search and is not shared with readers.'}</p>}
                </div>
                <Button type="button" size="sm" onClick={handleFindNearbyPlaces} disabled={exploreLocationLoading || exploreAreaSearching} className="shrink-0">
                  <Compass className="w-4 h-4 mr-1.5" />
                  {exploreLocationLoading ? 'Finding location…' : 'Find near me'}
                </Button>
              </div>
              <form
                className="flex flex-col sm:flex-row gap-2 rounded-xl border border-[#E5DED2] dark:border-[#29332D] bg-white/80 dark:bg-[#111614]/80 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSearchExploreArea();
                }}
              >
                <input
                  type="search"
                  value={exploreAreaQuery}
                  onChange={(event) => setExploreAreaQuery(event.target.value)}
                  placeholder="Or enter a city / area (e.g. Faridabad, Haryana)"
                  aria-label="Search libraries by city or area"
                  className="min-w-0 flex-1 rounded-lg border border-[#DCD5C9] dark:border-[#39443D] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D]"
                />
                <Button type="submit" size="sm" disabled={exploreAreaSearching || exploreLocationLoading || exploreAreaQuery.trim().length < 2}>
                  {exploreAreaSearching ? 'Searching area…' : 'Search this area'}
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground">Area search uses OpenStreetMap-based geocoding. It runs only when you submit a search; it does not track your typing. Results are best-effort and may be incomplete.</p>
              {exploreLocationError && <p className="text-xs text-amber-700 dark:text-amber-300" role="status">{exploreLocationError}</p>}
              {(exploreItemsLoading || exploreItemsFetching) && <p className="text-xs text-muted-foreground" role="status">Finding nearby libraries, bookstores and cafés…</p>}
              <p className="text-[10px] text-muted-foreground">Nearby public places use OpenStreetMap data; event listings come from Sahadhyayi. <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">© OpenStreetMap contributors</a>.</p>
              <div className="relative overflow-hidden rounded-2xl border border-[#E5DED2] dark:border-[#29332D] shadow-md bg-white dark:bg-[#111614] h-[520px] sm:h-[580px]">
                <MapplsMap
                  key="explore-map"
                  apiKey={MAPPLS_API_KEY}
                  points={explorePoints}
                  center={exploreSearchLocation}
                  onMarkerClick={handleMarkerClick}
                  onMapActionsReady={(actions) => {
                    mapActionsRef.current.explore = actions;
                    if (exploreSearchLocation) actions.recenter(exploreSearchLocation);
                  }}
                  emptyMessage="No public reading spots or events found matching your filter."
                />
                <MapFloatingControls
                  hasUserLocation={Boolean(exploreSearchLocation)}
                  is3D={is3DMap.explore}
                  onToggle3D={() => handleToggle3D('explore')}
                  onZoomIn={() => handleZoomIn('explore')}
                  onZoomOut={() => handleZoomOut('explore')}
                  onRecenter={() => {
                    const coords = exploreSearchLocation;
                    if (coords) mapActionsRef.current.explore?.recenter(coords);
                    else void handleFindNearbyPlaces();
                  }}
                  onResetView={() => handleResetView('explore')}
                />

                {!selectedMarker && (
                  <MapDiscoveryDrawer
                    mode="explore"
                    items={exploreItems}
                    readers={[]}
                    onSelectItem={(marker) => setSelectedMarker(marker)}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Selected Marker Slide-up Bottom Sheet */}
        <MapBottomSheetPreview
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
        />
      </main>

      {/* Map Avatar Upload Dialog */}
      <AvatarUploadDialog
        isOpen={showAvatarUpload}
        onClose={() => setShowAvatarUpload(false)}
        currentAvatarUrl={userAvatar?.avatar_img_url}
        onSuccess={() => setShowAvatarUpload(false)}
      />

      {/* Map Bitmoji Creator Dialog */}
      <BitmojiCreator
        isOpen={showBitmojiCreator}
        onClose={() => setShowBitmojiCreator(false)}
        onSave={() => setShowBitmojiCreator(false)}
        initialFeatures={userAvatar?.avatar_json as Record<string, string> | null}
      />

      {/* Location Consent & Permission Modals */}
      <LocationConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsentGiven={handleConsentGiven}
      />

      <LocationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRequestLocation={handleRequestLocation}
      />
    </>
  );
};

export default MapPage;
