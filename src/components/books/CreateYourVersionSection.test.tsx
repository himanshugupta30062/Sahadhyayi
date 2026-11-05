// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateYourVersionSection from './CreateYourVersionSection';
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

describe('CreateYourVersionSection', () => {
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

  it('renders sign in prompt when not logged in and empty versions list', async () => {
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
        <CreateYourVersionSection bookId="book-1" bookTitle="Hamlet" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Create Your Own Version')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to create and share your own versions/i)).toBeInTheDocument();
    expect(await screen.findByText(/No versions yet. Be the first to create one!/i)).toBeInTheDocument();
  });

  it('allows authenticated users to submit a new version', async () => {
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
      if (table === 'user_generated_content') {
        return {
          ...mockSelectQuery,
          ...mockInsertQuery,
        } as any;
      }
      return mockSelectQuery as any;
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CreateYourVersionSection bookId="book-1" bookTitle="Hamlet" />
      </QueryClientProvider>
    );

    const titleInput = screen.getByPlaceholderText(/Give your version a title.../i);
    const contentInput = screen.getByPlaceholderText(/Write your version here/i);

    fireEvent.change(titleInput, { target: { value: 'Modern Hamlet in Tokyo' } });
    fireEvent.change(contentInput, { target: { value: 'To be or not to be, neon lights glowing.' } });

    const submitBtn = screen.getByRole('button', { name: /Publish Version/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          book_id: 'book-1',
          title: 'Modern Hamlet in Tokyo',
          content: 'To be or not to be, neon lights glowing.',
        })
      );
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Version published',
        })
      );
    });
  });
});
