import { supabase } from '@/integrations/supabase/client-universal';
import type { LocationCoords } from '@/lib/locationService';

const toServiceError = (error: unknown, fallback: string): Error => {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object') {
    const details = error as Record<string, unknown>;
    const message = typeof details.message === 'string' && details.message.trim()
      ? details.message.trim()
      : fallback;
    const code = typeof details.code === 'string' && details.code.trim() ? ` (${details.code.trim()})` : '';
    return new Error(`${message}${code}`);
  }
  return new Error(fallback);
};

interface PrivateProfileLocation {
  location_lat?: number | string | null;
  location_lng?: number | string | null;
  location_sharing?: boolean | null;
}

export interface MyLocationSharingState {
  hasConsent: boolean;
  isSharing: boolean;
  location: LocationCoords | null;
}

/**
 * Read the signed-in user's private location fields via the owner-scoped
 * get_my_profile() RPC. Direct SELECT access to these profiles columns is
 * intentionally revoked by the profile privacy migrations.
 */
export async function getMyLocationSharingState(userId: string): Promise<MyLocationSharingState> {
  if (!userId) throw new Error('Authentication required');

  const [{ data: profile, error: profileError }, { data: hasConsent, error: consentError }] = await Promise.all([
    (supabase as any).rpc('get_my_profile'),
    supabase.rpc('has_location_consent', { user_uuid: userId }),
  ]);

  if (profileError) throw toServiceError(profileError, 'Could not load your saved location.');
  if (consentError) throw toServiceError(consentError, 'Could not verify location consent.');

  const privateProfile = (profile ?? null) as PrivateProfileLocation | null;
  const latitude = privateProfile?.location_lat == null ? null : Number(privateProfile.location_lat);
  const longitude = privateProfile?.location_lng == null ? null : Number(privateProfile.location_lng);
  const validCoordinates = latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0);

  return {
    hasConsent: hasConsent === true,
    isSharing: privateProfile?.location_sharing === true && hasConsent === true,
    location: validCoordinates ? { lat: latitude!, lng: longitude! } : null,
  };
}

/**
 * Persist coordinates through a SECURITY DEFINER RPC that updates only auth.uid().
 * The RPC verifies explicit location consent before enabling sharing.
 */
export async function saveMyLocation(location: LocationCoords): Promise<void> {
  if (
    !Number.isFinite(location.lat) ||
    !Number.isFinite(location.lng) ||
    Math.abs(location.lat) > 90 ||
    Math.abs(location.lng) > 180 ||
    (location.lat === 0 && location.lng === 0)
  ) {
    throw new Error('A valid device location is required.');
  }

  const { error } = await (supabase as any).rpc('save_my_location', {
    p_lat: location.lat,
    p_lng: location.lng,
  });
  if (error) throw toServiceError(error, 'Your location was found, but it could not be saved. Please try again.');
}

/**
 * Revoke consent and clear all exact coordinates for the signed-in user.
 * The RPC never accepts a user ID, so callers cannot disable another account.
 */
export async function disableMyLocationSharing(): Promise<void> {
  const { error } = await (supabase as any).rpc('disable_my_location_sharing');
  if (error) throw toServiceError(error, 'Could not disable location sharing. Please try again.');
}
