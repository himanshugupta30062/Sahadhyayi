// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookIdeasSection from './BookIdeasSection';
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

describe('BookIdeasSection', () => {
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

  it('renders ideas list and empty state message when no ideas exist', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

    render(
      <QueryClientProvider client={queryClient}>
        <BookIdeasSection bookId="book-1" bookTitle="1984" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Ideas and Feedback')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to share your ideas and feedback/i)).toBeInTheDocument();
    expect(await screen.findByText(/No feedback yet. Be the first to share your ideas!/i)).toBeInTheDocument();
  });

  it('allows authenticated users to submit new ideas', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as any);

    const mockSelectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const mockInsertQuery = {
      insert: vi.fn().mockResolvedValue({ data: { id: 'fb-1' }, error: null }),
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
        <BookIdeasSection bookId="book-1" bookTitle="1984" />
      </QueryClientProvider>
    );

    const titleInput = screen.getByPlaceholderText(/Brief description of your feedback.../i);
    const bodyInput = screen.getByPlaceholderText(/Provide more details about your feedback.../i);

    fireEvent.change(titleInput, { target: { value: 'Fix typo on page 50' } });
    fireEvent.change(bodyInput, { target: { value: 'There is a misspelling of Oceania.' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockInsertQuery.insert).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Feedback submitted',
        })
      );
    });
  });
});
