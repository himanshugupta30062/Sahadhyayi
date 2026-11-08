// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import GroupReadingDiscussions from '@/components/groups/GroupReadingDiscussions';
import type { GroupReadingDiscussion } from '@/hooks/useGroupReadingDiscussions';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as { id: string } | null,
  books: [] as any[],
  booksLoading: false,
  discussions: [] as any[],
  discussionsLoading: false,
  discussionsError: null as any,
  comments: [] as any[],
  commentsLoading: false,
  commentsError: null as any,
  commentQueryArgs: [] as unknown[],
  createDiscussionMutate: vi.fn(),
  createCommentMutate: vi.fn(),
  deleteDiscussionMutate: vi.fn(),
  deleteCommentMutate: vi.fn(),
  createDiscussionPending: false,
  createCommentPending: false,
  deleteDiscussionPending: false,
  deleteCommentPending: false,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/useGroupReadingBoard', () => ({
  useGroupReadingBooks: () => ({ data: mocks.books, isLoading: mocks.booksLoading }),
}));

vi.mock('@/hooks/useGroupReadingDiscussions', () => ({
  useGroupReadingDiscussions: () => ({
    data: mocks.discussions,
    isLoading: mocks.discussionsLoading,
    error: mocks.discussionsError,
  }),
  useGroupReadingDiscussionComments: (...args: unknown[]) => {
    mocks.commentQueryArgs = args;
    return {
      data: mocks.comments,
      isLoading: mocks.commentsLoading,
      error: mocks.commentsError,
    };
  },
  useCreateGroupReadingDiscussion: () => ({
    mutate: mocks.createDiscussionMutate,
    isPending: mocks.createDiscussionPending,
  }),
  useCreateGroupReadingDiscussionComment: () => ({
    mutate: mocks.createCommentMutate,
    isPending: mocks.createCommentPending,
  }),
  useDeleteGroupReadingDiscussion: () => ({
    mutate: mocks.deleteDiscussionMutate,
    isPending: mocks.deleteDiscussionPending,
  }),
  useDeleteGroupReadingDiscussionComment: () => ({
    mutate: mocks.deleteCommentMutate,
    isPending: mocks.deleteCommentPending,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

const makeBook = (overrides: Record<string, unknown> = {}) => ({
  id: 'group-book-1',
  group_id: 'group-1',
  book_id: 'book-1',
  status: 'current',
  title: 'The Shared Novel',
  author: 'A. Writer',
  ...overrides,
});

const makeDiscussion = (overrides: Partial<GroupReadingDiscussion> = {}): GroupReadingDiscussion => ({
  id: 'discussion-1',
  group_id: 'group-1',
  group_reading_book_id: 'group-book-1',
  book_id: 'book-1',
  book_title: 'The Shared Novel',
  chapter_number: 3,
  spoiler_chapter: 0,
  topic_type: 'discussion',
  title: 'A question about the journey',
  body: 'Why does the narrator choose this route?',
  is_unlocked: true,
  created_by: 'reader-2',
  author_name: 'Reader Two',
  author_photo_url: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  reply_count: 2,
  ...overrides,
});

const makeComment = (overrides: Record<string, unknown> = {}) => ({
  id: 'comment-1',
  discussion_id: 'discussion-1',
  user_id: 'reader-2',
  body: 'I noticed the same detail.',
  spoiler_chapter: 0,
  is_unlocked: true,
  author_name: 'Reader Two',
  author_photo_url: null,
  created_at: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

const renderPanel = (canModerate = false) =>
  render(<GroupReadingDiscussions groupId="group-1" canModerate={canModerate} />);

describe('GroupReadingDiscussions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'reader-1' };
    mocks.books = [makeBook()];
    mocks.booksLoading = false;
    mocks.discussions = [];
    mocks.discussionsLoading = false;
    mocks.discussionsError = null;
    mocks.comments = [makeComment()];
    mocks.commentsLoading = false;
    mocks.commentsError = null;
    mocks.commentQueryArgs = [];
    mocks.createDiscussionPending = false;
    mocks.createCommentPending = false;
    mocks.deleteDiscussionPending = false;
    mocks.deleteCommentPending = false;
  });

  afterEach(() => cleanup());

  it('renders the chapter discussion section and an empty state', () => {
    renderPanel();
    expect(screen.getByText('Chapter discussions')).toBeInTheDocument();
    expect(screen.getByText('No discussions yet')).toBeInTheDocument();
    expect(screen.getByText('Start with a question or a favourite passage from the current read.')).toBeInTheDocument();
  });

  it('shows a loading state while the group book list is loading', () => {
    mocks.booksLoading = true;
    renderPanel();
    expect(screen.getByLabelText('Loading group books')).toBeInTheDocument();
  });

  it('shows the add-a-book empty state when no shared book exists', () => {
    mocks.books = [];
    renderPanel();
    expect(screen.getByText('Add a shared book to begin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start discussion/i })).toBeDisabled();
  });

  it('renders a recoverable discussion query error', () => {
    mocks.discussionsError = new Error('network unavailable');
    renderPanel();
    expect(screen.getByRole('alert')).toHaveTextContent('Chapter discussions could not be loaded.');
  });

  it('shows a loading state while discussions are fetched', () => {
    mocks.discussionsLoading = true;
    renderPanel();
    expect(screen.getByLabelText('Loading chapter discussions')).toBeInTheDocument();
  });

  it('renders a discussion with its chapter, type, author and unlocked body', () => {
    mocks.discussions = [makeDiscussion({ topic_type: 'question', chapter_number: 3, body: 'A thoughtful question.' })];
    renderPanel();
    expect(screen.getByText('Chapter discussions')).toBeInTheDocument();
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('Chapter 3')).toBeInTheDocument();
    expect(screen.getByText('A question about the journey')).toBeInTheDocument();
    expect(screen.getByText('Reader Two')).toBeInTheDocument();
    expect(screen.getByText('A thoughtful question.')).toBeInTheDocument();
    expect(screen.getByText('2 replies')).toBeInTheDocument();
  });

  it('hides locked discussion content while keeping the safe title and spoiler threshold visible', () => {
    mocks.discussions = [makeDiscussion({
      body: null,
      is_unlocked: false,
      spoiler_chapter: 7,
    })];
    renderPanel();
    expect(screen.getByText('A question about the journey')).toBeInTheDocument();
    expect(screen.getByText('Spoilers through chapter 7')).toBeInTheDocument();
    expect(screen.getByText('Spoiler-protected text. Complete chapter 7 in your reading progress to unlock it.')).toBeInTheDocument();
    expect(screen.queryByText('Why does the narrator choose this route?')).not.toBeInTheDocument();
  });

  it('allows a member to open the composer and creates a discussion on the current book', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Topic type'), { target: { value: 'question' } });
    fireEvent.change(screen.getByLabelText('Chapter (0 = general)'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Spoiler chapter (0 = none)'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Why does the narrator change?' } });
    fireEvent.change(screen.getByLabelText('Your thoughts'), { target: { value: 'I would like to explore this decision.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Start discussion', exact: true }).slice(-1)[0]);

    expect(mocks.createDiscussionMutate).toHaveBeenCalledWith(
      {
        groupId: 'group-1',
        groupReadingBookId: 'group-book-1',
        chapterNumber: 4,
        spoilerChapter: 6,
        topicType: 'question',
        title: 'Why does the narrator change?',
        body: 'I would like to explore this decision.',
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    act(() => {
      mocks.createDiscussionMutate.mock.calls[0][1].onSuccess();
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Discussion started for The Shared Novel.');
    expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument();
  });

  it('uses the first non-archived book when there is no current title', () => {
    mocks.books = [
      makeBook({ id: 'archive-1', status: 'archived', title: 'Old book' }),
      makeBook({ id: 'queue-1', status: 'up_next', title: 'Next book' }),
    ];
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
    expect(screen.getByRole('combobox', { name: 'Group book' })).toHaveValue('queue-1');
  });

  it('rejects an invalid chapter and spoiler threshold before creating a discussion', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
    fireEvent.change(screen.getByLabelText('Chapter (0 = general)'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Spoiler chapter (0 = none)'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My title' } });
    fireEvent.change(screen.getByLabelText('Your thoughts'), { target: { value: 'My thoughts' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Start discussion', exact: true }).slice(-1)[0]);
    expect(mocks.createDiscussionMutate).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('The spoiler level must be the same as or later than the discussion chapter.');
  });

  it('reports discussion creation errors and supports cancelling the composer', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A useful question' } });
    fireEvent.change(screen.getByLabelText('Your thoughts'), { target: { value: 'Some details.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Start discussion', exact: true }).slice(-1)[0]);
    mocks.createDiscussionMutate.mock.calls[0][1].onError(new Error('You are not an active member'));
    expect(mocks.toastError).toHaveBeenCalledWith('You are not an active member');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument();
  });

  it('opens replies and loads comments lazily', () => {
    mocks.discussions = [makeDiscussion()];
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: '2 replies' }));
    expect(mocks.commentQueryArgs).toEqual(['discussion-1', true]);
    expect(screen.getByText('I noticed the same detail.')).toBeInTheDocument();
  });

  it('renders a locked reply without exposing its body', () => {
    mocks.discussions = [makeDiscussion()];
    mocks.comments = [makeComment({
      body: null,
      is_unlocked: false,
      spoiler_chapter: 8,
    })];
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: '2 replies' }));
    expect(screen.getByText('Complete chapter 8 to unlock this reply.')).toBeInTheDocument();
    expect(screen.queryByText('I noticed the same detail.')).not.toBeInTheDocument();
  });

  it('adds a reply and refreshes the comment list', () => {
    mocks.discussions = [makeDiscussion({ is_unlocked: true })];
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: '2 replies' }));
    fireEvent.change(screen.getByLabelText('Reply to A question about the journey'), { target: { value: 'A new point.' } });
    fireEvent.change(screen.getByLabelText('Reply spoiler chapter'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(mocks.createCommentMutate).toHaveBeenCalledWith(
      {
        groupId: 'group-1',
        discussionId: 'discussion-1',
        body: 'A new point.',
        spoilerChapter: 9,
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    act(() => {
      mocks.createCommentMutate.mock.calls[0][1].onSuccess();
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Reply added.');
  });

  it('does not allow replies while the discussion itself is locked', () => {
    mocks.discussions = [makeDiscussion({ body: null, is_unlocked: false, spoiler_chapter: 5 })];
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: '2 replies' }));
    expect(screen.getByText('Finish the discussion’s spoiler chapter before replying.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
  });

  it('lets a discussion author delete their own discussion and reports delete errors', () => {
    mocks.discussions = [makeDiscussion({ created_by: 'reader-1' })];
    renderPanel(false);
    fireEvent.click(screen.getByRole('button', { name: 'Delete discussion: A question about the journey' }));
    expect(mocks.deleteDiscussionMutate).toHaveBeenCalledWith(
      { groupId: 'group-1', discussionId: 'discussion-1' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    mocks.deleteDiscussionMutate.mock.calls[0][1].onError(new Error('Delete denied'));
    expect(mocks.toastError).toHaveBeenCalledWith('Delete denied');
  });

  it('lets moderators remove discussions and replies', () => {
    mocks.discussions = [makeDiscussion()];
    mocks.comments = [makeComment()];
    renderPanel(true);
    expect(screen.getByRole('button', { name: 'Delete discussion: A question about the journey' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 replies' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete reply' }));
    expect(mocks.deleteCommentMutate).toHaveBeenCalledWith(
      { groupId: 'group-1', discussionId: 'discussion-1', commentId: 'comment-1' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('reports reply-list errors and hides delete actions from non-owners', () => {
    mocks.discussions = [makeDiscussion()];
    mocks.commentsError = new Error('reply list unavailable');
    renderPanel(false);
    expect(screen.queryByRole('button', { name: 'Delete discussion: A question about the journey' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 replies' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Replies could not be loaded.');
  });
});
