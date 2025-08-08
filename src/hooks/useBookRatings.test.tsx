import { renderHook, waitFor, render, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import StarRating from '@/components/StarRating';
import * as hooks from './useBookRatings';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() }
  }
}));

describe('useBookRatings', () => {
  it('returns aggregate and user rating', async () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    (supabase.from as any)
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { avg_rating: 4, rating_count: 2 }, error: null })
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { rating: 5 }, error: null })
      }));

    const { result } = renderHook(() => hooks.useBookRatings('book1'), { wrapper });
    await waitFor(() => expect(result.current.data?.average).toBe(4));
    expect(result.current.data?.count).toBe(2);
    expect(result.current.data?.userRating).toBe(5);
  });
});

describe('useRateBook', () => {
  it('calls mutate when star clicked', () => {
    const mutate = vi.fn();
    vi.spyOn(hooks, 'useRateBook').mockReturnValue({ mutate, isPending: false } as any);

    const TestComp = () => {
      const rate = hooks.useRateBook('book1');
      return <StarRating value={0} onChange={rate.mutate} />;
    };

    const { getByLabelText } = render(<TestComp />);
    fireEvent.click(getByLabelText('Rate 1 star'));
    expect(mutate).toHaveBeenCalledWith(1);
  });
});
