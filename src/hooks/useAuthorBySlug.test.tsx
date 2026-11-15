import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthorBySlug } from './useAuthorBySlug';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('useAuthorBySlug', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('matches author by slug from RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        { id: '1', name: 'George Orwell', bio: 'English novelist' },
      ],
      error: null,
    } as any);

    const { result } = renderHook(() => useAuthorBySlug('george-orwell'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.name).toBe('George Orwell');
  });

  it('falls back to mockAuthors when RPC fails or author is in mock list', async () => {
    vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuthorBySlug('rabindranath-tagore'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.name).toContain('Tagore');
  });
});
