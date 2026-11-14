import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const toPath = (relPath: string) => fileURLToPath(new URL(relPath, import.meta.url));

const socialPage = readFileSync(toPath('../../src/pages/SocialMedia.tsx'), 'utf8');
const appRoutes = readFileSync(toPath('../../src/App.tsx'), 'utf8');
const groupsHook = readFileSync(toPath('../../src/hooks/useGroupManagement.ts'), 'utf8');
const nearbyDiscovery = readFileSync(toPath('../../src/components/social/NearbyReaderDiscovery.tsx'), 'utf8');
const nearbyDiscoveryMigration = readFileSync(
  toPath('../../supabase/migrations/20261108070000_add_opt_in_nearby_reader_discovery.sql'),
  'utf8',
);
const readersMap = readFileSync(toPath('../../src/components/social/ReadersNearMeMap.tsx'), 'utf8');
const friendsMap = readFileSync(toPath('../../src/components/social/FriendsLocationMap.tsx'), 'utf8');
const mainMapPage = readFileSync(toPath('../../src/pages/Map.tsx'), 'utf8');
const readerMapPage = readFileSync(toPath('../../src/pages/ReaderMap.tsx'), 'utf8');
const consentModal = readFileSync(toPath('../../src/components/social/LocationConsentModal.tsx'), 'utf8');
const permissionModal = readFileSync(toPath('../../src/components/social/LocationPermissionModal.tsx'), 'utf8');
const userSearch = readFileSync(toPath('../../src/hooks/useUserSearch.ts'), 'utf8');
const friendsManager = readFileSync(toPath('../../src/components/social/EnhancedFriendsManager.tsx'), 'utf8');
const locationSharingService = readFileSync(toPath('../../src/lib/locationSharingService.ts'), 'utf8');
const mapLocationMigration = readFileSync(
  toPath('../../supabase/migrations/20261114120000_fix_map_location_save_and_reader_avatars.sql'),
  'utf8',
);
const mapAvatarMigration = readFileSync(
  toPath('../../supabase/migrations/20261114180000_add_owner_scoped_map_avatar_rpcs.sql'),
  'utf8',
);
const userAvatarHook = readFileSync(toPath('../../src/hooks/useUserAvatar.ts'), 'utf8');
const mapAvatarControl = readFileSync(toPath('../../src/components/social/MapAvatarControl.tsx'), 'utf8');
const mapRenderer = readFileSync(toPath('../../src/components/maps/MapplsMap.tsx'), 'utf8');

