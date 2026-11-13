// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReadersMap } from './ReadersMap';

describe('ReadersMap component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state when mapsLoaded is false or readersLoading is true', () => {
    render(
      <ReadersMap
        readers={[]}
        readersLoading={true}
        readersError={null}
        mapsLoaded={false}
        darkMapStyle={[]}
        selectedBook={null}
      />
    );

    expect(screen.getByText('Loading readers map...')).toBeInTheDocument();
  });

  it('prompts user to select a book when no book is selected', () => {
    render(
      <ReadersMap
        readers={[]}
        readersLoading={false}
        readersError={null}
        mapsLoaded={true}
        darkMapStyle={[]}
        selectedBook={null}
      />
    );

    expect(screen.getByText('Select a book to view readers')).toBeInTheDocument();
    expect(screen.getByText(/Choose a book from your bookshelf to see who else is reading/i)).toBeInTheDocument();
  });

  it('displays error state when readersError is provided', () => {
    render(
      <ReadersMap
        readers={[]}
        readersLoading={false}
        readersError="Database connection timeout"
        mapsLoaded={true}
        darkMapStyle={[]}
        selectedBook={{ id: 'b1', title: 'The God of Small Things' }}
      />
    );

    expect(screen.getByText('Unable to load readers')).toBeInTheDocument();
    expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
  });

  it('displays empty state when selected book has no nearby readers', () => {
    render(
      <ReadersMap
        readers={[]}
        readersLoading={false}
        readersError={null}
        mapsLoaded={true}
        darkMapStyle={[]}
        selectedBook={{ id: 'b1', title: 'Midnight’s Children' }}
      />
    );

    expect(screen.getByText('No readers found nearby')).toBeInTheDocument();
    expect(screen.getByText(/Be the first to share your location for "Midnight’s Children"/i)).toBeInTheDocument();
  });

  it('renders readers counter and summary card when readers are present', () => {
    const readers = [
      {
        latitude: 28.6139,
        longitude: 77.209,
        user_id: 'u1',
        profiles: { full_name: 'Aarav Sharma', username: 'aarav' },
        book_status: 'reading',
        distance: 2.5,
      },
      {
        latitude: 28.62,
        longitude: 77.215,
        user_id: 'u2',
        profiles: { full_name: 'Diya Patel', username: 'diya' },
        book_status: 'completed',
        distance: 4.1,
      },
    ];

    render(
      <ReadersMap
        readers={readers}
        readersLoading={false}
        readersError={null}
        mapsLoaded={true}
        darkMapStyle={[]}
        selectedBook={{ id: 'b1', title: 'The White Tiger' }}
      />
    );

    expect(screen.getByText('Found 2 readers nearby')).toBeInTheDocument();
    expect(screen.getByText('Reading "The White Tiger"')).toBeInTheDocument();
  });

  it('initializes Google map and markers when google.maps is present on window', () => {
    const setMapMock = vi.fn();
    const setCenterMock = vi.fn();
    const setZoomMock = vi.fn();
    const addListenerMock = vi.fn();

    const mockMapInstance = {
      setCenter: setCenterMock,
      setZoom: setZoomMock,
      addListener: addListenerMock,
      fitBounds: vi.fn(),
    };

    const mockMapConstructor = vi.fn(function () {
      return mockMapInstance;
    });
    const mockMarkerConstructor = vi.fn(function () {
      return {
        setMap: setMapMock,
        addListener: addListenerMock,
        getPosition: () => ({ lat: 19.076, lng: 72.8777 }),
      };
    });
    const mockInfoWindow = vi.fn(function () {
      return {
        close: vi.fn(),
        setContent: vi.fn(),
        open: vi.fn(),
      };
    });

    (window as any).google = {
      maps: {
        Map: mockMapConstructor,
        Marker: mockMarkerConstructor,
        InfoWindow: mockInfoWindow,
        SymbolPath: {
          CIRCLE: 0,
        },
        Animation: {
          DROP: 1,
          BOUNCE: 2,
        },
        Point: function (x: number, y: number) {
          return { x, y };
        },
        Size: function (width: number, height: number) {
          return { width, height };
        },
        LatLngBounds: function () {
          return {
            extend: vi.fn(),
          };
        },
        event: {
          addListener: addListenerMock,
        },
      },
    };

    const readers = [
      {
        latitude: 19.076,
        longitude: 72.8777,
        user_id: 'mumbai-reader',
        profiles: { full_name: 'Priya Sen', username: 'priya' },
      },
    ];

    render(
      <ReadersMap
        readers={readers}
        readersLoading={false}
        readersError={null}
        mapsLoaded={true}
        darkMapStyle={[]}
        selectedBook={{ id: 'b2', title: 'Sacred Games' }}
        userLocation={{ lat: 19.076, lng: 72.8777 }}
      />
    );

    expect(mockMapConstructor).toHaveBeenCalled();
    expect(setCenterMock).toHaveBeenCalledWith({ lat: 19.076, lng: 72.8777 });
  });
});
