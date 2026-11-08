import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReadingPassportCard } from '@/components/social/ReadingPassportCard';
import { FeedComposer } from '@/components/social/FeedComposer';
import GroupCard from '@/components/groups/GroupCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
const mockUser = {
  id: 'test-user-id',
  email: 'reader@sahadhyayi.com',
  user_metadata: {
    full_name: 'Arundhati Roy',
    username: 'arundhati_roy',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
  })),
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: vi.fn(() => ({
    data: [
      {
        id: 'shelf-1',
        status: 'reading',
        progress: 68,
        book: {
          id: 'book-1',
          title: 'The God of Small Things',
          author: 'Arundhati Roy',
        },
      },
      {
        id: 'shelf-2',
        status: 'completed',
        progress: 100,
        book: {
          id: 'book-2',
          title: 'The Ministry of Utmost Happiness',
          author: 'Arundhati Roy',
        },
      },
    ],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useReadingStreak', () => ({
  useReadingStreak: vi.fn(() => ({
    data: { current: 14, longest: 30 },
  })),
}));

vi.mock('@/hooks/useSocialPosts', () => ({
  useCreatePost: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useSocialPosts: vi.fn(() => ({
    posts: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    hasMore: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
  })),
  useTogglePostLike: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useTogglePostRepost: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/useGroupManagement', () => ({
  DEFAULT_READING_GROUP_NAME: 'General Reading Room',
  useJoinGroup: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useLeaveGroup: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

describe('Social Cabinet, Passport, and Reading Milestones Experience', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders ReadingPassportCard with active book, progress, and streak metrics', () => {
    render(
      <MemoryRouter>
        <ReadingPassportCard />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Arundhati Roy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('Currently Reading')).toBeInTheDocument();
    expect(screen.getByText('The God of Small Things')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('renders milestone tags in FeedComposer and lets user toggle a milestone', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FeedComposer />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Milestone:')).toBeInTheDocument();
    const finishedBookBtn = screen.getByRole('button', { name: /Finished Book/i });
    expect(finishedBookBtn).toBeInTheDocument();
    expect(finishedBookBtn).toHaveAttribute('aria-pressed', 'false');

    // Click milestone button to toggle
    fireEvent.click(finishedBookBtn);
    expect(finishedBookBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders next-gen badges (Book of the Month and Spoiler-Safe) on GroupCard', () => {
    const mockGroup = {
      id: 'group-1',
      name: 'South Asian Literature Circle',
      description: 'Discussing regional masterpieces and translations',
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      is_encrypted: false,
      group_members: [{ count: 42 }],
    };

    render(
      <MemoryRouter>
        <GroupCard group={mockGroup} isJoined={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Book of the Month')).toBeInTheDocument();
    expect(screen.getByText('Spoiler-Safe Discussions')).toBeInTheDocument();
    expect(screen.getByText('42 members')).toBeInTheDocument();
  });
});
