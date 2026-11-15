import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { useBookRecommendations } from '@/hooks/useBookRecommendations';
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

describe('useBookRecommendations', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not run if userId is not provided', () => {
    const { result } = renderHook(() => useBookRecommendations(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('invokes recommendations edge function and returns filtered books', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        recommendations: [
          { id: 'b1', title: 'The Great Novel', author: 'Author A' },
          { id: 'b2', title: 'Science Today', author: 'Author B' },
        ],
      },
      error: null,
    } as any);

    const { result } = renderHook(() => useBookRecommendations('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0].title).toBe('The Great Novel');
  });

  it('throws an error if edge function returns error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('Invocation failed'),
    } as any);

    const { result } = renderHook(() => useBookRecommendations('user-err'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Failed to fetch recommendations');
  });
});
