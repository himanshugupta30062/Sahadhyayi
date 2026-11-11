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
const consentModal = readFileSync(toPath('../../src/components/social/LocationConsentModal.tsx'), 'utf8');
const permissionModal = readFileSync(toPath('../../src/components/social/LocationPermissionModal.tsx'), 'utf8');
const userSearch = readFileSync(toPath('../../src/hooks/useUserSearch.ts'), 'utf8');
const friendsManager = readFileSync(toPath('../../src/components/social/EnhancedFriendsManager.tsx'), 'utf8');

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

  it('disables profile location sharing and clears stored coordinates on opt-out', () => {
    expect(readersMap).toMatch(/location_sharing:\s*false/);
    expect(readersMap).toMatch(/location_lat:\s*null/);
    expect(readersMap).toMatch(/location_lng:\s*null/);
    expect(friendsMap).toMatch(/location_sharing:\s*false/);
    expect(friendsMap).toMatch(/location_lat:\s*null/);
    expect(friendsMap).toMatch(/location_lng:\s*null/);
  });

  it('builds map popup content using safe text nodes rather than interpolated profile HTML', () => {
    expect(friendsMap).toMatch(/function createFriendInfoContent/);
    expect(friendsMap).toMatch(/name\.textContent = profile\.full_name/);
    expect(friendsMap).toMatch(/bio\.textContent = profile\.bio\.trim\(\)/);
    expect(friendsMap).not.toMatch(/content:\s*`[\s\S]{0,700}\$\{profile\.full_name/);
    expect(friendsMap).not.toMatch(/content:\s*`[\s\S]{0,700}\$\{profile\.bio/);
  });

  it('describes location storage and mutual consent accurately', () => {
    expect(consentModal).toMatch(/coordinates to your profile/);
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

  it('rolls back location sharing if explicit GPS activation fails after consent', () => {
    expect(readersMap).toMatch(/record_location_consent\(\) also sets location_sharing=true/);
    expect(readersMap).toMatch(/update\(\{ location_sharing: false, location_lat: null, location_lng: null \}\)/);
    expect(friendsMap).toMatch(/record_location_consent\(\) also sets location_sharing=true/);
    expect(friendsMap).toMatch(/update\(\{ location_sharing: false, location_lat: null, location_lng: null \}\)/);
  });
});
