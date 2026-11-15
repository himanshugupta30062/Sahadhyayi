import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLibraryBookCount } from '@/hooks/useLibraryBookCount';
import { supabase } from '@/integrations/supabase/client-universal';
import * as bookVis from '@/utils/catalog/bookVisibility';

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

describe('useLibraryBookCount', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('queries book count and returns exact count', async () => {
    vi.spyOn(bookVis, 'detectBookSchemaCapabilities').mockResolvedValue({} as any);
    vi.spyOn(bookVis, 'applyPublicBookFilter').mockImplementation((q: any) => q);

    const mockSelect = vi.fn().mockResolvedValue({
      count: 1542,
      error: null,
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useLibraryBookCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(1542);
  });

  it('registers shelfUpdated and libraryUpdated event listeners', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useLibraryBookCount(), {
      wrapper: createWrapper(),
    });

    expect(addEventSpy).toHaveBeenCalledWith('shelfUpdated', expect.any(Function));
    expect(addEventSpy).toHaveBeenCalledWith('libraryUpdated', expect.any(Function));

    unmount();
    expect(removeEventSpy).toHaveBeenCalledWith('shelfUpdated', expect.any(Function));
    expect(removeEventSpy).toHaveBeenCalledWith('libraryUpdated', expect.any(Function));
  });
});
