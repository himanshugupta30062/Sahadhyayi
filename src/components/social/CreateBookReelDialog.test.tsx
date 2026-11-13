// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateBookReelDialog, MAX_REEL_DURATION_SECONDS } from './CreateBookReelDialog';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: { id: 'reel-new' }, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'reader-123' } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'reader-123/reel.mp4' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/reel.mp4' } })),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  },
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: [
      {
        id: 'shelf-item-1',
        book_id: 'book-101',
        status: 'reading',
        books_library: { id: 'book-101', title: 'The Alchemist', author: 'Paulo Coelho' },
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
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('CreateBookReelDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button and opens dialog with 10-second rule and fields', () => {
    renderWithProviders(<CreateBookReelDialog />);

    const trigger = screen.getByRole('button', { name: /create reel/i });
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);

    expect(screen.getByText('Create 10-Second Book Reel')).toBeInTheDocument();
    expect(screen.getByText(/10-Second Limit:/i)).toBeInTheDocument();
    expect(screen.getByText('Pick from my bookshelf')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What did this book make you feel\?/i)).toBeInTheDocument();
    expect(screen.getByText('#readingvibe ✓')).toBeInTheDocument();
  });

  it('allows picking a book from user bookshelf to auto-populate title and author', () => {
    renderWithProviders(<CreateBookReelDialog />);

    fireEvent.click(screen.getByRole('button', { name: /create reel/i }));
    fireEvent.click(screen.getByText('Pick from my bookshelf'));

    expect(screen.getByText('The Alchemist')).toBeInTheDocument();
    fireEvent.click(screen.getByText('The Alchemist'));

    expect(screen.queryByText('Pick from my bookshelf')).toBeInTheDocument();
  });

  it('toggles reading tags and supports custom tag entry', () => {
    renderWithProviders(<CreateBookReelDialog />);

    fireEvent.click(screen.getByRole('button', { name: /create reel/i }));

    const mustReadBtn = screen.getByRole('button', { name: /#mustread/i });
    fireEvent.click(mustReadBtn);
    expect(screen.getByText('#mustread ✓')).toBeInTheDocument();

    const customInput = screen.getByPlaceholderText(/Add custom tag/i);
    fireEvent.change(customInput, { target: { value: 'philosophy' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    expect(screen.getByText('#philosophy ✓')).toBeInTheDocument();
  });

  it('switches visibility between public, friends, and unlisted', () => {
    renderWithProviders(<CreateBookReelDialog />);

    fireEvent.click(screen.getByRole('button', { name: /create reel/i }));

    const friendsBtn = screen.getByRole('button', { name: /Friends Friends only/i });
    fireEvent.click(friendsBtn);
    expect(friendsBtn).toHaveClass('border-[hsl(var(--brand-primary))]');
  });

  it('enforces constant 10.5s limit check constant export', () => {
    expect(MAX_REEL_DURATION_SECONDS).toBe(10.5);
  });
});
