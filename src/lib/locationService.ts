
export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export const LocationErrorCodes = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const;

export const getLocationPermission = (): Promise<PermissionState> => {
  if (!navigator.permissions) {
    return Promise.reject(new Error('Permissions API not supported'));
  }
  
  return navigator.permissions.query({ name: 'geolocation' })
    .then(result => result.state);
};

export const getCurrentLocation = (options?: PositionOptions): Promise<LocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let message = 'Unable to get location';
        switch (error.code) {
          case LocationErrorCodes.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case LocationErrorCodes.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case LocationErrorCodes.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject({ code: error.code, message });
      },
      defaultOptions
    );
  });
};

export const calculateDistance = (
  coord1: LocationCoords,
  coord2: LocationCoords
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degree: number): number => {
  return degree * (Math.PI / 180);
};
