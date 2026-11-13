import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FriendsMap } from './FriendsMap';

describe('FriendsMap component', () => {
  let mockMapInstance: any;
  let mockMarkerInstance: any;
  let mockInfoWindowInstance: any;
  let listeners: Record<string, ((...args: any[]) => void)[]> = {};

  beforeEach(() => {
    listeners = {};
    mockInfoWindowInstance = {
      open: vi.fn(),
      close: vi.fn(),
      setContent: vi.fn(),
    };

    mockMarkerInstance = {
      setMap: vi.fn(),
      addListener: vi.fn((event: string, handler: (...args: any[]) => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
        return { remove: vi.fn() };
      }),
      getPosition: vi.fn(() => ({ lat: () => 28.6139, lng: () => 77.209 })),
      getIcon: vi.fn(() => ({
        url: 'https://example.com/avatar.jpg',
        scaledSize: { width: 50, height: 50 },
      })),
      setIcon: vi.fn(),
    };

    mockMapInstance = {
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      fitBounds: vi.fn(),
    };

    (window as any).google = {
      maps: {
        Map: vi.fn(function () {
          return mockMapInstance;
        }),
        Marker: vi.fn(function () {
          return mockMarkerInstance;
        }),
        InfoWindow: vi.fn(function () {
          return mockInfoWindowInstance;
        }),
        Size: vi.fn(function (w, h) {
          return { width: w, height: h };
        }),
        Point: vi.fn(function (x, y) {
          return { x, y };
        }),
        LatLngBounds: vi.fn(function () {
          return {
            extend: vi.fn(),
          };
        }),
        SymbolPath: { CIRCLE: 0 },
        Animation: { DROP: 1, BOUNCE: 2 },
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when friendsLoading is true', () => {
    render(
      <FriendsMap
        friends={[]}
        friendsLoading={true}
        mapsLoaded={false}
        darkMapStyle={[]}
      />
    );

    expect(screen.getByText('Loading friends map...')).toBeInTheDocument();
  });

  it('displays empty state when no friends are sharing location', () => {
    render(
      <FriendsMap
        friends={[]}
        friendsLoading={false}
        mapsLoaded={true}
        darkMapStyle={[]}
      />
    );

    expect(screen.getByText('No friends sharing location')).toBeInTheDocument();
    expect(screen.getByText('Invite friends to share their reading locations!')).toBeInTheDocument();
  });

  it('initializes map and centers on provided userLocation', () => {
    const userLocation = { lat: 28.6139, lng: 77.209 };
    render(
      <FriendsMap
        friends={[]}
        friendsLoading={false}
        mapsLoaded={true}
        darkMapStyle={[{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] }]}
        userLocation={userLocation}
      />
    );

    expect(window.google.maps.Map).toHaveBeenCalled();
    expect(mockMapInstance.setCenter).toHaveBeenCalledWith(userLocation);
    expect(mockMapInstance.setZoom).toHaveBeenCalledWith(8);
  });

  it('uses navigator.geolocation when userLocation is not provided', () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 19.076,
          longitude: 72.8777,
        },
      });
    });

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    render(
      <FriendsMap
        friends={[]}
        friendsLoading={false}
        mapsLoaded={true}
        darkMapStyle={[]}
        userLocation={null}
      />
    );

    expect(mockGetCurrentPosition).toHaveBeenCalled();
    expect(mockMapInstance.setCenter).toHaveBeenCalledWith({ lat: 19.076, lng: 72.8777 });
  });

  it('renders markers for friends with location_sharing enabled and handles interaction listeners', () => {
    const mockFriends = [
      {
        id: 'rel-1',
        friend_profile: {
          id: 'user-1',
          full_name: 'Aarav Sharma',
          location_sharing: true,
          location_lat: 28.61,
          location_lng: 77.20,
          profile_photo_url: 'https://example.com/aarav.jpg',
        },
      },
      {
        id: 'rel-2',
        friend_profile: {
          id: 'user-2',
          username: 'diya_reads',
          location_sharing: true,
          location_lat: 19.07,
          location_lng: 72.87,
        },
      },
      {
        id: 'rel-3',
        friend_profile: {
          id: 'user-3',
          full_name: 'Private Reader',
          location_sharing: false, // Should NOT create a marker
          location_lat: 12.97,
          location_lng: 77.59,
        },
      },
    ];

    render(
      <FriendsMap
        friends={mockFriends}
        friendsLoading={false}
        mapsLoaded={true}
        darkMapStyle={[]}
        userLocation={{ lat: 28.6139, lng: 77.209 }}
      />
    );

    // 1 user marker + 2 friends markers = 3 markers created
    expect(window.google.maps.Marker).toHaveBeenCalledTimes(3);

    // Verify hover and click listeners can be triggered
    if (listeners['mouseover'] && listeners['mouseover'][0]) {
      act(() => {
        listeners['mouseover'][0]();
      });
      expect(mockInfoWindowInstance.open).toHaveBeenCalled();
    }

    if (listeners['mouseout'] && listeners['mouseout'][0]) {
      act(() => {
        listeners['mouseout'][0]();
      });
    }

    if (listeners['click'] && listeners['click'][0]) {
      act(() => {
        listeners['click'][0]();
      });
      expect(mockInfoWindowInstance.open).toHaveBeenCalled();
    }

    // Verify global chat and profile helper functions are attached to window
    expect(typeof (window as any).openChat).toBe('function');
    expect(typeof (window as any).viewFriendProfile).toBe('function');
    (window as any).openChat('user-1');
    (window as any).viewFriendProfile('user-1');

    // FitBounds should have been called since there are multiple markers
    expect(mockMapInstance.fitBounds).toHaveBeenCalled();
  });
});
