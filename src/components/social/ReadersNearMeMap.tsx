import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, MapPinOff, Users, BookOpen, MessageCircle, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { LocationConsentModal } from './LocationConsentModal';
import { LocationPermissionModal } from './LocationPermissionModal';
import { BookFilterDropdown } from './BookFilterDropdown';
import { getCurrentLocation, type LocationCoords } from '@/lib/locationService';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';
import { ChatWindow } from './ChatWindow';

declare global {
  interface Window {
    google: any;
  }
}

interface NearbyReader {
  id: string;
  full_name: string;
  distance: number;
  reading_since?: string | null;
  is_friend: boolean;
}

interface BookOption {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
}

const MAX_DISTANCE_KM = 50;

export const ReadersNearMeMap: React.FC = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const requestIdRef = useRef(0);

  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [mapLoadAttempt, setMapLoadAttempt] = useState(0);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [isLoadingSharingStatus, setIsLoadingSharingStatus] = useState(true);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [nearbyReaders, setNearbyReaders] = useState<NearbyReader[]>([]);
  const [isLoadingReaders, setIsLoadingReaders] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [chatFriendId, setChatFriendId] = useState<string | null>(null);

  // Read only the current user's saved state on mount. Never request GPS or save a
  // location merely because someone opened the Reader Map.
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingSharingStatus(false);
      setIsLocationSharing(false);
      setUserLocation(null);
      return;
    }

    let active = true;
    const loadOwnLocationState = async () => {
      setIsLoadingSharingStatus(true);
      try {
        const [profileResult, consentResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('location_sharing, location_lat, location_lng')
            .eq('id', user.id)
            .maybeSingle(),
          supabase.rpc('has_location_consent', { user_uuid: user.id }),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (!active) return;

        const consented = !consentResult.error && consentResult.data === true;
        const sharingEnabled = profileResult.data?.location_sharing === true && consented;
        setIsLocationSharing(sharingEnabled);

        if (
          sharingEnabled &&
          profileResult.data?.location_lat != null &&
          profileResult.data?.location_lng != null
        ) {
          setUserLocation({
            lat: Number(profileResult.data.location_lat),
            lng: Number(profileResult.data.location_lng),
          });
        } else {
          setUserLocation(null);
        }
      } catch (error) {
        if (active) {
          setIsLocationSharing(false);
          setUserLocation(null);
          console.error('Unable to load saved location-sharing state:', error);
        }
      } finally {
        if (active) setIsLoadingSharingStatus(false);
      }
    };

    void loadOwnLocationState();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Load Google Maps independently of location consent.
  useEffect(() => {
    let cancelled = false;
    const loadMap = async () => {
      setIsLoadingMap(true);
      setMapLoadError(null);
      try {
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (!cancelled) setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (!cancelled) {
          setIsLoaded(false);
          setMapLoadError('The map service could not be loaded. Check your connection and try again.');
        }
      } finally {
        if (!cancelled) setIsLoadingMap(false);
      }
    };

    void loadMap();
    return () => {
      cancelled = true;
    };
  }, [mapLoadAttempt]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return;

    const instance = new window.google.maps.Map(mapRef.current, {
      center: userLocation || { lat: 20, lng: 0 },
      zoom: userLocation ? 11 : 2,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      styles: [{
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      }],
    });

    mapInstanceRef.current = instance;
    setMap(instance);

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [isLoaded]);

  // The nearby-reader RPC deliberately returns distance, not another person's exact
  // coordinates. Show these readers in the list; never pin them at fake 0,0 locations.
  const fetchNearbyReaders = useCallback(async () => {
    if (!user?.id || !selectedBook || !isLocationSharing) return;

    const requestId = ++requestIdRef.current;
    setIsLoadingReaders(true);
    setReadersError(null);

    try {
      const { data, error } = await supabase.rpc('get_nearby_book_readers', {
        book_uuid: selectedBook.id,
        radius_km: MAX_DISTANCE_KM,
      });

      if (error) throw error;
      if (requestId !== requestIdRef.current) return;

      setNearbyReaders(((data || []) as unknown as Array<{
        reader_id: string;
        reader_name: string;
        distance_km: number;
        reading_since?: string | null;
        is_friend: boolean;
      }>).map((reader) => ({
        id: reader.reader_id,
        full_name: reader.reader_name || 'Reader',
        distance: Number(reader.distance_km),
        reading_since: reader.reading_since ?? null,
        is_friend: Boolean(reader.is_friend),
      })).filter((reader) => Number.isFinite(reader.distance) && reader.distance >= 0));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Unable to fetch nearby book readers:', error);
      setNearbyReaders([]);
      setReadersError('Nearby matches could not be loaded. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingReaders(false);
    }
  }, [user?.id, selectedBook, isLocationSharing]);

  useEffect(() => {
    if (isLocationSharing && selectedBook) {
      void fetchNearbyReaders();
    } else {
      requestIdRef.current += 1;
      setNearbyReaders([]);
      setReadersError(null);
      setIsLoadingReaders(false);
    }
  }, [isLocationSharing, selectedBook, fetchNearbyReaders]);

  // Render a marker only for the signed-in user's own explicitly shared location.
  useEffect(() => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (!map || !window.google?.maps || !userLocation || !isLocationSharing) return;

    map.setCenter(userLocation);
    map.setZoom(11);
    const marker = new window.google.maps.Marker({
      position: userLocation,
      map,
      title: 'Your saved location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#1C442D',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    });

    const content = document.createElement('div');
    content.textContent = 'Your saved location';
    content.style.padding = '8px';
    const infoWindow = new window.google.maps.InfoWindow({ content });
    marker.addListener('click', () => infoWindow.open({ map, anchor: marker }));
    userMarkerRef.current = marker;

    return () => {
      marker.setMap(null);
      infoWindow.close();
      if (userMarkerRef.current === marker) userMarkerRef.current = null;
    };
  }, [map, userLocation, isLocationSharing]);

  const handleEnableSharing = async () => {
    if (!user?.id) {
      toast.error('Sign in to share your location.');
      return;
    }

    setIsSavingLocation(true);
    setLocationError(null);
    try {
      const position = await getCurrentLocation();
      const patch = {
        location_lat: position.lat,
        location_lng: position.lng,
        location_sharing: true,
        last_seen: new Date().toISOString(),
      };

      const { data: profile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (profileLookupError) throw profileLookupError;

      const profileWrite = profile
        ? await supabase.from('profiles').update(patch).eq('id', user.id)
        : await supabase.from('profiles').insert({
            ...patch,
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Reader',
          });
      if (profileWrite.error) throw profileWrite.error;

      setUserLocation(position);
      setIsLocationSharing(true);
      setShowLocationModal(false);
      toast.success('Location sharing enabled. Only friends who also consent can see it.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to enable location sharing.';
      setLocationError(message);
      setShowLocationModal(true);
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleStopSharing = async () => {
    if (!user?.id || isSavingLocation) return;
    setIsSavingLocation(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location_sharing: false,
          location_lat: null,
          location_lng: null,
          last_seen: null,
        })
        .eq('id', user.id);
      if (error) throw error;

      // Older map surfaces also read this table. Deactivate its row so it cannot
      // appear as an active location after consent is withdrawn.
      const { error: locationRowError } = await supabase
        .from('user_locations')
        .update({ is_active: false })
        .eq('user_id', user.id);
      if (locationRowError) {
        console.warn('Could not deactivate legacy user location row:', locationRowError);
      }

      setIsLocationSharing(false);
      setUserLocation(null);
      setNearbyReaders([]);
      setShowConsentModal(false);
      toast.success('Location sharing disabled.');
    } catch (error) {
      console.error('Unable to disable location sharing:', error);
      toast.error('Could not disable location sharing. Please try again.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const openChat = (reader: NearbyReader) => {
    if (!reader.is_friend) {
      toast.error('Chat is available for friends only.');
      return;
    }
    setChatFriendId(reader.id);
  };

  if (isLoadingMap) {
    return (
      <Card className="border border-[#E8E2D9] bg-white text-[#1C201D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5 text-[#1C442D] dark:text-[#D5B16D]" />
            Readers Near Me
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] rounded-xl border border-[#E8E2D9] dark:border-[#29332D] flex items-center justify-center">
            <div className="text-center text-[#636B65] dark:text-[#A5ADA6]">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#1C442D] dark:text-[#D5B16D]" />
              <p className="text-sm">Loading the map…</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="border border-[#E8E2D9] bg-white text-[#1C201D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5 text-[#1C442D] dark:text-[#D5B16D]" />
            Readers Near Me
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p role="alert" className="text-sm text-[#636B65] dark:text-[#A5ADA6]">{mapLoadError || 'The map is unavailable.'}</p>
          <Button onClick={() => setMapLoadAttempt((attempt) => attempt + 1)} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-[#E8E2D9] bg-white text-[#1C201D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5 text-[#1C442D] dark:text-[#D5B16D]" />
            Readers Near Me
          </CardTitle>
          <p className="text-sm text-[#636B65] dark:text-[#A5ADA6] mt-2">
            Find friends who are reading the same book within {MAX_DISTANCE_KM} km.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] p-4 dark:border-[#29332D] dark:bg-[#0B0D0C] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-[#EBF2EC] p-2 text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{isLocationSharing ? 'Location sharing is on' : 'Location sharing is off'}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
                  {isLocationSharing
                    ? 'Your saved location is available only to friends who have also given consent. Other readers’ exact coordinates are never sent to this map.'
                    : 'Your location is not requested or saved unless you choose to enable sharing.'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant={isLocationSharing ? 'outline' : 'default'}
              disabled={isSavingLocation || isLoadingSharingStatus || !user}
              onClick={() => {
                if (isLocationSharing) void handleStopSharing();
                else setShowConsentModal(true);
              }}
              className="shrink-0 gap-2 bg-[#1C442D] text-white hover:bg-[#143221] disabled:opacity-60 dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c]"
            >
              {isSavingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : isLocationSharing ? <MapPinOff className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              {isSavingLocation ? 'Saving…' : isLocationSharing ? 'Stop sharing' : 'Enable location sharing'}
            </Button>
          </div>

          <div>
            <label htmlFor="nearby-reader-book" className="mb-2 block text-sm font-medium">Select a book</label>
            <BookFilterDropdown
              selectedBookId={selectedBook?.id || null}
              onBookSelect={setSelectedBook}
            />
          </div>

          <div
            ref={mapRef}
            aria-label="Map showing your saved location only"
            className="h-[360px] w-full overflow-hidden rounded-xl border border-[#E8E2D9] dark:border-[#29332D]"
          />

          <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
            For privacy, the map does not plot other readers’ exact positions. Confirmed nearby matches appear below with distance only; no placeholder or guessed map pins are used.
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
                Nearby readers {selectedBook ? `reading ${selectedBook.title}` : ''}
              </h3>
              {selectedBook && isLocationSharing && (
                <Button type="button" size="sm" variant="outline" disabled={isLoadingReaders} onClick={() => void fetchNearbyReaders()} className="gap-2">
                  {isLoadingReaders ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Refresh
                </Button>
              )}
            </div>

            {!selectedBook ? (
              <div className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-8 text-center dark:border-[#29332D]">
                <BookOpen className="mx-auto mb-2 h-7 w-7 text-[#636B65] dark:text-[#A5ADA6]" />
                <p className="text-sm font-medium">Choose a book to discover reading friends</p>
                <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">Only friends who shared that book’s reading location and mutually enabled location sharing can appear.</p>
              </div>
            ) : !isLocationSharing ? (
              <div className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-8 text-center dark:border-[#29332D]">
                <ShieldCheck className="mx-auto mb-2 h-7 w-7 text-[#636B65] dark:text-[#A5ADA6]" />
                <p className="text-sm font-medium">Enable location sharing to search nearby</p>
                <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">You can turn it off at any time.</p>
              </div>
            ) : isLoadingReaders ? (
              <div className="flex justify-center py-8" role="status" aria-live="polite">
                <Loader2 className="h-5 w-5 animate-spin text-[#1C442D] dark:text-[#D5B16D]" />
                <span className="ml-2 text-sm text-[#636B65] dark:text-[#A5ADA6]">Finding nearby readers…</span>
              </div>
            ) : readersError ? (
              <div className="rounded-xl border border-red-300/60 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20" role="alert">
                <p className="text-sm text-red-700 dark:text-red-300">{readersError}</p>
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void fetchNearbyReaders()}>Try again</Button>
              </div>
            ) : nearbyReaders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-8 text-center dark:border-[#29332D]">
                <BookOpen className="mx-auto mb-2 h-7 w-7 text-[#636B65] dark:text-[#A5ADA6]" />
                <p className="text-sm font-medium">No nearby friends have shared this book yet</p>
                <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">Try another book, or invite a friend to share their reading location.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {nearbyReaders.map((reader) => (
                  <div key={reader.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E8E2D9] p-3 dark:border-[#29332D]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{reader.full_name}</p>
                      <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">
                        {reader.distance.toFixed(1)} km away · {selectedBook.title}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => openChat(reader)} disabled={!reader.is_friend}>
                      <MessageCircle className="h-3.5 w-3.5" /> Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LocationConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsentGiven={() => {
          setShowConsentModal(false);
          void handleEnableSharing();
        }}
      />
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRequestLocation={() => void handleEnableSharing()}
        hasError={Boolean(locationError)}
        errorMessage={locationError || undefined}
      />
      {chatFriendId && (
        <ChatWindow
          friendId={chatFriendId}
          isOpen={Boolean(chatFriendId)}
          onClose={() => setChatFriendId(null)}
        />
      )}
    </>
  );
};
