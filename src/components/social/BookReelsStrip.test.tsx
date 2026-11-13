// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookReelsStrip } from './BookReelsStrip';
import { SAMPLE_BOOK_REELS } from '@/data/sampleSocialPosts';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      in: vi.fn().mockResolvedValue({ data: [] }),
      eq: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/video.mp4' } })),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  },
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: [
      {
        id: 'shelf-1',
        book_id: 'book-1',
        status: 'reading',
        books_library: { id: 'book-1', title: 'Siddhartha', author: 'Hermann Hesse' },
      },
    ],
    isLoading: false,
  }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('BookReelsStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reels carousel with titles and tags', () => {
    renderWithProviders(<BookReelsStrip reels={SAMPLE_BOOK_REELS} />);

    expect(screen.getByText('Book Reels & Reader Moments')).toBeInTheDocument();
    expect(screen.getAllByText('Priya Sharma')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Aarav Mehta')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Kabir D.')[0]).toBeInTheDocument();
  });

  it('opens reel modal viewer when a reel card is clicked and allows reaction', async () => {
    renderWithProviders(<BookReelsStrip reels={SAMPLE_BOOK_REELS} />);

    const firstCard = screen.getAllByText('Priya Sharma')[0].closest('[role="button"]');
    expect(firstCard).not.toBeNull();
    fireEvent.click(firstCard!);

    // Modal should now be open
    expect(screen.getByText(/@priya_reads_late/i)).toBeInTheDocument();
    expect(screen.getByText(/Who gave Madeline Miller the legal authority/i)).toBeInTheDocument();

    // React with Love
    const reactButton = screen.getByRole('button', { name: /react with love/i });
    fireEvent.click(reactButton);

    await waitFor(() => {
      expect(reactButton).toHaveClass('bg-amber-400');
    });
  });

  it('navigates to next reel in viewer', () => {
    renderWithProviders(<BookReelsStrip reels={SAMPLE_BOOK_REELS} />);

    const firstCard = screen.getAllByText('Priya Sharma')[0].closest('[role="button"]');
    fireEvent.click(firstCard!);

    expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /^next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/@aarav_pages/i)).toBeInTheDocument();
  });
});

