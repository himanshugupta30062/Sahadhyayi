import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RelatedArticles from './RelatedArticles';

vi.mock('@/hooks/useRelatedArticles', () => ({
  useRelatedArticles: () => ({
    data: [
      {
        id: 'rel-1',
        title: 'Deep Work Strategies',
        slug: 'deep-work-strategies',
        reading_time_minutes: 5,
        author_name: 'Cal Newport',
      },
    ],
    isLoading: false,
  }),
}));

describe('RelatedArticles', () => {
  it('renders related article cards and links', () => {
    render(
      <MemoryRouter>
        <RelatedArticles article={{ id: 'current-art', tags: ['productivity'], user_id: 'user-1' }} />
      </MemoryRouter>
    );

    expect(screen.getByText('More to read')).toBeInTheDocument();
    expect(screen.getByText('Deep Work Strategies')).toBeInTheDocument();
    expect(screen.getByText(/5m/i)).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/articles/deep-work-strategies');
  });
});
