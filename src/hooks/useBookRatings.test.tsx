import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBookRatings } from './useBookRatings';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'rater-1' } },
      }),
    },
  },
}));

describe('useBookRatings', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('returns aggregated rating and individual user rating', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'book_ratings_agg') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { avg_rating: 4.5, rating_count: 10, book_id: 'book-1' },
                error: null,
              }),
            }),
          }),
        } as any;
      }
      if (table === 'book_ratings') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { rating: 5 },
                  error: null,
                }),
              }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useBookRatings('book-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.average).toBe(4.5);
    expect(result.current.data?.count).toBe(10);
    expect(result.current.data?.userRating).toBe(5);
  });
});