describe('Social discovery and location privacy regressions', () => {
  it('keeps authenticated data hooks inside the authenticated social page', () => {
    expect(socialPage).toMatch(/if \(!user\) return <GuestLanding \/>;/);
    expect(socialPage).toMatch(/return <AuthenticatedSocialMedia user=\{user\} \/>;/);
    expect(socialPage).toMatch(/const AuthenticatedSocialMedia: React\.FC/);
    expect(socialPage).toMatch(/useReadingRooms\(undefined, \{ enabled: isDesktopSidebarVisible \}\)/);
    expect(socialPage).toMatch(/useAllUsers\(\{ enabled: isDesktopSidebarVisible \}\)/);
  });

  it('protects direct entry to groups and reader maps while keeping the social preview public', () => {
    const getRouteBlock = (path: string) => {
      const routeStart = appRoutes.indexOf(`path="${path}"`);
      if (routeStart < 0) return '';
      const nextRoute = appRoutes.indexOf('<Route', routeStart + 6);
      return appRoutes.slice(routeStart, nextRoute < 0 ? appRoutes.length : nextRoute);
    };

    ['/groups', '/groups/:id', '/map', '/reader-map/:bookId?'].forEach((path) => {
      expect(getRouteBlock(path), `${path} should require authentication`).toContain('<ProtectedRoute>');
    });

    expect(getRouteBlock('/social')).not.toContain('<ProtectedRoute>');
    expect(socialPage).toMatch(/if \(!user\) return <GuestLanding \/>;/);
  });

  it('does not substitute fake curated groups when the groups query is empty or fails', () => {
    expect(groupsHook).not.toContain('CURATED_READING_GROUPS');
    expect(groupsHook).toMatch(/const queryEnabled = enabled;/);
    expect(groupsHook).toMatch(/enabled: queryEnabled/);
    expect(groupsHook).toMatch(/if \(error\) \{[\s\S]*?throw error;/);
    expect(groupsHook).toMatch(/return data \?\? \[\]/);
  });

  it('never requests or persists GPS automatically when the readers map mounts', () => {
    expect(readersMap).not.toMatch(/autoRequestLocation/);
    expect(readersMap).not.toMatch(/getCurrentLocation\(\)[\s\S]{0,120}useEffect/);
    expect(readersMap).toMatch(/onClick=\{\(\) => \{/);
    expect(readersMap).toMatch(/setShowConsentModal\(true\)/);
    expect(readersMap).toMatch(/getCurrentLocation\(\)/);
  });

  it('uses the selected book and safe distance-only RPC data instead of fake map coordinates', () => {
    expect(readersMap).toMatch(/rpc\('get_nearby_book_readers', \{[\s\S]*book_uuid: selectedBook\.id[\s\S]*radius_km: MAX_DISTANCE_KM/);
    expect(readersMap).toMatch(/distance: Number\(reader\.distance_km\)/);
    expect(readersMap).toMatch(/!isLocationSharing \|\| !userLocation/);
    expect(readersMap).toMatch(/Your saved location is missing/);
    expect(friendsMap).toMatch(/isSharingLocation && !userLocation/);
    expect(friendsMap).toMatch(/Refresh saved location/);
    expect(friendsMap).toMatch(/isCurrentFriend = friends\.some/);
    expect(friendsMap).toMatch(/if \(!isOwnProfile && !isCurrentFriend\) return/);
    expect(readersMap).not.toMatch(/location_lat:\s*0/);
    expect(readersMap).not.toMatch(/location_lng:\s*0/);
    expect(readersMap).not.toMatch(/window\.handleConnectReader/);
  });

  it('keeps nearby-reader discovery separately consented and hides precise coordinates', () => {
    expect(nearbyDiscovery).toMatch(/setShowConsentDialog\(true\)/);
    expect(nearbyDiscovery).toMatch(/getCurrentLocation\(\)/);
    expect(nearbyDiscovery).toMatch(/reader_discovery_locations/);
    expect(nearbyDiscovery).toMatch(/distance_band/);
    expect(nearbyDiscovery).toMatch(/never another reader’s exact coordinates/);
    expect(nearbyDiscovery).toMatch(/from\('reader_discovery_locations'\)[\s\S]*?delete\(\)/);

    const functionSignature = nearbyDiscoveryMigration.match(/RETURNS TABLE \(([\s\S]*?)\)\nLANGUAGE/)?.[1] ?? '';
    expect(functionSignature).toContain('distance_band text');
    expect(functionSignature).not.toMatch(/latitude|longitude|distance_km/);
    expect(nearbyDiscoveryMigration).toMatch(/CREATE TABLE IF NOT EXISTS public\.reader_discovery_locations/);
    expect(nearbyDiscoveryMigration).toMatch(/FOR ALL\s+TO authenticated/);
    expect(nearbyDiscoveryMigration).toMatch(/USING \(user_id = \(SELECT auth\.uid\(\)\)\)/);
    expect(nearbyDiscoveryMigration).toMatch(/WITH CHECK \(user_id = \(SELECT auth\.uid\(\)\)\)/);
    expect(nearbyDiscoveryMigration).toMatch(/own_shelf\.status = 'reading'/);
    expect(nearbyDiscoveryMigration).toMatch(/shelf\.status = 'reading'/);
    expect(nearbyDiscoveryMigration).toMatch(/REVOKE ALL ON FUNCTION public\.get_nearby_reader_matches\(uuid, numeric\) FROM PUBLIC, anon/);
    expect(nearbyDiscoveryMigration).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_nearby_reader_matches\(uuid, numeric\) TO authenticated/);
  });

  it('saves and reads private location fields only through owner-scoped RPCs', () => {
    expect(readersMap).toMatch(/getMyLocationSharingState\(user\.id\)/);
    expect(readersMap).toMatch(/saveMyLocation\(position\)/);
    expect(friendsMap).toMatch(/getMyLocationSharingState\(user\.id\)/);
    expect(friendsMap).toMatch(/saveMyLocation\(position\)/);
    expect(locationSharingService).toMatch(/rpc\('get_my_profile'\)/);
    expect(locationSharingService).toMatch(/rpc\('save_my_location'/);
    expect(locationSharingService).toMatch(/rpc\('disable_my_location_sharing'/);
    expect(readersMap).not.toMatch(/from\('profiles'\)[\s\S]{0,300}(location_lat|location_lng|location_sharing)/);
    expect(friendsMap).not.toMatch(/from\('profiles'\)[\s\S]{0,300}(location_lat|location_lng|location_sharing)/);
    expect(mainMapPage).not.toMatch(/from\('profiles'\)[\s\S]{0,300}(location_lat|location_lng|location_sharing)/);
    expect(readerMapPage).not.toMatch(/from\('profiles'\)[\s\S]{0,300}(location_lat|location_lng|location_sharing)/);
  });

  it('requires consent before location is persisted or sharing is activated', () => {
    expect(mapLocationMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.record_location_consent\([\s\S]*?INSERT INTO public\.location_sharing_consent/);
    expect(mapLocationMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.save_my_location\([\s\S]*?internal_security\.has_location_consent\(v_user_id\)/);
    expect(mapLocationMigration).toMatch(/location_sharing = true/);
    expect(mapLocationMigration).not.toMatch(/UPDATE public\.profiles[\s\S]{0,100}SET location_sharing = true[\s\S]{0,100}record_location_consent/);
  });

  it('clears private coordinates, legacy locations, book locations and consent on opt-out', () => {
    expect(readersMap).toMatch(/disableMyLocationSharing\(\)/);
    expect(friendsMap).toMatch(/disableMyLocationSharing\(\)/);
    expect(mapLocationMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.disable_my_location_sharing\(\)[\s\S]*?location_sharing = false[\s\S]*?location_lat = NULL[\s\S]*?location_lng = NULL[\s\S]*?DELETE FROM public\.user_books_location[\s\S]*?DELETE FROM public\.location_sharing_consent/);
  });

  it('returns map avatars only through consent-scoped social and reader RPCs', () => {
    expect(mapLocationMigration).toMatch(/get_profiles_for_social_context\(profile_ids uuid\[\]\)[\s\S]*?ua\.avatar_img_url/);
    expect(mapLocationMigration).toMatch(/get_nearby_book_readers\([\s\S]*?ua\.avatar_img_url[\s\S]*?internal_security\.has_location_consent\(ubl\.user_id\)/);
    expect(mapLocationMigration).toMatch(/get_friend_locations\(\)[\s\S]*?ua\.avatar_img_url[\s\S]*?internal_security\.has_location_consent\(p\.id\)/);
  });

  it('reads and saves the current Bitmoji through owner-scoped avatar RPCs', () => {
    expect(userAvatarHook).toMatch(/rpc\('get_my_avatar'\)/);
    expect(userAvatarHook).toMatch(/rpc\('save_my_avatar'/);
    expect(userAvatarHook).not.toMatch(/from\('user_avatars'\)/);
    expect(mapAvatarMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.get_my_avatar\(\)[\s\S]*?WHERE p\.id = auth\.uid\(\)/);
    expect(mapAvatarMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.save_my_avatar\([\s\S]*?v_user_id uuid := auth\.uid\(\)/);
    expect(mapAvatarMigration).toMatch(/REVOKE ALL ON FUNCTION public\.get_my_avatar\(\) FROM PUBLIC, anon/);
    expect(mapAvatarMigration).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_my_avatar\(\) TO authenticated/);
    expect(mapAvatarMigration).toMatch(/REVOKE ALL ON FUNCTION public\.save_my_avatar\(jsonb, text\) FROM PUBLIC, anon/);
    expect(mapAvatarMigration).toMatch(/GRANT EXECUTE ON FUNCTION public\.save_my_avatar\(jsonb, text\) TO authenticated/);
  });

  it('shows a profile photo until a custom Bitmoji is saved and exposes the editor on map surfaces', () => {
    expect(mapAvatarControl).toMatch(/Create Bitmoji/);
    expect(mapAvatarControl).toMatch(/avatar\?\.avatar_img_url/);
    expect(mapAvatarControl).toMatch(/avatar\?\.avatar_json/);
    expect(readersMap).toMatch(/<MapAvatarControl\s*\/>/);
    expect(friendsMap).toMatch(/<MapAvatarControl\s*\/>/);
  });

  it('uses Mappls DOM marker elements and only reconciles changed reader markers', () => {
    expect(mapRenderer).toMatch(/createAvatarMarkerElement\s*=\s*\(point: MapplsPoint\): HTMLElement/);
    expect(mapRenderer).toMatch(/html:\s*createAvatarMarkerElement\(point\)/);
    expect(mapRenderer).toMatch(/markers\.current\.has\(point\.id\)/);
    expect(mapRenderer).not.toMatch(/removeMarkers\(map, markers\.current\);\s*markers\.current = \[\]/);
  });

  it('builds map popup content using safe text nodes rather than interpolated profile HTML', () => {
    expect(friendsMap).toMatch(/function createFriendInfoContent/);
    expect(friendsMap).toMatch(/name\.textContent = profile\.full_name/);
    expect(friendsMap).toMatch(/bio\.textContent = profile\.bio\.trim\(\)/);
    expect(friendsMap).not.toMatch(/content:\s*`[\s\S]{0,700}\$\{profile\.full_name/);
    expect(friendsMap).not.toMatch(/content:\s*`[\s\S]{0,700}\$\{profile\.bio/);
  });

  it('describes location storage and mutual consent accurately', () => {
    expect(consentModal).toMatch(/coordinates are saved to your private profile/i);
    expect(consentModal).toMatch(/accepted friends/);
    expect(consentModal).toMatch(/does not submit an IP address/);
    expect(permissionModal).toMatch(/saved to your profile until you turn sharing off/);
    expect(permissionModal).not.toMatch(/never stored permanently/);
  });

  it('scopes reader discovery cache by user and does not hide backend failures as empty results', () => {
    expect(userSearch).toMatch(/queryKey: \['user-search', user\?\.id, normalizedSearchTerm\]/);
    expect(userSearch).toMatch(/queryKey: \['all-users', user\?\.id\]/);
    expect(userSearch).toMatch(/isDebouncing: searchTerm\.trim\(\) !== normalizedSearchTerm/);
    expect(userSearch).toMatch(/if \(friendsResponse\.error\) throw friendsResponse\.error/);
    expect(userSearch).toMatch(/if \(requestsResponse\.error\) throw requestsResponse\.error/);
    expect(userSearch).toMatch(/if \(error\) throw error/);
  });

  it('renders real friend profiles and never interprets a failed fetch as an empty connection list', () => {
    expect(friendsManager).toMatch(/const friendProfile = friendship\.friend_profile;/);
    expect(friendsManager).not.toMatch(/friendship\.user1_profile|friendship\.user2_profile/);
    expect(friendsManager).toMatch(/Reader suggestions could not be loaded\./);
    expect(friendsManager).toMatch(/Friend requests could not be loaded\./);
    expect(friendsManager).toMatch(/Your friends could not be loaded\./);
    expect(friendsManager).toMatch(/relationshipStateUnavailable/);
    expect(friendsManager).toMatch(/isRequestPending/);
  });

  it('keeps friend/request controls usable at phone widths', () => {
    expect(friendsManager).toMatch(/flex flex-col gap-3 p-3 bg-card border border-border rounded-xl[\s\S]{0,140}sm:flex-row/);
    expect(friendsManager).toMatch(/flex w-full flex-wrap gap-2 sm:w-auto/);
    expect(friendsManager).toMatch(/flex w-full gap-2 sm:w-auto/);
    expect(friendsManager).toMatch(/grid h-auto w-full grid-cols-4 gap-1/);
  });

  it('does not activate sharing until an explicit, consent-checked location save succeeds', () => {
    expect(readersMap).toMatch(/await saveMyLocation\(position\)/);
    expect(friendsMap).toMatch(/await saveMyLocation\(position\)/);
    expect(mapLocationMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.record_location_consent\([\s\S]*?INSERT INTO public\.location_sharing_consent[\s\S]*?END;/);
    expect(mapLocationMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.save_my_location\([\s\S]*?internal_security\.has_location_consent\(v_user_id\)[\s\S]*?location_sharing = true/);
  });
});
