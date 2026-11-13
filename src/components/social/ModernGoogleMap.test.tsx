import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModernGoogleMap } from './ModernGoogleMap';
import { supabase } from '@/integrations/supabase/client-universal';
import { toast } from 'sonner';

vi.mock('@/config/maps', () => ({
  GOOGLE_MAPS_API_KEY: 'test-valid-google-maps-api-key-with-over-20-chars',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client-universal', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return {
    supabase: {
      from: vi.fn(),
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
    },
  };
});

describe('ModernGoogleMap', () => {
  let mockMapInstance: any;
  let mockMarkerInstance: any;
  let mockInfoWindowInstance: any;

  beforeEach(() => {
    mockMapInstance = {
      setCenter: vi.fn(),
      setZoom: vi.fn(),
    };
    mockMarkerInstance = {
      setMap: vi.fn(),
      addListener: vi.fn(),
    };
    mockInfoWindowInstance = {
      open: vi.fn(),
      close: vi.fn(),
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
        MapTypeId: { ROADMAP: 'roadmap' },
        SymbolPath: { CIRCLE: 0 },
      },
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'r-1',
              name: 'Kabir Das',
              book: 'Bijak',
              lat: 25.3176,
              lng: 82.9739,
              created_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'reader-123' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google Maps and reader list with real-time readers', async () => {
    render(<ModernGoogleMap />);

    // Trigger map initialization callback
    if ((window as any).initMap) {
      await (window as any).initMap();
    }

    expect(await screen.findByText('📍 Readers Near You')).toBeInTheDocument();
    expect(await screen.findByText('Kabir Das')).toBeInTheDocument();
    expect(screen.getByText('Bijak')).toBeInTheDocument();
    expect(screen.getByText('Live Readers (1)')).toBeInTheDocument();
  });

  it('allows user to share location via dialog', async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 28.6139,
          longitude: 77.2090,
        },
      });
    });

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    render(<ModernGoogleMap />);

    if ((window as any).initMap) {
      await (window as any).initMap();
    }

    const shareBtn = await screen.findByRole('button', { name: /share my location/i });
    fireEvent.click(shareBtn);

    expect(mockGetCurrentPosition).toHaveBeenCalled();

    // Dialog should open
    expect(await screen.findByText('📍 Share Your Reading Location')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Enter your name');
    const bookInput = screen.getByPlaceholderText('What book are you reading?');

    fireEvent.change(nameInput, { target: { value: 'Premchand' } });
    fireEvent.change(bookInput, { target: { value: 'Godaan' } });

    const submitBtn = screen.getByRole('button', { name: /^share location$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('readers');
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Your location has been shared')
      );
    });
  });

  it('validates empty inputs before saving location', async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 28.61, longitude: 77.20 } });
    });
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    render(<ModernGoogleMap />);
    if ((window as any).initMap) {
      await (window as any).initMap();
    }

    const shareBtn = await screen.findByRole('button', { name: /share my location/i });
    fireEvent.click(shareBtn);

    const submitBtn = await screen.findByRole('button', { name: /^share location$/i });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith('Please fill in all fields.');
  });
});

