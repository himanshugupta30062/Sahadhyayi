// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapPage from './Map';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { getMyLocationSharingState } from '@/lib/locationSharingService';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

const mapPageMocks = vi.hoisted(() => ({
  friends: [] as any[],
  refetchFriends: vi.fn(),
}));

vi.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({
    data: mapPageMocks.friends,
    isLoading: false,
    error: null,
    refetch: mapPageMocks.refetchFriends,
  }),
}));

vi.mock('@/hooks/useUserAvatar', () => ({
  useUserAvatar: () => ({ data: { avatar_img_url: 'https://cdn.sahadhyayi.com/avatars/self.svg', avatar_json: { hairStyle: 'curly' } } }),
  useUpdateUserAvatar: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/locationSharingService', () => ({
  getMyLocationSharingState: vi.fn(),
}));

vi.mock('@/components/maps/MapplsMap', () => ({
  MapplsMap: ({ points, center }: { points: Array<{ id: string; title: string; avatarUrl?: string | null }>; center: any }) => (
    <div data-testid="mappls-map" data-center={JSON.stringify(center)} data-avatars={points.map((p) => p.avatarUrl || '').join(',')}>
      {points.map((p) => `${p.id}:${p.title}`).join('; ')}
    </div>
  ),
}));

vi.mock('@/components/social/BookFilterDropdown', () => ({
  BookFilterDropdown: ({ onBookSelect }: { onBookSelect: (book: { id: string; title: string }) => void }) => (
    <button type="button" onClick={() => onBookSelect({ id: 'book-123', title: 'Songs of Kabir' })}>
      Select Book
    </button>
  ),
}));

describe('MapPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mapPageMocks.friends = [];
    mapPageMocks.refetchFriends.mockReset();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders user location on readers map and syncs book location when selected', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-me' } } as any);

    vi.mocked(getMyLocationSharingState).mockResolvedValue({
      hasConsent: true,
      isSharing: true,
      location: { lat: 28.5, lng: 77.2 },
    });

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(((fn: string, args: any) => {
      if (fn === 'get_nearby_book_readers') {
        return Promise.resolve({
          data: [
            {
              reader_id: 'friend-2',
              reader_name: 'Friend Two',
              avatar_img_url: 'https://cdn.sahadhyayi.com/avatars/friend.svg',
              approximate_latitude: 28.52,
              approximate_longitude: 77.22,
              distance_km: '2.1',
            },
          ],
          error: null,
        });
      }
      if (fn === 'share_book_location') {
        return Promise.resolve({ data: 'loc-1', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }) as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Initially without book selected, user is already plotted
    await waitFor(() => {
      const mapEl = screen.getByTestId('mappls-map');
      expect(mapEl).toHaveTextContent('self:You (Your location)');
    });

    // Select book
    fireEvent.click(screen.getByRole('button', { name: 'Select Book' }));

    // Should sync book location to user_books_location via RPC
    await waitFor(() => {
      expect(rpcSpy).toHaveBeenCalledWith('share_book_location', {
        book_uuid: 'book-123',
        lat: 28.5,
        lng: 77.2,
      });
    });

    // Both self and friend are plotted on the map
    await waitFor(() => {
      const mapEl = screen.getByTestId('mappls-map');
      expect(mapEl).toHaveTextContent('self:You (Your location)');
      expect(mapEl).toHaveTextContent('friend-2:Friend Two');
      expect(mapEl.getAttribute('data-avatars')).toContain('https://cdn.sahadhyayi.com/avatars/self.svg');
      expect(mapEl.getAttribute('data-avatars')).toContain('https://cdn.sahadhyayi.com/avatars/friend.svg');
      expect(screen.getByText('2.1 km away')).toBeInTheDocument();
    });
  });
  it('renders real friend avatars on the Friends tab and refreshes that tab when opened', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-me' } } as any);
    vi.mocked(getMyLocationSharingState).mockResolvedValue({
      hasConsent: true,
      isSharing: true,
      location: { lat: 28.5, lng: 77.2 },
    });
    mapPageMocks.friends = [{
      id: 'friendship-1',
      user1_id: 'user-me',
      user2_id: 'friend-1',
      friend_profile: {
        id: 'friend-1',
        full_name: 'Friend One',
        username: 'friendone',
        profile_photo_url: 'https://cdn.sahadhyayi.com/avatars/friend-photo.svg',
        avatar_img_url: 'https://cdn.sahadhyayi.com/avatars/friend-bitmoji.svg',
        location_sharing: true,
        location_lat: 28.61,
        location_lng: 77.31,
      },
    }];

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByRole('tab', { name: /Friends Map/ });
    fireEvent.click(screen.getByRole('tab', { name: /Friends Map/ }));

    await waitFor(() => {
      const mapEl = screen.getByTestId('mappls-map');
      expect(mapEl).toHaveTextContent('friendship-1:Friend One');
      expect(mapEl.getAttribute('data-avatars')).toContain('https://cdn.sahadhyayi.com/avatars/self.svg');
      expect(mapEl.getAttribute('data-avatars')).toContain('https://cdn.sahadhyayi.com/avatars/friend-bitmoji.svg');
    });
    expect(mapPageMocks.refetchFriends).toHaveBeenCalled();
  });

  it('falls back to profile photo when custom Bitmoji is not available for a friend', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-me' } } as any);
    vi.mocked(getMyLocationSharingState).mockResolvedValue({
      hasConsent: true,
      isSharing: true,
      location: { lat: 28.5, lng: 77.2 },
    });
    mapPageMocks.friends = [{
      id: 'friendship-2',
      user1_id: 'user-me',
      user2_id: 'friend-2',
      friend_profile: {
        id: 'friend-2',
        full_name: 'Priya Sharma',
        username: 'priya',
        profile_photo_url: 'https://cdn.sahadhyayi.com/photos/priya.jpg',
        avatar_img_url: null,
        location_sharing: true,
        location_lat: 28.65,
        location_lng: 77.35,
      },
    }];

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByRole('tab', { name: /Friends Map/ });
    fireEvent.click(screen.getByRole('tab', { name: /Friends Map/ }));

    await waitFor(() => {
      const mapEl = screen.getByTestId('mappls-map');
      expect(mapEl).toHaveTextContent('friendship-2:Priya Sharma');
      expect(mapEl.getAttribute('data-avatars')).toContain('https://cdn.sahadhyayi.com/photos/priya.jpg');
    });
  });

  it('renders avatar image in the active readers bottom card list', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-me' } } as any);
    vi.mocked(getMyLocationSharingState).mockResolvedValue({
      hasConsent: true,
      isSharing: true,
      location: { lat: 28.5, lng: 77.2 },
    });

    vi.spyOn(supabase, 'rpc').mockImplementation(((fn: string) => {
      if (fn === 'get_nearby_book_readers') {
        return Promise.resolve({
          data: [
            {
              reader_id: 'reader-aarav',
              reader_name: 'Aarav Patel',
              avatar_img_url: 'https://cdn.sahadhyayi.com/avatars/aarav.png',
              approximate_latitude: 28.54,
              approximate_longitude: 77.24,
              distance_km: '3.5',
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }) as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select Book' }));

    await waitFor(() => {
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      const readerImg = screen.getByRole('img', { name: 'Aarav Patel' });
      expect(readerImg).toHaveAttribute('src', 'https://cdn.sahadhyayi.com/avatars/aarav.png');
    });
  });

});

