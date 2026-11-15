import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBookById } from './useBookById';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/utils/catalog/bookVisibility', () => ({
  detectBookSchemaCapabilities: vi.fn().mockResolvedValue({}),
  getPublicBookSelectColumns: vi.fn().mockReturnValue('id,title,author'),
  isBookPubliclyVisible: vi.fn().mockReturnValue(true),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useBookById', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches public book by id from books_library', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'book-1', title: 'Brave New World', author: 'Aldous Huxley' },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useBookById('book-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.title).toBe('Brave New World');
  });
});
