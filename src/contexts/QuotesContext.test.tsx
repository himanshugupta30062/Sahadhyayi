import React from 'react';
import { cleanup, renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuotesProvider from '@/contexts/QuotesContext';
import { useQuotes } from '@/contexts/quotesHelpers';
import * as authHelpers from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client';

describe('QuotesContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('manages local quotes for unauthenticated guests', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QuotesProvider>{children}</QuotesProvider>
    );

    const { result } = renderHook(() => useQuotes(), { wrapper });

    await waitFor(() => expect(result.current.syncStatus).toBe('local'));
    expect(result.current.quotes).toEqual([]);

    act(() => {
      result.current.addQuote('Be yourself; everyone else is already taken.', 'Oscar Wilde', 'Classic');
    });

    expect(result.current.quotes.length).toBe(1);
    expect(result.current.quotes[0].text).toBe('Be yourself; everyone else is already taken.');
    expect(result.current.quotes[0].source).toBe('Oscar Wilde');

    const addedId = result.current.quotes[0].id;

    act(() => {
      result.current.removeQuote(addedId);
    });

    expect(result.current.quotes.length).toBe(0);
  });

  it('syncs quotes to and from cloud for authenticated user', async () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: { id: 'user-cloud-1' },
    } as any);

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              client_id: 'cloud-q-1',
              quote_text: 'Stay hungry, stay foolish.',
              source: 'Steve Jobs',
              note: null,
              book_id: null,
              page: null,
              location: null,
              created_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'saved_quotes') {
        return {
          upsert: mockUpsert,
          select: mockSelect,
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    }) as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QuotesProvider>{children}</QuotesProvider>
    );

    const { result } = renderHook(() => useQuotes(), { wrapper });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced');
      expect(result.current.quotes.length).toBe(1);
      expect(result.current.quotes[0].text).toBe('Stay hungry, stay foolish.');
    });
  });
});
