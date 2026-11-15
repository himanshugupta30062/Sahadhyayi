import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useExploreSpots, useSavedMapPlaces } from './useExploreSpots';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'test-user-1' } }),
}));

describe('useExploreSpots', () => {
  it('loads explore map items via RPC get_explore_map_items', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: [
        {
          id: 'spot-123',
          item_type: 'reading_spot',
          title: 'Asiatic Society Library',
          slug: 'asiatic-society-library',
          category: 'library',
          latitude: 18.92,
          longitude: 72.83,
          address: 'Fort',
          city: 'Mumbai',
          image_url: 'https://images.example.com/library.jpg',
          description: 'Historic library',
          distance_km: 2.5,
          extra_meta: { amenities: ['wifi'] },
        },
      ],
      error: null,
    } as any);

    const { result } = renderHook(() => useExploreSpots({ category: 'all' }), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].title).toBe('Asiatic Society Library');
      expect(result.current.data?.[0].distance_km).toBe(2.5);
    });
  });

  it('manages saved map places for authenticated user', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'save-1',
            user_id: 'test-user-1',
            spot_id: 'spot-123',
            notes: 'Loved the reading room',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
    });

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'saved_map_places') {
        return {
          select: mockSelect,
        } as any;
      }
      return {} as any;
    }) as any);

    const { result } = renderHook(() => useSavedMapPlaces(), { wrapper });

    await waitFor(() => {
      expect(result.current.savedPlaces.length).toBe(1);
      expect(result.current.isSaved('spot-123')).toBe(true);
      expect(result.current.isSaved('spot-999')).toBe(false);
    });
  });
});
