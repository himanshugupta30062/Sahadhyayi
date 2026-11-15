import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthorGrid from './AuthorGrid';

vi.mock('@/hooks/useAuthorFollowerCount', () => ({
  useAuthorFollowerCount: () => ({ data: 120, isLoading: false }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('AuthorGrid', () => {
  const sampleAuthors = [
    {
      id: 'author-1',
      name: 'Premchand',
      bio: 'Celebrated Hindi novelist and short story writer.',
      genre: 'Fiction',
      rating: 4.9,
      books_count: 24,
      followers_count: 5000,
      verified: true,
      books: ['Godan', 'Gaban'],
    },
    {
      id: 'author-2',
      name: 'Rabindranath Tagore',
      bio: 'Nobel laureate polymath, poet and dramatist.',
      genre: 'Poetry',
      rating: 5.0,
      books_count: 35,
      followers_count: 10000,
      verified: true,
      books: ['Gitanjali'],
    },
  ];

  it('renders author list with counts and names', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthorGrid authors={sampleAuthors} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/featured authors/i)).toBeInTheDocument();
    expect(screen.getByText(/2 authors found/i)).toBeInTheDocument();
    expect(screen.getByText('Premchand')).toBeInTheDocument();
    expect(screen.getByText('Rabindranath Tagore')).toBeInTheDocument();
  });
});
