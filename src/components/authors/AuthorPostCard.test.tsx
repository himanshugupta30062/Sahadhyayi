// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as any,
  blockedUsers: [] as string[],
  comments: [] as any[],
  reactions: [] as any[],
  commentLikes: { isLiked: false, count: 0 },
  addCommentMutateAsync: vi.fn(),
  toggleReactionMutateAsync: vi.fn(),
  toggleCommentLikeMutate: vi.fn(),
  blockUserMutate: vi.fn(),
  reportMutate: vi.fn(),
  addCommentPending: false,
  inappropriate: false,
  toastError: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/useAuthorPosts', () => ({
  usePostComments: () => ({ data: mocks.comments }),
  usePostReactions: () => ({ data: mocks.reactions }),
  useAddComment: () => ({ mutateAsync: mocks.addCommentMutateAsync, isPending: mocks.addCommentPending }),
  useToggleReaction: () => ({ mutateAsync: mocks.toggleReactionMutateAsync, isPending: false }),
}));

vi.mock('@/hooks/useCommentLikes', () => ({
  useCommentLikes: () => ({ data: mocks.commentLikes }),
  useToggleCommentLike: () => ({ mutate: mocks.toggleCommentLikeMutate, isPending: false }),
}));

vi.mock('@/hooks/useTrustAndSafety', () => ({
  useBlockUser: () => ({ mutate: mocks.blockUserMutate }),
  useBlockedUsers: () => ({ data: mocks.blockedUsers }),
  useReportContent: () => ({ mutate: mocks.reportMutate }),
}));

vi.mock('@/utils/trustAndSafety', () => ({
  containsInappropriateLanguage: () => mocks.inappropriate,
}));

vi.mock('@/lib/dateUtils', () => ({
  safeFormatDistanceToNow: () => '2 days ago',
}));

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError },
}));

import { AuthorPostCard } from './AuthorPostCard';

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: 'post-1',
  author_id: 'author-1',
  post_type: 'blog_post',
  title: 'A new reading update',
  content: 'A thoughtful note about books.',
  created_at: '2026-11-01T00:00:00Z',
  image_url: 'https://example.com/post-image.jpg',
  video_url: 'https://example.com/post-video',
  allow_comments: true,
  authors: {
    name: 'A Writer',
    profile_image_url: 'https://example.com/author.jpg',
  },
  ...overrides,
});

const signIn = () => {
  mocks.user = {
    id: 'reader-1',
    email: 'reader@example.com',
    user_metadata: { avatar_url: 'https://example.com/reader.jpg' },
  };
};

