import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { useBookStats } from '@/hooks/useBookStats';

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

describe('useBookStats', () => {
  afterEach(() => cleanup());

  it('generates simulated book reading statistics', async () => {
    const { result } = renderHook(() => useBookStats('book-100'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const stats = result.current.data;
    expect(stats).toBeDefined();
    expect(stats?.totalReaders).toBeGreaterThanOrEqual(100);
    expect(stats?.currentReaders).toBeGreaterThanOrEqual(10);
    expect(stats?.pastReaders).toBe(stats!.totalReaders - stats!.currentReaders);
    expect(stats?.readers.length).toBe(3);
  });
});
