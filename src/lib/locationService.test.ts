import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentLocation, LocationRequestError } from './locationService';

const makePosition = (latitude: number, longitude: number) => ({
  coords: { latitude, longitude },
} as GeolocationPosition);

const makePositionError = (code: number): GeolocationPositionError => ({
  code,
  message: 'mock geolocation error',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as GeolocationPositionError);

const installGeolocation = (getCurrentPosition: ReturnType<typeof vi.fn>) => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
};

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as Navigator & { geolocation?: Geolocation }).geolocation;
});

describe('getCurrentLocation', () => {
  it('falls back to approximate location when high-accuracy GPS times out', async () => {
    const getCurrentPosition = vi.fn()
      .mockImplementationOnce((_success, failure) => failure(makePositionError(3)))
      .mockImplementationOnce((success) => success(makePosition(28.4595, 77.0266)));
    installGeolocation(getCurrentPosition);

    await expect(getCurrentLocation()).resolves.toEqual({ lat: 28.4595, lng: 77.0266 });

    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({
      enableHighAccuracy: true,
      timeout: 12_000,
    });
    expect(getCurrentPosition.mock.calls[1][2]).toMatchObject({
      enableHighAccuracy: false,
      timeout: 20_000,
    });
  });

  it('does not retry a browser permission denial and gives actionable guidance', async () => {
    const getCurrentPosition = vi.fn().mockImplementationOnce((_success, failure) => failure(makePositionError(1)));
    installGeolocation(getCurrentPosition);

    await expect(getCurrentLocation()).rejects.toMatchObject({
      code: 'permission-denied',
      recoverable: false,
      message: expect.stringContaining('Site settings'),
    });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('falls back when the device reports position unavailable', async () => {
    const getCurrentPosition = vi.fn()
      .mockImplementationOnce((_success, failure) => failure(makePositionError(2)))
      .mockImplementationOnce((success) => success(makePosition(19.076, 72.8777)));
    installGeolocation(getCurrentPosition);

    await expect(getCurrentLocation()).resolves.toEqual({ lat: 19.076, lng: 72.8777 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid coordinate from the device', async () => {
    const getCurrentPosition = vi.fn().mockImplementationOnce((success) => success(makePosition(0, 0)));
    installGeolocation(getCurrentPosition);

    await expect(getCurrentLocation()).rejects.toBeInstanceOf(LocationRequestError);
  });
});
