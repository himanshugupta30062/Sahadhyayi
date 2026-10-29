// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  bookshelf: [] as Array<Record<string, any>>,
  isLoading: false,
  error: null as unknown,
  dbProgress: [] as Array<Record<string, any>>,
  mutate: vi.fn(),
  loadProgressLocally: vi.fn(),
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: mocks.bookshelf,
    isLoading: mocks.isLoading,
    error: mocks.error,
  }),
  useUpdateBookshelfItem: () => ({ mutate: mocks.mutate }),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({ data: mocks.dbProgress }),
}));

vi.mock('@/utils/readingProgressStorage', () => ({
  loadProgressLocally: (...args: unknown[]) => mocks.loadProgressLocally(...args),
}));

vi.mock('./AddBookToCurrentReadsDialog', () => ({
  default: () => <button type="button">Add Book</button>,
}));

import CurrentReads from './CurrentReads';

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label="current route">{location.pathname}</output>;
};

const renderCurrentReads = (userId = 'reader-1') => render(
  <MemoryRouter initialEntries={['/dashboard']}>
    <CurrentReads userId={userId} />
    <LocationDisplay />
  </MemoryRouter>,
);

const shelfItem = (overrides: Record<string, any> = {}) => ({
  id: 'shelf-1',
  book_id: 'book-1',
  status: 'reading',
  books_library: {
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    cover_image_url: 'https://example.com/cover.jpg',
  },
  ...overrides,
});

// Covers loading, error, empty, progress, and navigation branches.
describe('CurrentReads', () => {
  beforeEach(() => {
    mocks.bookshelf = [];
    mocks.isLoading = false;
    mocks.error = null;
    mocks.dbProgress = [];
    mocks.mutate.mockReset();
    mocks.loadProgressLocally.mockReset().mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a loading skeleton while the bookshelf is loading', () => {
    mocks.isLoading = true;
    renderCurrentReads();

    expect(screen.getByRole('heading', { name: 'Currently Reading' })).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1);
    expect(screen.queryByText('No books in progress')).not.toBeInTheDocument();
  });

  it('shows a recoverable error state and keeps the add-book action available', () => {
    mocks.error = new Error('Request failed');
    renderCurrentReads();

    expect(screen.getByText('Error loading books. Please refresh.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Book' })).toBeInTheDocument();
  });

  it('shows the empty state and links to the library when no books are on the shelf', () => {
    renderCurrentReads();

    expect(screen.getByText('No books in progress')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Find a Book' }));
    expect(screen.getByLabelText('current route')).toHaveTextContent('/library');
  });

  it('offers want-to-read books and updates the selected book to reading', () => {
    mocks.bookshelf = [
      shelfItem({
        id: 'want-1',
        book_id: 'book-want-1',
        status: 'want_to_read',
        books_library: { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', cover_image_url: null },
      }),
    ];
    renderCurrentReads();

    expect(screen.getByText('Pick up from your shelf to start reading:')).toBeInTheDocument();
    expect(screen.getByText('A Wizard of Earthsea')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start Reading' }));

    expect(mocks.mutate).toHaveBeenCalledWith({
      id: 'want-1',
      updates: { status: 'reading' },
    });
  });

  it('merges local and database progress, caps the grid at four books, and shows View All', () => {
    mocks.bookshelf = [
      shelfItem(),
      shelfItem({ id: 'shelf-2', book_id: 'book-2', books_library: { title: 'Book Two', author: 'Author Two', cover_image_url: null } }),
      shelfItem({ id: 'shelf-3', book_id: 'book-3', books_library: { title: 'Book Three', author: null, cover_image_url: null } }),
      shelfItem({ id: 'shelf-4', book_id: 'book-4', books_library: { title: 'Book Four', author: 'Author Four', cover_image_url: null } }),
      shelfItem({ id: 'shelf-5', book_id: 'book-5', books_library: { title: 'Book Five', author: 'Author Five', cover_image_url: null } }),
      shelfItem({ id: 'want-1', book_id: 'book-want', status: 'want_to_read', books_library: { title: 'Later Book', author: 'Later Author', cover_image_url: null } }),
    ];
    mocks.loadProgressLocally.mockImplementation((bookId: string) => (
      bookId === 'book-1' ? { currentPage: 7, totalPages: 80 } : null
    ));
    mocks.dbProgress = [
      { book_id: 'book-1', current_page: 5, total_pages: 100 },
      { book_id: 'book-2', current_page: 1, total_pages: 1 },
    ];

    renderCurrentReads('reader-99');

    expect(screen.getByRole('heading', { name: 'Currently Reading (4)' })).toBeInTheDocument();
    expect(screen.getByText('The Dispossessed')).toBeInTheDocument();
    expect(screen.getByText('Pg 7 of 100')).toBeInTheDocument();
    expect(screen.getAllByText('7%')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute('href', '/bookshelf');
    expect(screen.queryByText('Book Five')).not.toBeInTheDocument();
    expect(mocks.loadProgressLocally).toHaveBeenCalledWith('book-1', 'reader-99');
  });

  it('uses a minimal progress indicator when the total page count is unknown', () => {
    mocks.bookshelf = [shelfItem({ books_library: { title: 'Unknown Pages', author: null, cover_image_url: null } })];
    mocks.loadProgressLocally.mockReturnValue({ currentPage: 12, totalPages: 0 });

    renderCurrentReads();

    expect(screen.getByText('Page 12')).toBeInTheDocument();
    expect(screen.queryByText(/12%/)).not.toBeInTheDocument();
  });

  it('navigates to the book when its card is clicked or activated with the keyboard', () => {
    mocks.bookshelf = [shelfItem()];
    const firstRender = renderCurrentReads();
    const bookCard = screen.getByText('The Dispossessed').closest('[role="button"]');
    expect(bookCard).not.toBeNull();
    fireEvent.click(bookCard!);
    expect(screen.getByLabelText('current route')).toHaveTextContent('/book/book-1');

    firstRender.unmount();
    renderCurrentReads();
    const keyboardCard = screen.getByText('The Dispossessed').closest('[role="button"]');
    expect(keyboardCard).not.toBeNull();
    fireEvent.keyDown(keyboardCard!, { key: 'Enter' });
    expect(screen.getByLabelText('current route')).toHaveTextContent('/book/book-1');
  });

  it('resumes from the saved page without triggering the parent card click twice', () => {
    mocks.bookshelf = [shelfItem()];
    mocks.loadProgressLocally.mockReturnValue({ currentPage: 9, totalPages: 30 });
    renderCurrentReads();

    fireEvent.click(screen.getByRole('button', { name: 'Resume · Pg 9' }));
    expect(screen.getByLabelText('current route')).toHaveTextContent('/book/book-1');
  });
});
