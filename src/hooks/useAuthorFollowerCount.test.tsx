import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuthorFollowerCount } from '@/hooks/useAuthorFollowerCount';
import { supabase } from '@/integrations/supabase/client-universal';

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

describe('useAuthorFollowerCount', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not run query if authorId is not provided', () => {
    const { result } = renderHook(() => useAuthorFollowerCount(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('fetches follower count via rpc when authorId is provided', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: 42,
      error: null,
    } as any);

    const { result } = renderHook(() => useAuthorFollowerCount('auth-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(42);
    expect(supabase.rpc).toHaveBeenCalledWith('get_author_follower_count', {
      author_uuid: 'auth-123',
    });
  });

  it('returns 0 if rpc returns an error', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    } as any);

    const { result } = renderHook(() => useAuthorFollowerCount('auth-err'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });
});
