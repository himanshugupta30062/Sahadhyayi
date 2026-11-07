// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoriesFeed } from './StoriesFeed';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'reader-1', email: 'reader@example.com' },
  }),
}));

const mockStoriesList = [
  {
    id: 'story-1',
    title: 'The Silent Banyan',
    description: 'A tranquil reflection under the ancient banyan tree.',
    author_id: 'author-1',
    author_name: 'Rabindranath Tagore',
    genre: 'Literary Fiction',
    is_series: false,
    status: 'published',
    completion_status: 'completed',
    parts_count: 1,
    reading_time_minutes: 4,
    likes_count: 15,
    bookmarks_count: 4,
    created_at: '2026-11-05T00:00:00Z',
    updated_at: '2026-11-05T00:00:00Z',
  },
  {
    id: 'story-2',
    title: 'Chronicles of Malgudi',
    description: 'A 5-part serial revolving around the old railway station.',
    author_id: 'author-2',
    author_name: 'R. K. Narayan',
    genre: 'Slice of Life',
    story_type: 'series',
    is_series: true,
    status: 'published',
    completion_status: 'ongoing',
    parts_count: 5,
    reading_time_minutes: 18,
    likes_count: 38,
    bookmarks_count: 12,
    created_at: '2026-11-02T00:00:00Z',
    updated_at: '2026-11-06T00:00:00Z',
  },
];

vi.mock('@/hooks/useStories', () => ({
  useStories: () => ({
    data: mockStoriesList,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useContinueReadingStories: () => ({
    data: [],
    isLoading: false,
  }),
  useToggleStoryLike: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleStoryBookmark: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateStory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateStoryPart: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStoryPart: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('StoriesFeed Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderStoriesFeed = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StoriesFeed />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders stories discovery hero, publishing button and story cards', () => {
    renderStoriesFeed();

    expect(screen.getByText('Stories from Readers')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /write a story/i }).length).toBeGreaterThan(0);

    expect(screen.getAllByText('The Silent Banyan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Chronicles of Malgudi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rabindranath Tagore').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R. K. Narayan').length).toBeGreaterThan(0);
  });

  it('displays story series badges and reading duration', () => {
    renderStoriesFeed();

    expect(screen.getAllByText(/parts/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ongoing/i).length).toBeGreaterThan(0);
  });

  it('opens story creation dialog when clicking Write a Story', () => {
    renderStoriesFeed();

    const writeButtons = screen.getAllByRole('button', { name: /write a story/i });
    fireEvent.click(writeButtons[0]);

    // Dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Write a Short Story/i)).toBeInTheDocument();
  });
});
