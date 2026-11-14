export interface LocationCoords {
  lat: number;
  lng: number;
}

export type LocationFailureCode = 'permission-denied' | 'position-unavailable' | 'timeout' | 'unsupported' | 'unknown';

export class LocationRequestError extends Error {
  readonly code: LocationFailureCode;
  readonly recoverable: boolean;

  constructor(code: LocationFailureCode, message: string, recoverable = true) {
    super(message);
    this.name = 'LocationRequestError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

const requestPosition = (
  options: PositionOptions,
  failureCode: (code: number) => LocationFailureCode,
): Promise<LocationCoords> => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
          Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) {
        reject(new LocationRequestError('position-unavailable', 'Your device returned an invalid location. Please try again.'));
        return;
      }

      resolve({ lat, lng });
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          reject(new LocationRequestError(
            'permission-denied',
            'Location permission is blocked for Sahadhyayi. Click the site controls beside the address bar, set Location to Allow, then try again.',
            false,
          ));
          break;
        case error.POSITION_UNAVAILABLE:
          reject(new LocationRequestError(
            'position-unavailable',
            'Your device could not determine its location. Check that Location Services are enabled and try again.',
          ));
          break;
        case error.TIMEOUT:
          reject(new LocationRequestError(
            'timeout',
            'The location request took too long. We will retry using your device’s approximate location.',
          ));
          break;
        default:
          reject(new LocationRequestError('unknown', 'Your browser could not determine the location. Please try again.'));
      }
    },
    options,
  );
});

/**
 * Requests location only after an explicit user action.
 * First try precise coordinates; when GPS is slow/unavailable, fall back to
 * network-assisted approximate positioning instead of failing after 10 seconds.
 */
export const getCurrentLocation = async (): Promise<LocationCoords> => {
  if (!navigator.geolocation) {
    throw new LocationRequestError(
      'unsupported',
      'This browser does not provide location services. Open Sahadhyayi in a browser with location access enabled.',
      false,
    );
  }

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new LocationRequestError(
      'unsupported',
      'Location access requires a secure HTTPS connection. Open https://sahadhyayi.com and try again.',
      false,
    );
  }

  try {
    return await requestPosition(
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 120_000 },
      () => 'unknown',
    );
  } catch (error) {
    if (error instanceof LocationRequestError && !error.recoverable) throw error;
    if (error instanceof LocationRequestError &&
        error.code !== 'timeout' && error.code !== 'position-unavailable') {
      throw error;
    }
  }

  try {
    return await requestPosition(
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 300_000 },
      () => 'unknown',
    );
  } catch (fallbackError) {
    if (fallbackError instanceof LocationRequestError) throw fallbackError;
    throw new LocationRequestError(
      'unknown',
      fallbackError instanceof Error ? fallbackError.message : 'Unable to determine your location. Please try again.',
    );
  }
};

export const calculateDistance = (
  point1: LocationCoords,
  point2: LocationCoords
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
