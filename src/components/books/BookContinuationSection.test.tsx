import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import BookContinuationSection from '@/components/books/BookContinuationSection';
import * as authHelpers from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
};

describe('BookContinuationSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders community sequel tallies from get_sequel_vote_counts RPC and sign-in call to action', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);

    // Mock RPC for counts-only tally
    vi.spyOn(supabase, 'rpc').mockImplementation(((fn: string, params: any) => {
      if (fn === 'get_sequel_vote_counts') {
        return Promise.resolve({
          data: [{ yes_count: 12, no_count: 3 }],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }) as any);

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }),
    });
    vi.spyOn(supabase, 'from').mockImplementation(mockFrom as any);

    render(
      <BookContinuationSection
        bookId="book-456"
        bookTitle="The Time Machine"
        genre="Sci-Fi"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Should There Be a Sequel\?/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_sequel_vote_counts', {
        p_book_id: 'book-456',
      });
      expect(screen.getByText(/12/)).toBeInTheDocument();
    });
  });

  it('allows authenticated user to vote yes on sequel', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: { id: 'u-789' },
    } as any);

    vi.spyOn(supabase, 'rpc').mockImplementation(((fn: string) => {
      if (fn === 'get_sequel_vote_counts') {
        return Promise.resolve({
          data: [{ yes_count: 5, no_count: 1 }],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }) as any);

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'content_feedback') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                like: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
          insert: mockInsert,
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    });
    vi.spyOn(supabase, 'from').mockImplementation(mockFrom as any);

    render(
      <BookContinuationSection
        bookId="book-456"
        bookTitle="The Time Machine"
        genre="Sci-Fi"
      />,
      { wrapper: createWrapper() }
    );

    const yesBtn = await screen.findByRole('button', { name: /yes, i want a sequel!/i });
    fireEvent.click(yesBtn);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback_type: 'sequel_vote',
          user_id: 'u-789',
        })
      );
    });
  });
});
