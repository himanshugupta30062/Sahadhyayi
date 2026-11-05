// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookReadersConnection from './BookReadersConnection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/hooks/use-toast';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/components/SignInLink', () => ({
  default: () => <a href="/signin">Sign In</a>,
}));

describe('BookReadersConnection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders sign in prompt when logged out and empty state message', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

    render(
      <QueryClientProvider client={queryClient}>
        <BookReadersConnection bookId="book-1" bookTitle="Anna Karenina" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Connect with Fellow Readers')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to connect with fellow readers/i)).toBeInTheDocument();
    expect(await screen.findByText(/No comments yet. Be the first to share your thoughts!/i)).toBeInTheDocument();
  });

  it('allows authenticated users to submit a comment', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as any);

    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const mockInsertQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'content_feedback') {
        return {
          ...mockSelectQuery,
          ...mockInsertQuery,
        } as any;
      }
      return mockSelectQuery as any;
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BookReadersConnection bookId="book-1" bookTitle="Anna Karenina" />
      </QueryClientProvider>
    );

    const textarea = screen.getByPlaceholderText(/Share your thoughts about this book.../i);
    fireEvent.change(textarea, { target: { value: 'All happy families are alike...' } });

    const postBtn = screen.getByRole('button', { name: /Post Comment/i });
    fireEvent.click(postBtn);

    await waitFor(() => {
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          book_id: 'book-1',
          feedback_type: 'reader_comment',
        })
      );
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Comment posted',
        })
      );
    });
  });
});
