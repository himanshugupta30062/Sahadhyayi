/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookPulseBar } from '@/components/social/BookPulseBar';
import { BookSocialStrip } from '@/components/books/BookSocialStrip';

// Mock hooks
vi.mock('@/hooks/useReadingRoom', () => ({
  useReadingRooms: () => ({
    data: [
      {
        id: 'room-1',
        book_id: 'book-101',
        name: 'Chapter 4 Deep Dive',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        books_library: { title: 'Dune', author: 'Frank Herbert' },
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: () => ({
    data: [
      {
        id: 'note-1',
        book_id: 'book-101',
        user_id: 'user-2',
        page: 42,
        quote: 'Fear is the mind-killer',
        note: 'Classic litany.',
        created_at: new Date().toISOString(),
        books_library: { title: 'Dune' },
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useSpoilerThreads', () => ({
  useSpoilerThreads: () => ({
    data: [
      {
        id: 'thread-1',
        book_id: 'book-101',
        title: 'The Gom Jabbar Test',
        min_chapter: 1,
        is_unlocked: true,
        created_at: new Date().toISOString(),
        books_library: { title: 'Dune' },
      },
    ],
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Book-Native Social Integration Components', () => {
  it('renders BookPulseBar with rooms, margins, and threads count', () => {
    renderWithProviders(<BookPulseBar />);
    expect(screen.getByText(/Book Pulse/i)).toBeDefined();
    expect(screen.getByText(/Rooms/i)).toBeDefined();
    expect(screen.getByText(/Margins/i)).toBeDefined();
    expect(screen.getByText(/Threads/i)).toBeDefined();
    expect(screen.getByText(/Chapter 4 Deep Dive/i)).toBeDefined();
  });

  it('renders BookSocialStrip with active room, note, and thread counts', () => {
    renderWithProviders(
      <BookSocialStrip bookId="book-101" bookTitle="Dune" />
    );
    expect(screen.getByText(/Book Community/i)).toBeDefined();
    expect(screen.getByText(/1 Active Room/i)).toBeDefined();
    expect(screen.getByText(/1 Margin Note/i)).toBeDefined();
    expect(screen.getByText(/1 Thread/i)).toBeDefined();
  });
});
