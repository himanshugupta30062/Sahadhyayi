// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  bookshelf: {
    data: undefined as Array<{ id: string; title: string }> | undefined,
    isLoading: false,
    error: null as Error | null,
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => mocks.bookshelf,
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div role="status">Loading personal library</div>,
}));

vi.mock('@/components/library/LibraryBookGrid', () => ({
  default: ({ items, showStatusBadge }: { items: Array<{ id: string; title: string }>; showStatusBadge?: boolean }) => (
    <div data-testid="library-book-grid" data-show-status-badge={String(showStatusBadge)}>
      {items.map((item) => <span key={item.id}>{item.title}</span>)}
    </div>
  ),
}));

import MyLibrary from './MyLibrary';

describe('MyLibrary', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.bookshelf = { data: undefined, isLoading: false, error: null };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('asks signed-out readers to sign in without rendering the shelf', () => {
    mocks.user = null;

    render(<MyLibrary />);

    expect(screen.getByText('Sign in to view your personal library.')).toBeInTheDocument();
    expect(screen.queryByTestId('library-book-grid')).not.toBeInTheDocument();
  });

  it('shows a loading state while the shelf query is pending', () => {
    mocks.bookshelf.isLoading = true;

    render(<MyLibrary />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading personal library');
  });

  it('shows a recoverable message when the shelf query fails', () => {
    const error = new Error('network unavailable');
    mocks.bookshelf.error = error;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<MyLibrary />);

    expect(screen.getByText('Failed to load your library. Please try again.')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Error loading bookshelf:', error);
    expect(screen.queryByTestId('library-book-grid')).not.toBeInTheDocument();
  });

  it('explains how to add books when the shelf is empty', () => {
    mocks.bookshelf.data = [];

    render(<MyLibrary />);

    expect(screen.getByRole('heading', { name: 'Your Library is Empty' })).toBeInTheDocument();
    expect(screen.getByText(/Add to Shelf/i)).toBeInTheDocument();
  });

  it('renders the personal shelf with status badges when books are available', () => {
    mocks.bookshelf.data = [
      { id: 'book-1', title: 'Godan' },
      { id: 'book-2', title: 'The Discovery of India' },
    ];

    render(<MyLibrary />);

    expect(screen.getByTestId('library-book-grid')).toHaveAttribute('data-show-status-badge', 'true');
    expect(screen.getByText('Godan')).toBeInTheDocument();
    expect(screen.getByText('The Discovery of India')).toBeInTheDocument();
  });
});
