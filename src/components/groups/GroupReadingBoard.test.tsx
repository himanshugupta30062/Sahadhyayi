// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import GroupReadingBoard from '@/components/groups/GroupReadingBoard';
import type { GroupReadingBook } from '@/hooks/useGroupReadingBoard';

const mocks = vi.hoisted(() => ({
  books: [] as any[],
  isLoading: false,
  error: null as any,
  queryArgs: [] as unknown[],
  addMutate: vi.fn(),
  setStatusMutate: vi.fn(),
  removeMutate: vi.fn(),
  saveMutate: vi.fn(),
  addPending: false,
  setStatusPending: false,
  savePending: false,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/hooks/useGroupReadingBoard', () => ({
  useGroupReadingBooks: (...args: unknown[]) => {
    mocks.queryArgs = args;
    return { data: mocks.books, isLoading: mocks.isLoading, error: mocks.error };
  },
  useAddGroupReadingBook: () => ({ mutate: mocks.addMutate, isPending: mocks.addPending }),
  useSetGroupReadingBookStatus: () => ({ mutate: mocks.setStatusMutate, isPending: mocks.setStatusPending }),
  useRemoveGroupReadingBook: () => ({ mutate: mocks.removeMutate, isPending: false }),
  useSaveGroupReadingProgress: () => ({ mutate: mocks.saveMutate, isPending: mocks.savePending }),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock('@/components/social/BookSelectionModal', () => ({
  BookSelectionModal: ({
    isOpen,
    onClose,
    onSelect,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (book: { id: string; title: string }) => void;
  }) => isOpen ? (
    <div role="dialog" aria-label="Book selection mock">
      <button type="button" onClick={() => onSelect({ id: 'book-new', title: 'New group title' })}>
        Choose new title
      </button>
      <button type="button" onClick={onClose}>Close picker</button>
    </div>
  ) : null,
}));

const makeBook = (overrides: Partial<GroupReadingBook> = {}): GroupReadingBook => ({
  id: 'reading-book-1',
  group_id: 'group-1',
  book_id: 'book-1',
  status: 'current',
  target_date: null,
  started_at: '2026-01-01',
  completed_at: null,
  created_at: '2026-01-01T00:00:00Z',
  title: 'Current read',
  author: 'Reader Author',
  cover_image_url: null,
  pages: 200,
  my_current_page: 20,
  my_is_shared: false,
  shared_reader_count: 0,
  average_progress: null,
  ...overrides,
});

const renderBoard = (canManage = false) =>
  render(<GroupReadingBoard groupId="group-1" canManage={canManage} />);

describe('GroupReadingBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.books = [];
    mocks.isLoading = false;
    mocks.error = null;
    mocks.queryArgs = [];
    mocks.addPending = false;
    mocks.setStatusPending = false;
    mocks.savePending = false;
  });

  afterEach(() => cleanup());

  it('loads the group-scoped board and renders all reading stages and book metadata', () => {
    mocks.books = [
      makeBook({
        cover_image_url: 'https://cdn.example.test/current.jpg',
        target_date: '2026-12-01',
        shared_reader_count: 3,
        average_progress: 43.5,
      }),
      makeBook({
        id: 'reading-book-2',
        book_id: 'book-2',
        title: 'Next in the queue',
        author: null,
        status: 'up_next',
        pages: null,
        my_current_page: 0,
      }),
      makeBook({
        id: 'reading-book-3',
        book_id: 'book-3',
        title: 'Finished title',
        status: 'completed',
        completed_at: '2026-02-01',
      }),
      makeBook({
        id: 'reading-book-4',
        book_id: 'book-4',
        title: 'Archived title',
        status: 'archived',
      }),
    ];

    renderBoard();

    expect(mocks.queryArgs).toEqual(['group-1', true]);
    expect(screen.getByText('Shared reading')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reading together' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Up next' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Finished together' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Archived' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Current read' })).toBeInTheDocument();
    expect(screen.getAllByText('Reader Author').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByAltText('Current read cover')).toHaveAttribute('src', 'https://cdn.example.test/current.jpg');
    expect(screen.getByText(/Target/)).toBeInTheDocument();
    expect(screen.getByText(/3 sharing/)).toBeInTheDocument();
    expect(screen.getByText(/44% average/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Shared progress for Current read' })).toHaveAttribute('aria-valuenow', '44');
    expect(screen.getByText('Based only on members who opted in to share.')).toBeInTheDocument();
    expect(screen.getByText('Unknown author')).toBeInTheDocument();
    expect(screen.getByText('Finished title')).toBeInTheDocument();
    expect(screen.getByText('Archived title')).toBeInTheDocument();
    expect(screen.getAllByText('Saved: 10%').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText('Your current page for Archived title')).not.toBeInTheDocument();
  });

  it('shows loading placeholders while the member list is being fetched', () => {
    mocks.isLoading = true;
    renderBoard();
    expect(screen.getByLabelText('Loading shared reading list')).toBeInTheDocument();
  });

  it('shows a recoverable error message when the reading-list RPC fails', () => {
    mocks.error = new Error('Could not reach the reading list');
    renderBoard();
    expect(screen.getByRole('alert')).toHaveTextContent('The shared reading list could not be loaded.');
  });

  it('shows a member-friendly empty state without moderator controls', () => {
    renderBoard(false);
    expect(screen.getByText('No shared books yet')).toBeInTheDocument();
    expect(screen.getByText('A group moderator can add the first title to this reading list.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add book/i })).not.toBeInTheDocument();
  });

  it('lets moderators open the book picker and add a title from the library', () => {
    renderBoard(true);
    fireEvent.click(screen.getByRole('button', { name: /Add the first book/i }));
    expect(screen.getByRole('dialog', { name: 'Book selection mock' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Choose new title' }));
    expect(mocks.addMutate).toHaveBeenCalledWith(
      { groupId: 'group-1', bookId: 'book-new' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    mocks.addMutate.mock.calls[0][1].onSuccess();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('“New group title” added to the group reading list.');
  });

  it('reports book-add mutation errors to the member', () => {
    renderBoard(true);
    fireEvent.click(screen.getByRole('button', { name: /Add book/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose new title' }));
    mocks.addMutate.mock.calls[0][1].onError(new Error('Library item unavailable'));
    expect(mocks.toastError).toHaveBeenCalledWith('Library item unavailable');
  });

  it('lets moderators start a queued title when no book is current', () => {
    mocks.books = [makeBook({ id: 'queue-1', status: 'up_next', title: 'Next title' })];
    renderBoard(true);

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(mocks.setStatusMutate).toHaveBeenCalledWith(
      { groupId: 'group-1', readingBookId: 'queue-1', status: 'current' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    mocks.setStatusMutate.mock.calls[0][1].onSuccess();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Next title: moved to current read.');
  });

  it('does not offer a second start action while a current title exists', () => {
    mocks.books = [
      makeBook({ id: 'current-1', status: 'current' }),
      makeBook({ id: 'queue-1', status: 'up_next', title: 'Next title' }),
    ];
    renderBoard(true);
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
  });

  it('lets moderators finish the current title and return completed titles to the queue', () => {
    mocks.books = [
      makeBook({ id: 'current-1', status: 'current', title: 'Current title' }),
      makeBook({ id: 'done-1', status: 'completed', title: 'Completed title' }),
      makeBook({ id: 'archived-1', status: 'archived', title: 'Archived title' }),
    ];
    renderBoard(true);

    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(mocks.setStatusMutate).toHaveBeenNthCalledWith(1,
      { groupId: 'group-1', readingBookId: 'current-1', status: 'completed' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );

    const queueButtons = screen.getAllByRole('button', { name: 'Return to queue' });
    fireEvent.click(queueButtons[0]);
    fireEvent.click(queueButtons[1]);
    expect(mocks.setStatusMutate).toHaveBeenNthCalledWith(2,
      { groupId: 'group-1', readingBookId: 'done-1', status: 'up_next' },
      expect.any(Object),
    );
    expect(mocks.setStatusMutate).toHaveBeenNthCalledWith(3,
      { groupId: 'group-1', readingBookId: 'archived-1', status: 'up_next' },
      expect.any(Object),
    );
  });

  it('reports status-change errors', () => {
    mocks.books = [makeBook({ status: 'current' })];
    renderBoard(true);
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    mocks.setStatusMutate.mock.calls[0][1].onError(new Error('Only moderators can update this title'));
    expect(mocks.toastError).toHaveBeenCalledWith('Only moderators can update this title');
  });

  it('saves the member page and opt-in sharing preference together', () => {
    mocks.books = [makeBook({ my_current_page: 20, my_is_shared: false })];
    renderBoard(false);

    fireEvent.change(screen.getByLabelText('Your current page for Current read'), {
      target: { value: '80' },
    });
    fireEvent.click(screen.getByRole('checkbox', {
      name: 'Share my page and progress with this group',
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }));

    expect(mocks.saveMutate).toHaveBeenCalledWith(
      { groupId: 'group-1', readingBookId: 'reading-book-1', currentPage: 80, isShared: true },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    mocks.saveMutate.mock.calls[0][1].onSuccess();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Your reading progress is saved.');
  });

  it('keeps sharing opt-in off by default and reports save failures', () => {
    mocks.books = [makeBook({ my_is_shared: false })];
    renderBoard(false);

    expect(screen.getByRole('checkbox', {
      name: 'Share my page and progress with this group',
    })).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }));
    mocks.saveMutate.mock.calls[0][1].onError(new Error('Progress cannot be saved'));
    expect(mocks.toastError).toHaveBeenCalledWith('Progress cannot be saved');
  });

  it('rejects negative and over-limit page numbers before saving', () => {
    mocks.books = [makeBook({ pages: 20 })];
    renderBoard(false);
    const pageInput = screen.getByLabelText('Your current page for Current read');

    fireEvent.change(pageInput, { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }));
    expect(mocks.saveMutate).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Enter a valid page number.');

    fireEvent.change(pageInput, { target: { value: '21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }));
    expect(mocks.saveMutate).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenLastCalledWith('This book has 20 pages.');
  });

  it('prevents page saving while a save is pending', () => {
    mocks.books = [makeBook()];
    mocks.savePending = true;
    renderBoard(false);
    expect(screen.getByRole('button', { name: 'Save progress' })).toBeDisabled();
  });

  it('lets moderators remove a title only after confirmation', () => {
    mocks.books = [makeBook({ title: 'Title to remove' })];
    renderBoard(true);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Title to remove from group reading list' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/shared progress records will be removed/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.removeMutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Title to remove from group reading list' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove book' }));
    expect(mocks.removeMutate).toHaveBeenCalledWith(
      { groupId: 'group-1', readingBookId: 'reading-book-1' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    mocks.removeMutate.mock.calls[0][1].onSuccess();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Book removed from the group reading list.');
  });

  it('reports remove errors and hides all moderator controls from ordinary members', () => {
    mocks.books = [makeBook()];
    const { rerender } = render(<GroupReadingBoard groupId="group-1" canManage />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Current read from group reading list' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove book' }));
    mocks.removeMutate.mock.calls[0][1].onError(new Error('Removal denied'));
    expect(mocks.toastError).toHaveBeenCalledWith('Removal denied');

    rerender(<GroupReadingBoard groupId="group-1" canManage={false} />);
    expect(screen.queryByRole('button', { name: /Add book/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove .* from group reading list/ })).not.toBeInTheDocument();
  });
});
