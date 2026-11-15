import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReaderBookmarks } from './useReaderBookmarks';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'reader-1' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useReaderBookmarks', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches bookmarks for a specific book', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'bm-1',
          user_id: 'reader-1',
          book_id: 'book-42',
          location: 'loc-1',
          page: 12,
          label: 'Chapter 2',
          created_at: '2026-01-01',
        },
      ],
      error: null,
    });
    const mockEqBook = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqBook });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useReaderBookmarks('book-42'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].label).toBe('Chapter 2');
  });
});
