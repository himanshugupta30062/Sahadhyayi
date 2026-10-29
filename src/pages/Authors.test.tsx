// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  authors: [] as any[],
  books: [] as any[],
  isLoading: false,
  error: null as unknown,
  refetch: vi.fn(),
}));

vi.mock('@/hooks/useAuthors', () => ({
  useAuthors: () => ({
    data: mocks.authors,
    isLoading: mocks.isLoading,
    error: mocks.error,
    refetch: mocks.refetch,
  }),
}));

vi.mock('@/hooks/useLibraryBooks', () => ({
  useAllLibraryBooks: () => ({ data: mocks.books }),
}));

vi.mock('@/components/authors/FollowButton', () => ({
  FollowButton: () => <button type="button">Follow author</button>,
}));

vi.mock('@/components/authors/VerificationBadge', () => ({
  VerificationBadge: () => <span>Verified author</span>,
}));

vi.mock('@/components/SEO', () => ({ default: () => null }));
vi.mock('@/components/Breadcrumb', () => ({ default: () => null }));
vi.mock('@/components/ui/BookFlipLoader', () => ({
  default: ({ text }: { text?: string }) => <div role="status">{text}</div>,
}));

vi.mock('@/components/library/LibraryPagination', () => ({
  default: ({
    currentPage,
    onPageChange,
    onPageSizeChange,
  }: {
    currentPage: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onPageChange(currentPage + 1)}>Next authors page</button>
      <button type="button" onClick={() => onPageSizeChange(6)}>Show 6 authors</button>
    </div>
  ),
}));

import Authors from './Authors';

const author = (id: string, name: string, genres: string[], booksCount = 1, extra: Record<string, any> = {}) => ({
  id,
  name,
  bio: `${name} writes about books and ideas.`,
  genres,
  books_count: booksCount,
  created_at: '2025-01-01T00:00:00.000Z',
  profile_image_url: null,
  location: 'Unknown',
  verified: false,
  verification_type: null,
  ...extra,
});

const renderAuthors = () => render(
  <MemoryRouter initialEntries={['/authors']}>
    <Authors />
  </MemoryRouter>,
);

describe('Authors directory', () => {
  beforeEach(() => {
    mocks.authors = [
      author('le-guin', 'Ursula K. Le Guin', ['Fantasy', 'Science Fiction'], 10),
      author('tolkien', 'J. R. R. Tolkien', ['Fantasy'], 6),
      author('osho', 'Osho', ['Spirituality', 'Philosophy'], 4),
    ];
    mocks.books = [
      { id: 'book-1', title: 'The Dispossessed', author: '  ursula k. le guin ', cover_image_url: 'https://example.com/cover.jpg' },
    ];
    mocks.isLoading = false;
    mocks.error = null;
    mocks.refetch.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a loading state while author data is being fetched', () => {
    mocks.isLoading = true;
    renderAuthors();

    expect(screen.getByRole('status')).toHaveTextContent('Finding authors...');
  });

  it('offers a retry action when author loading fails', () => {
    mocks.error = new Error('Author service unavailable');
    renderAuthors();

    expect(screen.getByRole('heading', { name: 'Authors are taking a quiet moment' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('renders authors in book-count order and matches library books case-insensitively', () => {
    renderAuthors();

    expect(screen.getByRole('heading', { name: 'Meet the minds behind the books.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ursula K. Le Guin' })).toBeInTheDocument();
    expect(screen.getByText('10 in catalog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'The Dispossessed' })).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    );
    expect(screen.getByRole('link', { name: /The Dispossessed/ })).toHaveAttribute('href', '/book/book-1');
    expect(screen.getByRole('link', { name: /All books/ })).toHaveAttribute(
      'href',
      '/library?author=Ursula%20K.%20Le%20Guin',
    );
    expect(screen.getAllByRole('link', { name: /View profile/ })[0]).toHaveAttribute('href', '/authors/ursula-k-le-guin');
  });

  it('filters by author name and genre, and clears a no-results search', () => {
    renderAuthors();
    const search = screen.getByRole('textbox', { name: 'Search authors by name, bio, or genre' });

    fireEvent.change(search, { target: { value: 'Tolkien' } });
    expect(screen.getByRole('heading', { name: 'J. R. R. Tolkien' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ursula K. Le Guin' })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'no matching writer' } });
    expect(screen.getByText('No writers found for this search')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Clear filters/ })[0]);
    expect(screen.getByRole('heading', { name: 'Ursula K. Le Guin' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Spirituality' }));
    expect(screen.getByRole('heading', { name: 'Osho' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'J. R. R. Tolkien' })).not.toBeInTheDocument();
  });

  it('paginates large directories and resets the page size when requested', () => {
    mocks.authors = Array.from({ length: 13 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return author(`author-${number}`, `Author ${number}`, ['Fiction'], 1);
    });
    mocks.books = [];
    renderAuthors();

    expect(screen.getByRole('heading', { name: 'Author 01' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Author 13' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next authors page' }));
    expect(screen.getByRole('heading', { name: 'Author 13' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Author 01' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show 6 authors' }));
    expect(screen.getByText('Showing 6 of 13 authors')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Author 01' })).toBeInTheDocument();
  });
});
