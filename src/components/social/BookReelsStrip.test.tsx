// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookReelsStrip } from './BookReelsStrip';
import { SAMPLE_BOOK_REELS, BookReelItem } from '@/data/sampleSocialPosts';

const customReels: BookReelItem[] = [
  {
    id: 'custom-reel-1',
    tag: '📚 10S HIGHLIGHT',
    tagColor: 'bg-emerald-700 text-white',
    readerName: 'Ananya Roy',
    readerHandle: 'ananya_roy',
    readerAvatar: 'https://example.com/avatar1.jpg',
    bookTitle: 'The Palace of Illusions',
    bookAuthor: 'Chitra Banerjee Divakaruni',
    hook: 'Draupadi’s fire in 10 seconds flat.',
    fullQuote: '“I am not what happened to me, I am what I choose to become.”',
    moodAudio: 'Classical Sitar',
    imageUrl: 'https://example.com/cover1.jpg',
    videoUrl: 'https://example.com/reel1.mp4',
    durationSeconds: 10,
    likesCount: 25,
    commentsCount: 3,
  },
  {
    id: 'custom-reel-2',
    tag: '⚡ QUICK TAKE',
    tagColor: 'bg-blue-700 text-white',
    readerName: 'Rohan Varma',
    readerHandle: 'rohan_v',
    readerAvatar: 'https://example.com/avatar2.jpg',
    bookTitle: 'Cosmos',
    bookAuthor: 'Carl Sagan',
    hook: 'We are made of starstuff.',
    fullQuote: '“The cosmos is within us.”',
    moodAudio: 'Ambient Space',
    imageUrl: 'https://example.com/cover2.jpg',
    videoUrl: 'https://example.com/reel2.mp4',
    durationSeconds: 7.5,
    likesCount: 18,
    commentsCount: 1,
  },
];

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

  it('displays accurate duration badges (10s and 7.5s) on cards', () => {
    renderWithProviders(<BookReelsStrip reels={customReels} />);

    expect(screen.getByText('10s')).toBeInTheDocument();
    expect(screen.getByText('7.5s')).toBeInTheDocument();
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

  it('navigates to next reel in viewer via button and keyboard arrow keys', () => {
    renderWithProviders(<BookReelsStrip reels={customReels} />);

    const firstCard = screen.getAllByText('Ananya Roy')[0].closest('[role="button"]');
    fireEvent.click(firstCard!);

    expect(screen.getByText(/1 of 2/i)).toBeInTheDocument();

    // Next via button
    const nextBtn = screen.getByRole('button', { name: /^next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/@rohan_v/i)).toBeInTheDocument();

    // Prev via ArrowLeft key
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/@ananya_roy/i)).toBeInTheDocument();

    // Next via ArrowRight key
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/2 of 2/i)).toBeInTheDocument();
  });

  it('does not trigger reel navigation when typing in the comment input', () => {
    renderWithProviders(<BookReelsStrip reels={customReels} />);

    const firstCard = screen.getAllByText('Ananya Roy')[0].closest('[role="button"]');
    fireEvent.click(firstCard!);

    expect(screen.getByText(/1 of 2/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Add a thoughtful reaction/i);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' });

    // Should remain on 1 of 2 because input had focus
    expect(screen.getByText(/1 of 2/i)).toBeInTheDocument();
  });

  it('copies reel share link to clipboard on share click', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    renderWithProviders(<BookReelsStrip reels={customReels} />);

    const firstCard = screen.getAllByText('Ananya Roy')[0].closest('[role="button"]');
    fireEvent.click(firstCard!);

    const shareBtn = screen.getByRole('button', { name: /share reel/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(
        expect.stringContaining('/social/reels/custom-reel-1')
      );
    });
  });
});
