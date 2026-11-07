// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ReaderMap from './ReaderMap';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/maps/MapplsMap', () => ({
  MapplsMap: ({ points, center }: { points: Array<{ id: string; title: string }>; center: any }) => (
    <div data-testid="mappls-map" data-center={JSON.stringify(center)}>
      {points.map((p) => `${p.id}:${p.title}`).join('; ')}
    </div>
  ),
}));

describe('ReaderMap', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders user location and syncs book location when sharing is active', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-me' } } as any);

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { location_lat: 19.07, location_lng: 72.87, location_sharing: true },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    }) as any);

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(((fn: string) => {
      if (fn === 'has_location_consent') {
        return Promise.resolve({ data: true, error: null });
      }
      if (fn === 'get_friend_locations') {
        return Promise.resolve({
          data: [
            {
              id: 'friend-1',
              full_name: 'Anita Desai',
              location_lat: 19.1,
              location_lng: 72.9,
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
      <MemoryRouter initialEntries={['/map/book-456']}>
        <Routes>
          <Route path="/map/:bookId" element={<ReaderMap />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(rpcSpy).toHaveBeenCalledWith('share_book_location', {
        book_uuid: 'book-456',
        lat: 19.07,
        lng: 72.87,
      });
    });

    await waitFor(() => {
      const mapEl = screen.getByTestId('mappls-map');
      expect(mapEl).toHaveTextContent('self:You (Your location)');
      expect(mapEl).toHaveTextContent('friend-1:Anita Desai');
      expect(mapEl.getAttribute('data-center')).toBe(JSON.stringify({ lat: 19.07, lng: 72.87 }));
    });
  });
});
