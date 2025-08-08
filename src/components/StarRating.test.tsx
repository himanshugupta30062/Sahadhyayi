import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import StarRating from './StarRating';
import { useRateBook } from '@/hooks/useBookRatings';
const rateMock = vi.fn();
vi.mock('@/hooks/useBookRatings', () => ({
  useRateBook: () => ({ mutate: rateMock, isPending: false }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function RatingComponent() {
  const rate = useRateBook('1');
  return <StarRating value={0} onChange={(n) => rate.mutate(n)} />;
}

describe('StarRating', () => {
  it('calls mutate when star clicked', async () => {
    render(
      <Wrapper>
        <RatingComponent />
      </Wrapper>
    );
    await userEvent.click(screen.getByLabelText('Rate 3 star'));
    expect(rateMock).toHaveBeenCalledWith(3);
  });
});
