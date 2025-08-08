import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLibraryBooks } from './useLibraryBooks';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ data: [], error: null })
    })
  }
}));

describe('useLibraryBooks', () => {
  it('returns books array', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useLibraryBooks(), { wrapper });
    await waitFor(() => {
      expect(Array.isArray(result.current.data)).toBe(true);
    });
  });
});
