// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Activity from './Activity';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'reader@example.com' },
  }),
}));

vi.mock('@/hooks/useReadingChallenges', () => ({
  useChallenges: () => ({
    data: [
      {
        id: 'challenge-1',
        slug: 'poetry-30',
        name: '30 Days of Poetry',
        description: 'Read 1 poem each day for 30 days',
        goal: 30,
        is_active: true,
        challenge_type: 'books',
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
  }),
  useUserChallenges: () => ({
    data: [
      {
        id: 'uc-1',
        challenge_id: 'challenge-1',
        user_id: 'user-1',
        progress: 15,
        completed: false,
        joined_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-02T00:00:00Z',
      },
    ],
  }),
  useJoinChallenge: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/hooks/useGroupManagement', () => ({
  useGroups: () => ({
    data: [
      {
        id: 'group-1',
        name: 'Delhi Classics Circle',
        description: 'Exploring Hindi and Indian classical literature together.',
        member_count: 85,
        is_private: false,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useUserGroups', () => ({
  useUserJoinedGroups: () => ({
    data: [
      {
        id: 'group-1',
        name: 'Delhi Classics Circle',
      },
    ],
  }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({
            data: [
              {
                id: 'evt-1',
                title: 'Jaipur Literature Circle',
                description: 'Annual author roundtable and book exchange.',
                start_at: '2026-12-10T10:00:00Z',
                venue: 'City Palace Hall',
                city: 'Jaipur',
                is_online: false,
                rsvp_count: 120,
              },
            ],
            error: null,
          }),
        }),
      }),
    }),
  },
}));

describe('Activity Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderActivity = (initialEntries = ['/activity']) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Activity />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders the core interactive reading hub hero and categories', () => {
    renderActivity();

    expect(screen.getByText('Interactive Reading Hub')).toBeInTheDocument();
    expect(screen.getByText(/Read, play, and connect/i)).toBeInTheDocument();

    // Check category pills exist
    expect(screen.getByRole('button', { name: 'All Activities' })).toBeInTheDocument();
    expect(screen.getAllByText('Reading Challenges').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Book Games').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reading Groups').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Meetups').length).toBeGreaterThan(0);
  });

  it('displays user active challenge progress', () => {
    renderActivity();

    expect(screen.getAllByText('30 Days of Poetry').length).toBeGreaterThan(0);
    expect(screen.getAllByText('50% done').length).toBeGreaterThan(0); // 15 / 30 = 50%
    expect(screen.getAllByText('15 of 30 books read').length).toBeGreaterThan(0);
  });

  it('filters activities when clicking category buttons', () => {
    renderActivity();

    // Click on Book Games category card
    const gamesCard = screen.getAllByRole('heading', { name: 'Book Games' })[0].closest('button')!;
    fireEvent.click(gamesCard);

    // Book Games section should be present
    expect(screen.getAllByText('Literary Trivia Quest').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Daily Book Challenge').length).toBeGreaterThan(0);
  });

  it('filters activities via search input', () => {
    renderActivity();

    const searchInputs = screen.getAllByPlaceholderText('Filter activities...');
    fireEvent.change(searchInputs[0], { target: { value: 'Delhi Classics' } });

    expect(screen.getAllByText('Delhi Classics Circle').length).toBeGreaterThan(0);
  });
});
