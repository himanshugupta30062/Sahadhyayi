/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeedComposer } from '@/components/social/FeedComposer';
import { EnhancedSocialFeed } from '@/components/social/EnhancedSocialFeed';
import { EnhancedCommentSection } from '@/components/social/EnhancedCommentSection';

const mockUseAuth = vi.fn();
const mockUseSocialPosts = vi.fn();
const mockTogglePostLike = vi.fn();
const mockToggleRepost = vi.fn();
const mockDeletePost = vi.fn();
const mockCreatePost = vi.fn();
const mockUseMarginNotes = vi.fn();
const mockUseSpoilerThreads = vi.fn();
const mockUsePostComments = vi.fn();
const mockCreateComment = vi.fn();
const mockToggleCommentLike = vi.fn();
const mockToast = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/hooks/useSocialPosts', () => ({
  useSocialPosts: () => mockUseSocialPosts(),
  useTogglePostLike: () => ({
    mutate: mockTogglePostLike,
    isPending: false,
  }),
  useToggleRepost: () => ({
    mutate: mockToggleRepost,
    mutateAsync: mockToggleRepost,
    isPending: false,
  }),
  useDeletePost: () => ({
    mutate: mockDeletePost,
    isPending: false,
  }),
  useCreatePost: () => ({
    mutateAsync: mockCreatePost,
    isPending: false,
  }),
  usePostComments: (postId: string) => mockUsePostComments(postId),
  useCreateComment: () => ({
    mutateAsync: mockCreateComment,
    isPending: false,
  }),
  useToggleCommentLike: () => ({
    mutate: mockToggleCommentLike,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useLibraryBooks', () => ({
  useAllLibraryBooks: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: () => mockUseMarginNotes(),
}));

vi.mock('@/hooks/useSpoilerThreads', () => ({
  useSpoilerThreads: () => mockUseSpoilerThreads(),
}));

vi.mock('@/components/social/BookPulseBar', () => ({
  BookPulseBar: () => <div data-testid="book-pulse-bar">Book Pulse</div>,
}));

vi.mock('@/components/social/dna/DnaMatchChip', () => ({
  DnaMatchChip: ({ userName }: { userName: string }) => (
    <span data-testid="dna-chip">92% match with {userName}</span>
  ),
}));