describe('AuthorPostCard', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.blockedUsers = [];
    mocks.comments = [];
    mocks.reactions = [];
    mocks.commentLikes = { isLiked: false, count: 0 };
    mocks.addCommentMutateAsync.mockReset().mockResolvedValue({ id: 'comment-new' });
    mocks.toggleReactionMutateAsync.mockReset().mockResolvedValue(undefined);
    mocks.toggleCommentLikeMutate.mockReset();
    mocks.blockUserMutate.mockReset();
    mocks.reportMutate.mockReset();
    mocks.addCommentPending = false;
    mocks.inappropriate = false;
    mocks.toastError.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hides posts from authors the reader has blocked', () => {
    mocks.blockedUsers = ['author-1'];

    const { container } = render(<AuthorPostCard post={makePost() as any} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders author details, post type, attachments, reactions, and comments', () => {
    mocks.reactions = [
      { user_id: 'reader-1', reaction_type: 'love' },
      { user_id: 'reader-2', reaction_type: 'like' },
    ];
    mocks.comments = [{
      id: 'comment-1',
      content: 'Looking forward to reading this',
      user_id: 'reader-2',
      created_at: '2026-11-02T00:00:00Z',
      profiles: { full_name: 'Another Reader' },
    }];

    const { container } = render(<AuthorPostCard post={makePost() as any} />);

    expect(screen.getByText('A Writer')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A new reading update' })).toBeInTheDocument();
    expect(screen.getByText('A thoughtful note about books.')).toBeInTheDocument();
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByAltText('Post attachment')).toHaveAttribute('src', 'https://example.com/post-image.jpg');
    expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://example.com/post-video');
    expect(screen.getByRole('button', { name: /Love/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Like/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    expect(screen.getByText('Looking forward to reading this')).toBeInTheDocument();
    expect(screen.getByText('Another Reader')).toBeInTheDocument();
  });

  it('omits the comments control when comments are disabled for a post', () => {
    render(<AuthorPostCard post={makePost({ allow_comments: false }) as any} />);

    expect(screen.queryByRole('button', { name: /Comments/ })).not.toBeInTheDocument();
  });

  it('prompts signed-out readers before reacting or commenting', () => {
    render(<AuthorPostCard post={makePost() as any} />);

    fireEvent.click(screen.getByRole('button', { name: /Like/ }));
    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(mocks.toastError).toHaveBeenCalledWith('Please sign in to react');
    expect(mocks.toastError).toHaveBeenCalledWith('Please sign in to comment');
    expect(mocks.toggleReactionMutateAsync).not.toHaveBeenCalled();
    expect(mocks.addCommentMutateAsync).not.toHaveBeenCalled();
  });

  it('submits reactions and trimmed comments for signed-in readers', async () => {
    signIn();
    render(<AuthorPostCard post={makePost() as any} />);

    fireEvent.click(screen.getByRole('button', { name: /Like/ }));
    await waitFor(() => expect(mocks.toggleReactionMutateAsync).toHaveBeenCalledWith({
      postId: 'post-1',
      reactionType: 'like',
    }));

    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: '  Great post  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => expect(mocks.addCommentMutateAsync).toHaveBeenCalledWith({
      postId: 'post-1',
      content: 'Great post',
      parentCommentId: undefined,
    }));
    expect(screen.getByPlaceholderText('Write a comment...')).toHaveValue('');
  });

  it('supports nested replies and comment likes', async () => {
    signIn();
    mocks.commentLikes = { isLiked: true, count: 3 };
    mocks.comments = [{
      id: 'root-comment',
      content: 'Root comment',
      user_id: 'reader-2',
      created_at: '2026-11-02T00:00:00Z',
      profiles: { full_name: 'Reader Two' },
      replies: [{
        id: 'reply-1',
        content: 'Nested reply',
        user_id: 'reader-3',
        created_at: '2026-11-03T00:00:00Z',
        profiles: { full_name: 'Reader Three' },
      }],
    }];
    render(<AuthorPostCard post={makePost() as any} />);

    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    expect(screen.getByText('Nested reply')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: '3' })[0]);
    expect(mocks.toggleCommentLikeMutate).toHaveBeenCalledWith({ commentId: 'root-comment' });

    fireEvent.click(screen.getAllByRole('button', { name: 'Reply' })[0]);
    expect(screen.getByText('Replying to comment')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: '  A reply  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => expect(mocks.addCommentMutateAsync).toHaveBeenCalledWith({
      postId: 'post-1',
      content: 'A reply',
      parentCommentId: 'root-comment',
    }));
  });

  it('reports unsafe comments and keeps the comment flow available', async () => {
    signIn();
    mocks.inappropriate = true;
    render(<AuthorPostCard post={makePost() as any} />);

    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'Flagged comment' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => expect(mocks.addCommentMutateAsync).toHaveBeenCalled());
    expect(mocks.reportMutate).toHaveBeenCalledWith({
      contentId: 'post-1',
      contentType: 'post',
      reason: 'Inappropriate language in comment',
    });
  });

  it('handles report and block actions and keeps drafts after comment failures', async () => {
    signIn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.addCommentMutateAsync.mockRejectedValueOnce(new Error('comment failed'));
    render(<AuthorPostCard post={makePost() as any} />);

    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'Keep this draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => expect(consoleError).toHaveBeenCalledWith('Error adding comment:', expect.any(Error)));
    expect(mocks.reportMutate).toHaveBeenCalledWith({
      contentId: 'post-1',
      contentType: 'post',
      reason: 'User report',
    });
    expect(mocks.blockUserMutate).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Write a comment...')).toHaveValue('Keep this draft');
  });

  it('renders a generic post label for unknown types', () => {
    render(<AuthorPostCard post={makePost({ post_type: 'custom_type' }) as any} />);

    expect(screen.getByText('Post')).toBeInTheDocument();
  });
});
