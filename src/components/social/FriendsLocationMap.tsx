import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, MapPinOff, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';
import { getCurrentLocation, type LocationCoords } from '@/lib/locationService';
import { uniqueChannelName } from '@/lib/realtime';
import { LocationConsentModal } from './LocationConsentModal';
import { LocationPermissionModal } from './LocationPermissionModal';
import { MapplsMap, type MapplsPoint } from '@/components/maps/MapplsMap';
import { MAPPLS_API_KEY } from '@/config/mappls';

type SharedProfile = {
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
};

export function createFriendInfoContent(profile: SharedProfile): HTMLElement {
  // Google Maps InfoWindow accepts a DOM node. Use textContent for profile fields so
  // reader-controlled names/bios can never be interpreted as HTML or script.
  const root = document.createElement('div');
  root.style.padding = '12px';
  root.style.maxWidth = '220px';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '8px';
  header.style.marginBottom = '8px';

  const avatar = document.createElement('div');
  avatar.style.width = '32px';
  avatar.style.height = '32px';
  avatar.style.flexShrink = '0';
  avatar.style.display = 'flex';
  avatar.style.alignItems = 'center';
  avatar.style.justifyContent = 'center';
  avatar.style.borderRadius = '50%';
  avatar.style.background = '#10b981';
  avatar.style.color = '#ffffff';
  avatar.style.fontWeight = '700';
  avatar.textContent = (profile.full_name || profile.username || 'F').trim().charAt(0).toUpperCase() || 'F';

  const text = document.createElement('div');
  const name = document.createElement('h3');
  name.style.margin = '0';
  name.style.fontSize = '14px';
  name.style.fontWeight = '600';
  name.textContent = profile.full_name || profile.username || 'Friend';
  const relationship = document.createElement('p');
  relationship.style.margin = '0';
  relationship.style.fontSize = '12px';
  relationship.style.color = '#6b7280';
  relationship.textContent = 'Friend';
  text.append(name, relationship);
  header.append(avatar, text);
  root.append(header);

  if (profile.bio?.trim()) {
    const bio = document.createElement('p');
    bio.style.margin = '0';
    bio.style.fontSize = '12px';
    bio.style.color = '#374151';
    bio.textContent = profile.bio.trim();
    root.append(bio);
  }
  return root;
}

