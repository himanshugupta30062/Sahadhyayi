import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurrentBook } from '@/hooks/useCurrentBook';
import { supabase } from '@/integrations/supabase/client-universal';
import * as authHelpers from '@/contexts/authHelpers';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCurrentBook', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('returns null when user is not authenticated', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      profile: null,
      loading: false,
      signOut: async () => {},
    } as any);

    const { result } = renderHook(() => useCurrentBook(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('fetches reading book from bookshelf when user is logged in', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: { id: 'user-456' } as any,
      session: null,
      profile: null,
      loading: false,
      signOut: async () => {},
    } as any);

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  book_id: 'b-999',
                  books_library: {
                    id: 'b-999',
                    title: 'Current Masterpiece',
                    author: 'Famous Author',
                    cover_image_url: '/covers/b999.jpg',
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'user_bookshelf') {
        return { select: mockSelect } as any;
      }
      return {} as any;
    }) as any);

    const { result } = renderHook(() => useCurrentBook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      id: 'b-999',
      title: 'Current Masterpiece',
      author: 'Famous Author',
      cover_image_url: '/covers/b999.jpg',
    });
  });
});
