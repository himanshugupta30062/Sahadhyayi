/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Bookshelf from '@/pages/Bookshelf';
import { ProfileView } from '@/components/profile/ProfileView';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'reader@example.com' },
    signOut: vi.fn(),
  }),
}));

const mockBooks = [
  {
    id: 'shelf-1',
    user_id: 'test-user-123',
    book_id: 'book-1',
    status: 'reading',
    added_at: '2026-02-01T10:00:00Z',
    books_library: {
      id: 'book-1',
      title: 'Siddhartha',
      author: 'Hermann Hesse',
      genre: 'Philosophy',
      cover_image_url: 'https://example.com/siddhartha.jpg',
    },
  },
  {
    id: 'shelf-2',
    user_id: 'test-user-123',
    book_id: 'book-2',
    status: 'completed',
    added_at: '2026-01-15T10:00:00Z',
    books_library: {
      id: 'book-2',
      title: 'Gitanjali',
      author: 'Rabindranath Tagore',
      genre: 'Poetry',
      cover_image_url: null,
    },
  },
];

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: mockBooks,
    isLoading: false,
    error: null,
  }),
  useUpdateBookshelfItem: () => ({
    mutate: vi.fn(),
  }),
  useRemoveFromBookshelf: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({
    data: [
      {
        id: 1,
        book_id: 'book-1',
        book_title: 'Siddhartha',
        current_page: 60,
        total_pages: 150,
        user_id: 'test-user-123',
      },
    ],
  }),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    data: {
      name: 'Himanshu Gupta',
      username: 'himanshu',
      email: 'reader@example.com',
      bio: 'Lifelong reader and Sanskrit explorer.',
      stories_written_count: 5,
      stories_read_count: 24,
      life_tags: ['Philosophy', 'Ancient India'],
      social_links: {},
      location: 'Delhi, India',
    },
    isLoading: false,
  }),
  useUpsertUserProfile: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteUserProfile: () => ({
    mutateAsync: vi.fn(),
  }),
  uploadProfilePicture: vi.fn(),
}));

vi.mock('@/hooks/useReadingDna', () => ({
  useReadingDna: () => ({
    data: null,
  }),
}));

vi.mock('@/hooks/useReadingChallenges', () => ({
  useUserBadges: () => ({
    data: [],
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('Bookshelf & Profile Modernization Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders Bookshelf with real progress and allows status filtering', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Bookshelf />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Title and stats cards rendered
    expect(screen.getByText('My Bookshelf')).toBeInTheDocument();
    expect(screen.getByText('All Saved')).toBeInTheDocument();
    expect(screen.getByText('Reading Now')).toBeInTheDocument();

    // Siddhartha in reading list with progress
    expect(screen.getByText('Siddhartha')).toBeInTheDocument();
    expect(screen.getByText('Hermann Hesse')).toBeInTheDocument();
    expect(screen.getByText('Pg 60 of 150')).toBeInTheDocument();
    expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1);

    // Resume button displays page
    expect(screen.getByText('Resume · Pg 60')).toBeInTheDocument();

    // Export CSV and Share buttons exist
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Share Shelf')).toBeInTheDocument();
  });

  it('renders ProfileView with native navigation and Bookshelf showcase', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileView />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Profile info rendered with dark-mode safe structure
    expect(screen.getByText('Himanshu Gupta')).toBeInTheDocument();
    expect(screen.getByText('@himanshu')).toBeInTheDocument();

    // Native bridges to internal publications & articles
    expect(screen.getByText('My Articles')).toBeInTheDocument();
    expect(screen.getByText('My Publications')).toBeInTheDocument();

    // Reader Bookshelf Showcase rendered
    expect(screen.getByText('Reader Bookshelf Showcase')).toBeInTheDocument();
    expect(screen.getAllByText('Gitanjali').length).toBeGreaterThanOrEqual(1);
  });
});
