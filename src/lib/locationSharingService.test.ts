import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  disableMyLocationSharing,
  getMyLocationSharingState,
  saveMyLocation,
} from './locationSharingService';

const rpc = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc },
}));

describe('locationSharingService', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('reads private profile coordinates through the owner RPC and checks the caller consent', async () => {
    rpc.mockImplementation((name: string) => {
      if (name === 'get_my_profile') {
        return Promise.resolve({
          data: { location_lat: 28.4595, location_lng: 77.0266, location_sharing: true },
          error: null,
        });
      }
      if (name === 'has_location_consent') return Promise.resolve({ data: true, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    await expect(getMyLocationSharingState('user-1')).resolves.toEqual({
      hasConsent: true,
      isSharing: true,
      location: { lat: 28.4595, lng: 77.0266 },
    });
    expect(rpc).toHaveBeenCalledWith('get_my_profile');
    expect(rpc).toHaveBeenCalledWith('has_location_consent', { user_uuid: 'user-1' });
  });

  it('does not report a saved location as shared without explicit consent', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve(
      name === 'get_my_profile'
        ? { data: { location_lat: 28.4, location_lng: 77.1, location_sharing: true }, error: null }
        : { data: false, error: null },
    ));

    await expect(getMyLocationSharingState('user-1')).resolves.toEqual({
      hasConsent: false,
      isSharing: false,
      location: { lat: 28.4, lng: 77.1 },
    });
  });

  it('persists valid coordinates through the owner-only save RPC', async () => {
    rpc.mockResolvedValue({ data: { location_sharing: true }, error: null });

    await saveMyLocation({ lat: 28.4595, lng: 77.0266 });

    expect(rpc).toHaveBeenCalledWith('save_my_location', {
      p_lat: 28.4595,
      p_lng: 77.0266,
    });
  });

  it.each([
    { lat: Number.NaN, lng: 77.1 },
    { lat: 91, lng: 77.1 },
    { lat: 28.4, lng: -181 },
    { lat: 0, lng: 0 },
  ])('rejects invalid location coordinates before making an RPC call: $lat, $lng', async (location) => {
    await expect(saveMyLocation(location)).rejects.toThrow('A valid device location is required.');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('withdraws sharing through the dedicated owner-only RPC', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await disableMyLocationSharing();

    expect(rpc).toHaveBeenCalledWith('disable_my_location_sharing');
  });

  it('surfaces backend save errors instead of showing a false success', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('Location permission denied by database') });

    await expect(saveMyLocation({ lat: 28.4, lng: 77.1 })).rejects.toThrow('Location permission denied by database');
  });
});
