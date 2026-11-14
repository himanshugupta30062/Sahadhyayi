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

vi.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({ data: [], isLoading: false }),
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
              distance_km: 2.1,
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
    });
  });
});

