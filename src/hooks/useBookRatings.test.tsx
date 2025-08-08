import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useBookRatings } from './useBookRatings';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('useBookRatings', () => {
  it('returns aggregate and user rating', async () => {
    const aggMaybeSingle = vi.fn().mockResolvedValue({ data: { avg_rating: 4.5, rating_count: 2 }, error: null });
    const userMaybeSingle = vi.fn().mockResolvedValue({ data: { rating: 5 }, error: null });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'book_ratings_agg') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: aggMaybeSingle,
        } as any;
      }
      if (table === 'book_ratings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: userMaybeSingle,
        } as any;
      }
      return {} as any;
    });

    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'u1' } } });

    const qc = new QueryClient();
    const { result } = renderHook(() => useBookRatings('b1'), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual({ average: 4.5, count: 2, userRating: 5 });
  });
});
