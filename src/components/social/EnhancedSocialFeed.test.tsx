import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { EnhancedSocialFeed } from './EnhancedSocialFeed';
import { useAuth } from '@/contexts/authHelpers';
import { useSocialPosts, useTogglePostLike, useToggleRepost, useDeletePost } from '@/hooks/useSocialPosts';
import { useMarginNotes } from '@/hooks/useMarginNotes';
import { useSpoilerThreads } from '@/hooks/useSpoilerThreads';
import { useSocialPostBookmarks } from '@/hooks/useSocialPostBookmarks';
import { useBatchPostReactions } from '@/hooks/useSocialPostReactions';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useSocialPosts', () => ({
  useSocialPosts: vi.fn(),
  useTogglePostLike: vi.fn(),
  useToggleRepost: vi.fn(),
  useDeletePost: vi.fn(),
}));

vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: vi.fn(),
}));

vi.mock('@/hooks/useSpoilerThreads', () => ({
  useSpoilerThreads: vi.fn(),
}));

vi.mock('@/hooks/useSocialPostBookmarks', () => ({
  useSocialPostBookmarks: vi.fn(),
}));

vi.mock('@/hooks/useSocialPostReactions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useSocialPostReactions')>();
  return {
    ...actual,
    useBatchPostReactions: vi.fn(),
    useTogglePostReaction: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  };
});

vi.mock('./BookPulseBar', () => ({
  BookPulseBar: () => <div data-testid="book-pulse-bar">Book Pulse</div>,
}));

vi.mock('./BookReelsStrip', () => ({
  BookReelsStrip: () => <div data-testid="book-reels-strip">Book Reels</div>,
}));

vi.mock('./FeedComposer', () => ({
  FeedComposer: () => <div data-testid="feed-composer">Post Composer</div>,
}));

vi.mock('./dna/DnaMatchChip', () => ({
  DnaMatchChip: () => <span data-testid="dna-chip" />,
}));

describe('EnhancedSocialFeed', () => {
  const mockMutateLike = vi.fn();
  const mockMutateRepost = vi.fn();
  const mockMutateDelete = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as any).mockReturnValue({
      user: { id: 'reader-1', email: 'reader@example.com' },
    });

    (useTogglePostLike as any).mockReturnValue({ mutate: mockMutateLike });
    (useToggleRepost as any).mockReturnValue({ mutate: mockMutateRepost });
    (useDeletePost as any).mockReturnValue({ mutate: mockMutateDelete });

    (useMarginNotes as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    (useSpoilerThreads as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    (useSocialPostBookmarks as any).mockReturnValue({
      savedPosts: [],
      savedPostIds: [],
      savePost: vi.fn(),
      removePost: vi.fn(),
      isSaving: false,
      isRemoving: false,
      isBookmarked: vi.fn(() => false),
      toggleBookmark: vi.fn(),
    });

    (useBatchPostReactions as any).mockReturnValue({ data: {} });

    (useSocialPosts as any).mockReturnValue({
      posts: [
        {
          id: 'post-101',
          user_id: 'user-202',
          content: 'Just finished reading Gitanjali. Such timeless verses on universal love!',
          created_at: new Date().toISOString(),
          likes_count: 5,
          comments_count: 2,
          reposts_count: 1,
          user_liked: false,
          user_reposted: false,
          profiles: {
            id: 'user-202',
            full_name: 'Rabindranath Tagore',
            username: 'tagore',
            profile_photo_url: 'https://example.com/tagore.jpg',
          },
          books_library: {
            id: 'book-303',
            title: 'Gitanjali',
            author: 'Rabindranath Tagore',
          },
        },
      ],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      hasMore: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
      loadMoreError: null,
    });
  });

  it('renders feed tabs, composer, and posts list', () => {
    render(
      <MemoryRouter>
        <EnhancedSocialFeed />
      </MemoryRouter>
    );

    expect(screen.getByTestId('book-pulse-bar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /for you/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /latest/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument();

    expect(screen.getAllByText('Rabindranath Tagore').length).toBeGreaterThan(0);
    expect(screen.getByText(/Just finished reading Gitanjali/i)).toBeInTheDocument();
    expect(screen.getByText('Gitanjali')).toBeInTheDocument();
  });

  it('handles stream mode switching', () => {
    render(
      <MemoryRouter>
        <EnhancedSocialFeed />
      </MemoryRouter>
    );

    const followingBtn = screen.getByRole('button', { name: /following/i });
    fireEvent.click(followingBtn);

    expect(followingBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles liking a post', () => {
    render(
      <MemoryRouter>
        <EnhancedSocialFeed />
      </MemoryRouter>
    );

    const likeBtn = screen.getByRole('button', { name: /5 likes/i });
    fireEvent.click(likeBtn);

    expect(mockMutateLike).toHaveBeenCalledWith({
      postId: 'post-101',
      isLiked: false,
    });
  });

  it('handles reposting a post', () => {
    render(
      <MemoryRouter>
        <EnhancedSocialFeed />
      </MemoryRouter>
    );

    const repostBtn = screen.getByRole('button', { name: /1 reposts/i });
    fireEvent.click(repostBtn);

    // Modal or mutation triggered
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    (useSocialPosts as any).mockReturnValue({
      posts: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      hasMore: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
      loadMoreError: null,
    });

    render(
      <MemoryRouter>
        <EnhancedSocialFeed />
      </MemoryRouter>
    );

    expect(screen.queryByText('Rabindranath Tagore')).not.toBeInTheDocument();
  });
});