describe('Phase 6: Social Media & Reading Community Experience', () => {
  const mockUser = {
    id: 'user-reader-1',
    email: 'reader@example.com',
    user_metadata: {
      full_name: 'Ananya Roy',
      avatar_url: 'https://example.com/ananya.jpg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseMarginNotes.mockReturnValue({ data: [] });
    mockUseSpoilerThreads.mockReturnValue({ data: [] });
  });

  afterEach(() => {
    cleanup();
  });

  describe('FeedComposer Component', () => {
    it('renders textarea with accessible label and disables submission when empty', () => {
      render(
        <MemoryRouter>
          <FeedComposer />
        </MemoryRouter>
      );

      const textarea = screen.getByRole('textbox', {
        name: /what are you reading or thinking about\?/i,
      });
      expect(textarea).toBeInTheDocument();

      const postButton = screen.getByRole('button', { name: /^Post$/ });
      expect(postButton).toBeDisabled();
    });

    it('enables post button when user enters valid content and submits via Cmd+Enter', async () => {
      mockCreatePost.mockResolvedValueOnce({ id: 'new-post-1' });

      render(
        <MemoryRouter>
          <FeedComposer />
        </MemoryRouter>
      );

      const textarea = screen.getByRole('textbox', {
        name: /what are you reading or thinking about\?/i,
      });
      fireEvent.change(textarea, { target: { value: 'Finished reading Devdas today! Truly poignant.' } });

      const postButton = screen.getByRole('button', { name: /^Post$/ });
      expect(postButton).not.toBeDisabled();

      // Submit using Cmd+Enter shortcut
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

      await waitFor(() => {
        expect(mockCreatePost).toHaveBeenCalledWith({
          content: 'Finished reading Devdas today! Truly poignant.',
          book_id: undefined,
          feeling_emoji: undefined,
          feeling_label: undefined,
          image_url: undefined,
          audience: 'friends',
        });
      });
    });

    it('displays action buttons with accessible labels', () => {
      render(
        <MemoryRouter>
          <FeedComposer />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /add image to post/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add book to post/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add feeling to post/i })).toBeInTheDocument();
    });
  });

  describe('EnhancedSocialFeed Component', () => {
    const mockPosts = [
      {
        id: 'post-101',
        user_id: 'user-reader-2',
        content: 'Currently re-reading Durga Saptashati during the auspicious days.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        likes_count: 8,
        comments_count: 3,
        reposts_count: 2,
        user_liked: false,
        user_reposted: false,
        profiles: {
          id: 'user-reader-2',
          full_name: 'Vikram Joshi',
          username: 'vikram_j',
          profile_photo_url: 'https://example.com/vikram.jpg',
        },
        books_library: {
          id: 'book-durga-saptashati',
          title: 'Shri Durga Saptashati',
          author: 'Traditional / Rishi Markandeya',
          cover_image_url: 'https://example.com/durga.jpg',
          genre: 'Spiritual',
        },
      },
    ];

    beforeEach(() => {
      mockUseSocialPosts.mockReturnValue({
        posts: mockPosts,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
      mockUsePostComments.mockReturnValue({
        data: [],
        isLoading: false,
      });
    });

    it('renders post card with author, content, book reference card, and action buttons', () => {
      render(
        <MemoryRouter>
          <EnhancedSocialFeed />
        </MemoryRouter>
      );

      expect(screen.getByText('Vikram Joshi')).toBeInTheDocument();
      expect(screen.getByText(/Currently re-reading Durga Saptashati/i)).toBeInTheDocument();
      expect(screen.getByText('Shri Durga Saptashati')).toBeInTheDocument();
      expect(screen.getByText(/Traditional \/ Rishi Markandeya/i)).toBeInTheDocument();
      expect(screen.getByText('Currently Reading')).toBeInTheDocument();

      // Accessible action buttons with dynamic counts
      const likeButton = screen.getByRole('button', { name: /like post, 8 likes/i });
      expect(likeButton).toBeInTheDocument();

      const commentsButton = screen.getByRole('button', { name: /show comments, 3 comments/i });
      expect(commentsButton).toBeInTheDocument();

      const repostButton = screen.getByRole('button', { name: /repost, 2 reposts/i });
      expect(repostButton).toBeInTheDocument();

      const shareButton = screen.getByRole('button', { name: /share post/i });
      expect(shareButton).toBeInTheDocument();
    });

    it('toggles post like when clicking like button', () => {
      render(
        <MemoryRouter>
          <EnhancedSocialFeed />
        </MemoryRouter>
      );

      const likeButton = screen.getByRole('button', { name: /like post, 8 likes/i });
      fireEvent.click(likeButton);

      expect(mockTogglePostLike).toHaveBeenCalledWith({
        postId: 'post-101',
        isLiked: false,
      });
    });

    it('shows a retry state instead of an empty-feed message when loading fails', () => {
      const retryFeed = vi.fn();
      mockUseSocialPosts.mockReturnValue({
        posts: [],
        isLoading: false,
        error: new Error('Permission denied'),
        refetch: retryFeed,
        hasMore: false,
      });

      render(
        <MemoryRouter>
          <EnhancedSocialFeed />
        </MemoryRouter>
      );

      expect(screen.getByText(/unable to load feed posts: permission denied/i)).toBeInTheDocument();
      expect(screen.queryByText(/no posts yet/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(retryFeed).toHaveBeenCalledTimes(1);
    });

    it('offers cursor-based loading for older feed posts', () => {
      const loadMore = vi.fn().mockResolvedValue(undefined);
      mockUseSocialPosts.mockReturnValue({
        posts: mockPosts,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: true,
        isLoadingMore: false,
        loadMore,
        loadMoreError: null,
      });

      render(
        <MemoryRouter>
          <EnhancedSocialFeed />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /load older posts/i }));
      expect(loadMore).toHaveBeenCalledTimes(1);
    });

    it('shows retryable error when margin notes fail instead of showing an empty state', () => {
      const retry = vi.fn();
      mockUseMarginNotes.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Permission denied'),
        refetch: retry,
      });

      render(
        <MemoryRouter>
          <EnhancedSocialFeed />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /margin notes/i }));
      expect(screen.getByText('Margin notes could not be loaded.')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(retry).toHaveBeenCalledTimes(1);
    });

    it('shows retryable error when chapter threads fail instead of showing an empty state', () => {
      const retry = vi.fn();
      mockUseSpoilerThreads.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Request failed'),
        refetch: retry,
      });

      render(
        <MemoryRouter>
          <EnhancedSocialFeed />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /chapter threads/i }));
      expect(screen.getByText('Chapter threads could not be loaded.')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(retry).toHaveBeenCalledTimes(1);
    });

    it('toggles comment section when clicking comments button', () => {
      render(
        <MemoryRouter>
          <EnhancedSocialFeed />
        </MemoryRouter>
      );

      const commentsButton = screen.getByRole('button', { name: /show comments, 3 comments/i });
      fireEvent.click(commentsButton);

      expect(screen.getByText(/no comments yet\. be the first to comment!/i)).toBeInTheDocument();
    });
  });

  describe('EnhancedCommentSection Component', () => {
    const mockComments = [
      {
        id: 'c-1',
        user_id: 'user-reader-3',
        post_id: 'post-101',
        content: 'Such a timeless scripture, the verse cadence is beautiful.',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        likes_count: 4,
        user_liked: false,
        parent_comment_id: null,
        profiles: {
          id: 'user-reader-3',
          full_name: 'Pooja Iyer',
          username: 'pooja_i',
        },
      },
      {
        id: 'c-2',
        user_id: 'user-reader-1',
        post_id: 'post-101',
        content: 'Completely agree, chapter 4 is particularly inspiring.',
        created_at: new Date(Date.now() - 900000).toISOString(),
        likes_count: 1,
        user_liked: true,
        parent_comment_id: 'c-1',
        profiles: {
          id: 'user-reader-1',
          full_name: 'Ananya Roy',
        },
      },
    ];

    beforeEach(() => {
      mockUsePostComments.mockReturnValue({
        data: mockComments,
        isLoading: false,
      });
    });

    it('shows a retryable error when comments fail instead of a false empty state', () => {
      const retry = vi.fn();
      mockUsePostComments.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Permission denied'),
        refetch: retry,
      });

      render(
        <MemoryRouter>
          <EnhancedCommentSection postId="post-101" />
        </MemoryRouter>
      );

      expect(screen.getByText('Comments could not be loaded. They are not necessarily empty.')).toBeInTheDocument();
      expect(screen.queryByText(/no comments yet/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /retry comments/i }));
      expect(retry).toHaveBeenCalledTimes(1);
    });

    it('renders hierarchical comments with accessible like and reply actions', () => {
      render(
        <MemoryRouter>
          <EnhancedCommentSection postId="post-101" />
        </MemoryRouter>
      );

      expect(screen.getByText('Pooja Iyer')).toBeInTheDocument();
      expect(screen.getByText('Such a timeless scripture, the verse cadence is beautiful.')).toBeInTheDocument();
      expect(screen.getByText('Completely agree, chapter 4 is particularly inspiring.')).toBeInTheDocument();

      // Check accessible like buttons
      expect(screen.getByRole('button', { name: /like comment, 4 likes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /unlike comment, 1 likes/i })).toBeInTheDocument();

      // Check reply button
      const replyButton = screen.getByRole('button', { name: /reply to pooja iyer/i });
      expect(replyButton).toBeInTheDocument();

      // Click reply button to activate reply mode
      fireEvent.click(replyButton);
      expect(screen.getByText(/replying to/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /reply to pooja iyer/i })).toBeInTheDocument();

      // Cancel reply mode
      const cancelButton = screen.getByRole('button', { name: /cancel reply/i });
      fireEvent.click(cancelButton);
      expect(screen.queryByText(/replying to/i)).not.toBeInTheDocument();
    });

    it('submits a new comment on Enter key press', async () => {
      mockCreateComment.mockResolvedValueOnce({ id: 'c-3' });

      render(
        <MemoryRouter>
          <EnhancedCommentSection postId="post-101" />
        </MemoryRouter>
      );

      const input = screen.getByRole('textbox', { name: /write a comment/i });
      fireEvent.change(input, { target: { value: 'Adding this edition to my reading queue!' } });

      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(mockCreateComment).toHaveBeenCalledWith({
          postId: 'post-101',
          content: 'Adding this edition to my reading queue!',
          parentCommentId: null,
        });
      });
    });
  });
});
