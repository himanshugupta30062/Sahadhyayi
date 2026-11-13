// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookReadingJournal from './BookReadingJournal';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: () => ({
    data: [
      {
        id: 'n1',
        user_id: 'u1',
        book_id: 'b1',
        page: 15,
        quote: 'Truth alone triumphs.',
        note: 'Personal reflection on truth in adversity.',
        visibility: 'private',
        created_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useReaderHighlights', () => ({
  useReaderHighlights: () => ({
    data: [
      {
        id: 'h1',
        user_id: 'u1',
        book_id: 'b1',
        text: 'The mind is everything. What you think you become.',
        page: 22,
        color: 'yellow',
        created_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
  useDeleteReaderHighlight: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/contexts/quotesHelpers', () => ({
  useQuotes: () => ({
    quotes: [
      {
        id: 1,
        text: 'A room without books is like a body without a soul.',
        source: 'Cicero',
        bookId: 'b1',
        page: 5,
      },
    ],
    addQuote: vi.fn(),
    removeQuote: vi.fn(),
  }),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({
    data: [
      {
        id: 1,
        book_id: 'b1',
        book_title: 'Satyamev',
        current_page: 25,
        total_pages: 100,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/utils/readingProgressStorage', () => ({
  loadProgressLocally: () => ({ currentPage: 25, totalPages: 100 }),
}));

describe('BookReadingJournal', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders reading progress, statistics, and unified entries', () => {
    render(
      <MemoryRouter>
        <BookReadingJournal bookId="b1" bookTitle="Satyamev" currentPage={25} />
      </MemoryRouter>
    );

    // Book header & progress
    expect(screen.getByText('Satyamev')).toBeInTheDocument();
    expect(screen.getByText(/Page 25 of 100 · 25% read/i)).toBeInTheDocument();

    // Stats counter pills
    expect(screen.getByText('3 total')).toBeInTheDocument();
    expect(screen.getByText('1 reflections')).toBeInTheDocument();
    expect(screen.getByText('1 highlights')).toBeInTheDocument();
    expect(screen.getByText('1 quotes')).toBeInTheDocument();

    // Entries content
    expect(screen.getByText(/Truth alone triumphs/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal reflection on truth/i)).toBeInTheDocument();
    expect(screen.getByText(/The mind is everything/i)).toBeInTheDocument();
    expect(screen.getByText(/A room without books/i)).toBeInTheDocument();
  });

  it('filters entries when filter pill is clicked', () => {
    render(
      <MemoryRouter>
        <BookReadingJournal bookId="b1" bookTitle="Satyamev" currentPage={25} />
      </MemoryRouter>
    );

    // Click Highlights filter
    const highlightsFilter = screen.getByRole('button', { name: /Highlights \(1\)/i });
    fireEvent.click(highlightsFilter);

    expect(screen.getByText(/The mind is everything/i)).toBeInTheDocument();
    expect(screen.queryByText(/Personal reflection on truth/i)).not.toBeInTheDocument();
  });
});

