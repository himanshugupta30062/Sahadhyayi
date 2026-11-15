import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserLocation, useUpdateUserLocation } from './useUserLocation';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'loc-user-1' } }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useUserLocation', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('queries user location from supabase', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'loc-1',
        user_id: 'loc-user-1',
        latitude: 28.6139,
        longitude: 77.2090,
        is_active: true,
      },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useUserLocation(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.latitude).toBe(28.6139);
  });

  it('updates user location via mutation', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'loc-1' },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
    vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any);

    const { result } = renderHook(() => useUpdateUserLocation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ lat: 28.6, lng: 77.2 });
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'loc-user-1',
        latitude: 28.6,
        longitude: 77.2,
      }),
      expect.anything()
    );
  });
});
