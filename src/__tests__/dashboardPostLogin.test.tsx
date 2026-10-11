/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CurrentReads from '@/components/dashboard/CurrentReads';
import DashboardCommunityPulse from '@/components/dashboard/DashboardCommunityPulse';
import { saveProgressLocally } from '@/utils/readingProgressStorage';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'reader@example.com', user_metadata: {} },
    loading: false,
  }),
}));

const mockBookshelf = [
  {
    id: 'shelf-1',
    user_id: 'test-user-123',
    book_id: 'book-abc',
    status: 'reading',
    added_at: '2026-01-01',
    books_library: {
      id: 'book-abc',
      title: 'The Discovery of India',
      author: 'Jawaharlal Nehru',
      cover_image_url: 'https://example.com/cover.jpg',
    },
  },
];

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: mockBookshelf,
    isLoading: false,
    error: null,
  }),
  useUpdateBookshelfItem: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({
    data: [
      {
        id: 1,
        book_id: 'book-abc',
        book_title: 'The Discovery of India',
        current_page: 50,
        total_pages: 200,
        user_id: 'test-user-123',
      },
    ],
  }),
}));

vi.mock('@/hooks/useReadingRoom', () => ({
  useReadingRoomLive: () => ({ presence: [] }),
  useReadingRooms: () => ({
    data: [
      {
        id: 'room-1',
        book_id: 'book-abc',
        name: 'Evening Philosophy Circle',
        created_by: 'user-xyz',
        created_at: new Date().toISOString(),
        books_library: {
          title: 'The Discovery of India',
          author: 'Jawaharlal Nehru',
          cover_image_url: null,
          pages: 200,
        },
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useSocialPosts', () => ({
  useSocialPosts: () => ({ posts: [], isLoading: false, error: null }),
}));

vi.mock('@/hooks/useCommunityStats', () => ({
  useCommunityStats: () => ({ stats: { registeredReaders: 12 } }),
}));

vi.mock('@/hooks/useUserGroups', () => ({
  useUserJoinedGroups: () => ({
    data: [{ id: 'group-1', name: 'History Buffs' }],
    isLoading: false,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('Dashboard Post-Login Modernization', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('CurrentReads displays accurate progress percentage and page number from storage', () => {
    const queryClient = createTestQueryClient();

    // Pre-seed local storage with higher progress (page 80 of 200 = 40%)
    saveProgressLocally(
      {
        bookId: 'book-abc',
        currentPage: 80,
        totalPages: 200,
      },
      'test-user-123'
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CurrentReads userId="test-user-123" />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Book title rendered
    expect(screen.getByText('The Discovery of India')).toBeInTheDocument();

    // Progress details rendered
    expect(screen.getByText('Pg 80 of 200')).toBeInTheDocument();
    expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1);

    // Resume button displays the active page
    expect(screen.getByText('Resume · Pg 80')).toBeInTheDocument();
  });

  it('DashboardCommunityPulse renders active rooms and link to join', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardCommunityPulse />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Community Pulse')).toBeInTheDocument();
    expect(screen.getByText('Evening Philosophy Circle')).toBeInTheDocument();
    expect(screen.getByText('1 listed')).toBeInTheDocument();
    expect(screen.getByText('Join')).toBeInTheDocument();
  });
});
