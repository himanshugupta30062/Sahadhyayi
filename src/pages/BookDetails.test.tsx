// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookDetails from './BookDetails';
import * as bookByIdHook from '@/hooks/useBookById';
import * as ratingsHook from '@/hooks/useBookRatings';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb" />,
}));

vi.mock('@/components/books/BookCover', () => ({
  default: () => <div data-testid="book-cover" />,
}));

vi.mock('@/components/books/BookDescription', () => ({
  default: () => <div data-testid="book-description" />,
}));

vi.mock('@/components/books/BookReadersConnection', () => ({
  default: () => <div data-testid="readers-connection" />,
}));

vi.mock('@/components/books/CreateYourVersionSection', () => ({
  default: () => <div data-testid="create-version" />,
}));

vi.mock('@/components/books/BookIdeasSection', () => ({
  default: () => <div data-testid="book-ideas" />,
}));

vi.mock('@/components/books/BookReader', () => ({
  default: () => <div data-testid="book-reader" />,
}));

vi.mock('@/components/books/BookSocialStrip', () => ({
  BookSocialStrip: () => <div data-testid="book-social-strip" />,
}));

vi.mock('@/components/books/BookEditionTransparency', () => ({
  BookEditionTransparency: () => null,
}));

vi.mock('@/components/books/BookSeriesSection', () => ({
  BookSeriesSection: () => null,
}));

vi.mock('@/components/books/BookEditionPicker', () => ({
  BookEditionPicker: () => null,
}));

vi.mock('@/components/books/BookExperienceTags', () => ({
  default: () => null,
}));

vi.mock('@/components/books/BookReviews', () => ({
  default: () => null,
}));

vi.mock('@/components/books/BookLiteraryVoices', () => ({
  default: () => null,
}));

vi.mock('@/lib/supabase/events', () => ({
  logBookEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('BookDetails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
    vi.spyOn(ratingsHook, 'useBookRatings').mockReturnValue({
      data: { averageRating: 4.5, totalRatings: 10, userRating: null },
      isLoading: false,
    } as any);
    vi.spyOn(ratingsHook, 'useRateBook').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  it('renders loading state while book is loading', () => {
    vi.spyOn(bookByIdHook, 'useBookById').mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    renderWithProviders(
      <MemoryRouter initialEntries={['/books/book-123']}>
        <Routes>
          <Route path="/books/:id" element={<BookDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading book details...')).toBeInTheDocument();
  });

  it('renders not found state when book is missing', () => {
    vi.spyOn(bookByIdHook, 'useBookById').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(
      <MemoryRouter initialEntries={['/books/missing-book']}>
        <Routes>
          <Route path="/books/:id" element={<BookDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Book Not Found' })).toBeInTheDocument();
    expect(screen.getByText(/Book ID: missing-book/i)).toBeInTheDocument();
  });

  it('renders book details and child tabs when book is found', () => {
    vi.spyOn(bookByIdHook, 'useBookById').mockReturnValue({
      data: {
        id: 'book-123',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        publication_year: 1813,
        pages: 432,
        language: 'English',
        description: 'Classic romantic novel.',
      },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(
      <MemoryRouter initialEntries={['/books/book-123']}>
        <Routes>
          <Route path="/books/:id" element={<BookDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Pride and Prejudice' })).toBeInTheDocument();
    expect(screen.getByText('Romance')).toBeInTheDocument();
    expect(screen.getByText('1813')).toBeInTheDocument();
    expect(screen.getByText('432')).toBeInTheDocument();
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByTestId('book-cover')).toBeInTheDocument();
  });
});
