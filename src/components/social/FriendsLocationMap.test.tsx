import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FriendsLocationMap, createFriendInfoContent } from '@/components/social/FriendsLocationMap';
import { useAuth } from '@/contexts/authHelpers';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/integrations/supabase/client-universal';
import { getCurrentLocation } from '@/lib/locationService';
import { toast } from 'sonner';

const locationMocks = vi.hoisted(() => ({
  getMyLocationSharingState: vi.fn(),
  saveMyLocation: vi.fn(),
  disableMyLocationSharing: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useFriends', () => ({
  useFriends: vi.fn(),
}));

vi.mock('@/lib/locationService', () => ({
  getCurrentLocation: vi.fn(),
}));

vi.mock('@/lib/locationSharingService', () => ({
  getMyLocationSharingState: locationMocks.getMyLocationSharingState,
  saveMyLocation: locationMocks.saveMyLocation,
  disableMyLocationSharing: locationMocks.disableMyLocationSharing,
}));

vi.mock('@/hooks/useUserAvatar', () => ({
  useUserAvatar: () => ({ data: { avatar_img_url: 'https://cdn.sahadhyayi.com/avatars/self.svg' }, isLoading: false }),
  useUpdateUserAvatar: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/components/social/BitmojiCreator', () => ({
  BitmojiCreator: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div role="dialog">Create your reading avatar</div> : null,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/maps/MapplsMap', () => ({
  MapplsMap: ({ points, emptyMessage }: any) => (
    <div data-testid="mappls-map" data-avatars={points.map((point: any) => point.avatarUrl || '').join(',')}>
      <span>Points: {points.length}</span>
      {points.length === 0 && <span>{emptyMessage}</span>}
    </div>
  ),
}));

vi.mock('./LocationConsentModal', () => ({
  LocationConsentModal: ({ isOpen, onConsentGiven, onClose }: any) =>
    isOpen ? (
      <div data-testid="consent-modal">
        <button onClick={onConsentGiven}>Agree & Share</button>
        <button onClick={onClose}>Cancel Consent</button>
      </div>
    ) : null,
}));

vi.mock('./LocationPermissionModal', () => ({
  LocationPermissionModal: ({ isOpen, onRequestLocation, onClose, errorMessage }: any) =>
    isOpen ? (
      <div data-testid="permission-modal">
        {errorMessage && <span>{errorMessage}</span>}
        <button onClick={onRequestLocation}>Grant Permission</button>
        <button onClick={onClose}>Close Permission</button>
      </div>
    ) : null,
}));

vi.mock('@/integrations/supabase/client-universal', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
    },
  };
});

const render = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('createFriendInfoContent', () => {
  it('renders a full name and initial as text rather than interpreting profile HTML', () => {
    const content = createFriendInfoContent({
      full_name: '<img src=x onerror=alert(1)>',
      username: 'reader',
      bio: '<script>alert("xss")</script>',
    });

    expect(content.querySelector('img')).toBeNull();
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('h3')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(content.textContent).toContain('<script>alert("xss")</script>');
    expect(content.querySelector('div div')?.textContent?.trim().charAt(0)).toBe('<');
  });

  it('falls back to username and omits blank biographies', () => {
    const content = createFriendInfoContent({ username: '  bookfriend  ', bio: '   ' });

    expect(content.querySelector('h3')?.textContent).toBe('  bookfriend  ');
    expect(content.textContent).toContain('Friend');
    expect(content.querySelectorAll('p')).toHaveLength(1);
  });

  it('uses safe defaults when profile fields are missing', () => {
    const content = createFriendInfoContent({});

    expect(content.querySelector('h3')?.textContent).toBe('Friend');
    expect(content.textContent).toContain('Friend');
    expect(content.querySelector('div div')?.textContent?.trim().charAt(0)).toBe('F');
    expect(content.querySelectorAll('p')).toHaveLength(1);
  });

  it('trims a non-empty biography before displaying it', () => {
    const content = createFriendInfoContent({ full_name: 'Reader', bio: '  Loves classic books  ' });

    expect(content.querySelectorAll('p')[1]?.textContent).toBe('Loves classic books');
  });
});

describe('FriendsLocationMap component', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as any).mockReturnValue({
      user: { id: 'user-self', email: 'reader@example.com' },
    });

    (useFriends as any).mockReturnValue({
      data: [
        {
          id: 'friend-1',
          friend_profile: {
            id: 'friend-user-1',
            full_name: 'Aarav',
            location_sharing: true,
            location_lat: 28.6139,
            location_lng: 77.209,
            avatar_img_url: 'https://cdn.sahadhyayi.com/avatars/friend.svg',
          },
        },
      ],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { location_sharing: false, location_lat: null, location_lng: null },
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'user_locations') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
      };
    });

    locationMocks.getMyLocationSharingState.mockReset().mockResolvedValue({
      hasConsent: false, isSharing: false, location: null,
    });
    locationMocks.saveMyLocation.mockReset().mockResolvedValue(undefined);
    locationMocks.disableMyLocationSharing.mockReset().mockResolvedValue(undefined);
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });
    (getCurrentLocation as any).mockResolvedValue({ lat: 28.7, lng: 77.1 });
  });

  it('renders friend markers and count correctly', async () => {
    render(<FriendsLocationMap />);

    expect(screen.getByText('Friends Map')).toBeInTheDocument();
    expect(await screen.findByText('1 friend is sharing location')).toBeInTheDocument();
    expect(screen.getByTestId('mappls-map')).toHaveTextContent('Points: 1');
    expect(screen.getByTestId('mappls-map').getAttribute('data-avatars')).toContain('https://cdn.sahadhyayi.com/avatars/friend.svg');
  });

  it('handles Center on me button click', async () => {
    render(<FriendsLocationMap />);

    const centerBtn = await screen.findByRole('button', { name: /center on me/i });
    fireEvent.click(centerBtn);

    await waitFor(() => {
      expect(getCurrentLocation).toHaveBeenCalled();
    });
  });

  it('allows user to start sharing location through consent modal flow', async () => {
    render(<FriendsLocationMap />);

    // Click "Share my location" button
    const shareBtn = await screen.findByRole('button', { name: /share my location/i });
    fireEvent.click(shareBtn);

    // Consent modal should appear
    expect(screen.getByTestId('consent-modal')).toBeInTheDocument();

    // Give consent
    const agreeBtn = screen.getByRole('button', { name: /agree & share/i });
    fireEvent.click(agreeBtn);

    await waitFor(() => {
      expect(getCurrentLocation).toHaveBeenCalled();
      expect(locationMocks.saveMyLocation).toHaveBeenCalledWith({ lat: 28.7, lng: 77.1 });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Location saved')
      );
    });
  });

  it('allows user to stop sharing location', async () => {
    locationMocks.getMyLocationSharingState.mockResolvedValue({
      hasConsent: true, isSharing: true, location: { lat: 28.5, lng: 77.2 },
    });

    render(<FriendsLocationMap />);

    const stopSharingBtn = await screen.findByRole('button', { name: /stop sharing/i });
    fireEvent.click(stopSharingBtn);

    await waitFor(() => {
      expect(locationMocks.disableMyLocationSharing).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Location sharing disabled.');
    });
  });

  it('shows empty message when no friends are sharing location', async () => {
    (useFriends as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<FriendsLocationMap />);

    expect(await screen.findByText('No friends are currently sharing their location with you')).toBeInTheDocument();
  });
});
