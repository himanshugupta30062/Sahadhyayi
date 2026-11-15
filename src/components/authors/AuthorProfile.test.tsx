import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthorProfile from './AuthorProfile';

vi.mock('@/hooks/useAuthorFollowerCount', () => ({
  useAuthorFollowerCount: () => ({ data: 340, isLoading: false }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('AuthorProfile', () => {
  const author = {
    id: 'author-test-1',
    name: 'Arundhati Roy',
    bio: 'Renowned author and political activist.',
    genre: 'Literary Fiction',
    rating: 4.8,
    books_count: 5,
    followers_count: 4200,
    verified: true,
    books: ['The God of Small Things'],
    nextSession: 'Live Q&A Tomorrow',
  };

  it('renders author profile card with stats and handles message dialog', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthorProfile author={author} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Arundhati Roy')).toBeInTheDocument();
    expect(screen.getByText(/renowned author/i)).toBeInTheDocument();
    expect(screen.getByText(/the god of small things/i)).toBeInTheDocument();
    expect(screen.getByText('Live Q&A Tomorrow')).toBeInTheDocument();

    const messageBtn = screen.getByRole('button', { name: /^message$/i });
    expect(messageBtn).toBeInTheDocument();
    fireEvent.click(messageBtn);

    const textarea = screen.getByPlaceholderText(/write your message to arundhati roy/i);
    fireEvent.change(textarea, { target: { value: 'Hello Arundhati!' } });

    const submitBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitBtn);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Message Sent Successfully',
      })
    );
  });
});