export const FriendsLocationMap: React.FC = () => {
  const { user } = useAuth();
  const { data: friends = [], isLoading: isLoadingFriends, error: friendsError, refetch } = useFriends();

  const [mapCenter, setMapCenter] = useState<LocationCoords | null>(null);

  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [isCheckingSharing, setIsCheckingSharing] = useState(true);
  const [sharingStatusError, setSharingStatusError] = useState<string | null>(null);
  const [sharingStatusAttempt, setSharingStatusAttempt] = useState(0);
  const [isSavingSharing, setIsSavingSharing] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load only the signed-in user's own sharing state. Do not open a browser location
  // prompt just because a user views the Friends Map.
  useEffect(() => {
    if (!user?.id) {
      setIsCheckingSharing(false);
      setSharingStatusError(null);
      setIsSharingLocation(false);
      setUserLocation(null);
      return;
    }

    let active = true;
    const loadSharingState = async () => {
      setIsCheckingSharing(true);
      setSharingStatusError(null);
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

        const allowed = profileResult.data?.location_sharing === true && consentResult.data === true && !consentResult.error;
        setIsSharingLocation(allowed);
        setUserLocation(
          allowed && profileResult.data?.location_lat != null && profileResult.data?.location_lng != null
            ? { lat: Number(profileResult.data.location_lat), lng: Number(profileResult.data.location_lng) }
            : null,
        );
      } catch (error) {
        if (active) {
          console.error('Unable to read location-sharing status:', error);
          setSharingStatusError('Could not verify your saved location-sharing status. Retry before changing it.');
          setIsSharingLocation(false);
          setUserLocation(null);
        }
      } finally {
        if (active) setIsCheckingSharing(false);
      }
    };

    void loadSharingState();
    return () => {
      active = false;
    };
  }, [user?.id, sharingStatusAttempt]);

  // Refresh friends' markers when a profile's sharing state changes. Only mirror
  // the signed-in user's own profile into local sharing state; friend coordinates
  // continue to come from the mutual-consent-scoped get_profiles_for_social_context RPC.
  useEffect(() => {
    const channel = supabase
      .channel(uniqueChannelName('friend-location-updates'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload) => {
        const changedProfile = payload.new as {
          id?: string;
          location_sharing?: boolean | null;
          location_lat?: number | null;
          location_lng?: number | null;
        };
        if (!changedProfile.id || !user?.id) return;

        const isOwnProfile = changedProfile.id === user.id;
        const isCurrentFriend = friends.some((friend) => friend.friend_profile?.id === changedProfile.id);
        // The profiles table is high traffic. Do not refetch the whole friends list
        // for unrelated profile edits outside this user's accepted connections.
        if (!isOwnProfile && !isCurrentFriend) return;
        void refetch();

        if (!isOwnProfile) return;

        try {
          const { data: consented, error } = await supabase.rpc('has_location_consent', { user_uuid: user.id });
          const sharingAllowed = !error && consented === true && changedProfile.location_sharing === true;
          setIsSharingLocation(sharingAllowed);
          setUserLocation(
            sharingAllowed && changedProfile.location_lat != null && changedProfile.location_lng != null
              ? { lat: Number(changedProfile.location_lat), lng: Number(changedProfile.location_lng) }
              : null,
          );
        } catch (error) {
          console.error('Unable to refresh own location-sharing status:', error);
          setIsSharingLocation(false);
          setUserLocation(null);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [friends, refetch, user?.id]);

  // Local centering is an explicit, one-time action; this does not enable sharing or save coordinates.
  const centerOnMe = useCallback(async () => {
    try {
      const position = await getCurrentLocation();
      // This is a one-off local centering action, not a sharing toggle or saved location.
      // Don't update the persistent-sharing state, which would otherwise rebuild markers
      // and immediately snap the map back to the friends' bounds.
      setMapCenter(position);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not access your location.');
    }
  }, []);

  const enableLocationSharing = async () => {
    if (!user?.id) {
      toast.error('Sign in to share your location.');
      return;
    }

    setIsSavingSharing(true);
    setLocationError(null);
    try {
      const position = await getCurrentLocation();
      const patch = {
        location_lat: position.lat,
        location_lng: position.lng,
        location_sharing: true,
        last_seen: new Date().toISOString(),
      };
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (lookupError) throw lookupError;

      const writeResult = profile
        ? await supabase.from('profiles').update(patch).eq('id', user.id)
        : await supabase.from('profiles').insert({
            ...patch,
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Reader',
          });
      if (writeResult.error) throw writeResult.error;

      setUserLocation(position);
      setMapCenter(position);
      setIsSharingLocation(true);
      setShowLocationModal(false);
      toast.success('Location sharing enabled. Only friends with mutual consent can see it.');
      await refetch();
    } catch (error) {
      // record_location_consent() also sets location_sharing=true. If geolocation or
      // coordinate persistence fails, undo that side effect so the profile cannot
      // appear as sharing with no validated coordinates.
      try {
        const { error: rollbackError } = await supabase
          .from('profiles')
          .update({ location_sharing: false, location_lat: null, location_lng: null })
          .eq('id', user.id);
        if (rollbackError) console.error('Could not roll back incomplete location sharing:', rollbackError);
      } catch (rollbackError) {
        console.error('Could not roll back incomplete location sharing:', rollbackError);
      }
      setIsSharingLocation(false);
      setUserLocation(null);
      const message = error instanceof Error ? error.message : 'Unable to enable location sharing.';
      setLocationError(message);
      setShowLocationModal(true);
    } finally {
      setIsSavingSharing(false);
    }
  };

  const disableLocationSharing = async () => {
    if (!user?.id || isSavingSharing) return;
    setIsSavingSharing(true);
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

      // Keep the older locations table inactive as well. The canonical friend map reads
      // coordinates from profiles, and its RLS additionally checks consent on both sides.
      const { error: inactiveError } = await supabase
        .from('user_locations')
        .update({ is_active: false })
        .eq('user_id', user.id);
      if (inactiveError) console.warn('Could not deactivate the legacy location row:', inactiveError);

      setIsSharingLocation(false);
      setUserLocation(null);
      toast.success('Location sharing disabled.');
      await refetch();
    } catch (error) {
      console.error('Unable to disable location sharing:', error);
      toast.error('Could not disable location sharing. Please try again.');
    } finally {
      setIsSavingSharing(false);
    }
  };

  const requestLocationConsent = () => {
    if (!user?.id) {
      toast.error('Sign in to share your location.');
      return;
    }
    setShowConsentModal(true);
  };

  const friendsWithLocation = friends.filter((friend) =>
    friend.friend_profile?.location_sharing === true &&
    friend.friend_profile.location_lat != null &&
    friend.friend_profile.location_lng != null
  );

  const mapPoints: MapplsPoint[] = [
    ...(isSharingLocation && userLocation ? [{ id: 'self', lat: userLocation.lat, lng: userLocation.lng, title: 'Your saved location' }] : []),
    ...friendsWithLocation.map((friend) => ({
      id: friend.friend_profile!.id || friend.id,
      lat: Number(friend.friend_profile!.location_lat),
      lng: Number(friend.friend_profile!.location_lng),
      title: friend.friend_profile!.full_name || friend.friend_profile!.username || 'Friend',
    })).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)),
  ];


  return (
    <>
      <Card className="border border-[#E8E2D9] bg-white text-[#1C201D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5 text-[#1C442D] dark:text-[#D5B16D]" />
            Friends Map
          </CardTitle>
          <p className="mt-2 text-sm text-[#636B65] dark:text-[#A5ADA6]">
            Your location is never requested on page load. Shared friend markers appear only when you and the friend have both opted in.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSharingLocation && !userLocation && !sharingStatusError && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/20" role="alert">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Your saved location is missing</p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Sharing is enabled, but no coordinates are saved. Refresh your location to complete setup.</p>
              <Button type="button" size="sm" className="mt-3" disabled={isSavingSharing} onClick={() => void enableLocationSharing()}>
                {isSavingSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh saved location
              </Button>
            </div>
          )}
          <MapplsMap apiKey={MAPPLS_API_KEY} points={mapPoints} center={mapCenter || (isSharingLocation ? userLocation : null)} emptyMessage="No friends have shared a mappable location with you yet." />

          {isLoadingFriends ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-[#636B65] dark:text-[#A5ADA6]" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading friend locations…
            </div>
          ) : friendsError ? (
            <div className="rounded-xl border border-red-300/60 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20" role="alert">
              <p className="text-sm text-red-700 dark:text-red-300">Friend locations could not be loaded. This may be a connection or permission issue.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Try again</Button>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-[#636B65] dark:text-[#A5ADA6]">
              <Users className="h-4 w-4" />
              <span>{isLoadingFriends ? 'Checking friend sharing status…' : friendsError ? 'Friend sharing status unavailable' : `${friendsWithLocation.length} ${friendsWithLocation.length === 1 ? 'friend is' : 'friends are'} sharing location`}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void centerOnMe()} className="gap-2" disabled={isCheckingSharing || !user}>
                <MapPin className="h-4 w-4" /> Center on me
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!user || isCheckingSharing || isSavingSharing}
                onClick={() => {
                  if (sharingStatusError) setSharingStatusAttempt((attempt) => attempt + 1);
                  else if (isSharingLocation) void disableLocationSharing();
                  else requestLocationConsent();
                }}
                className="gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c]"
              >
                {isSavingSharing || isCheckingSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : sharingStatusError ? <RefreshCw className="h-4 w-4" /> : isSharingLocation ? <MapPinOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {isSavingSharing ? 'Saving…' : isCheckingSharing ? 'Checking…' : sharingStatusError ? 'Retry status' : isSharingLocation ? 'Stop sharing' : 'Share my location'}
              </Button>
            </div>
          </div>

          {!isLoadingFriends && !friendsError && friendsWithLocation.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#E8E2D9] py-6 text-center dark:border-[#29332D]">
              <MapPin className="mx-auto mb-2 h-6 w-6 text-[#636B65] dark:text-[#A5ADA6]" />
              <p className="text-sm font-medium">No friends are currently sharing their location with you</p>
              <p className="mt-1 text-xs text-[#636B65] dark:text-[#A5ADA6]">Location sharing requires accepted friendship and consent from both people.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <LocationConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsentGiven={() => {
          setShowConsentModal(false);
          void enableLocationSharing();
        }}
      />
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRequestLocation={() => void enableLocationSharing()}
        hasError={Boolean(locationError)}
        errorMessage={locationError || undefined}
      />
    </>
  );
};
