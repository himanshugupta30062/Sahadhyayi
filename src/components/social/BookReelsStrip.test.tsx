// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { BookReelsStrip } from './BookReelsStrip';
import { SAMPLE_BOOK_REELS } from '@/data/sampleSocialPosts';

const { mockSupabase } = vi.hoisted(() => {
  const mockChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn().mockResolvedValue({ data: [] }),
      order: vi.fn(() => chain),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => chain),
      then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return chain;
  };

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn(() => mockChain()),
  };

  return { mockSupabase: client };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: true,
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: true,
}));

describe('BookReelsStrip', () => {
  it('renders reels carousel with titles and tags', () => {
    render(
      <MemoryRouter>
        <BookReelsStrip reels={SAMPLE_BOOK_REELS} />
      </MemoryRouter>
    );

    expect(screen.getByText('Book Reels & Reader Moments')).toBeInTheDocument();
    expect(screen.getAllByText('Priya Sharma')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Aarav Mehta')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Kabir D.')[0]).toBeInTheDocument();
  });

  it('opens reel modal viewer when a reel card is clicked and allows reaction', async () => {
    render(
      <MemoryRouter>
        <BookReelsStrip reels={SAMPLE_BOOK_REELS} />
      </MemoryRouter>
    );

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
      expect(mockSupabase.from).toHaveBeenCalledWith('book_reel_reactions');
    });
    await waitFor(() => {
      const updatedButton = screen.getByRole('button', { name: /react with love/i });
      expect(updatedButton).toHaveClass('bg-amber-400');
    });
  });

  it('navigates to next reel in viewer', () => {
    render(
      <MemoryRouter>
        <BookReelsStrip reels={SAMPLE_BOOK_REELS} />
      </MemoryRouter>
    );

    const firstCard = screen.getAllByText('Priya Sharma')[0].closest('[role="button"]');
    fireEvent.click(firstCard!);

    expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /^next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/@aarav_pages/i)).toBeInTheDocument();
  });
});

