/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserSearch } from './useUserSearch';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  rpc: vi.fn(),
  neq: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc: mocks.rpc },
}));

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useUserSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.useAuth.mockReturnValue({ user: { id: 'current-user' } });
    mocks.rpc.mockReturnValue({ neq: mocks.neq });
    mocks.neq.mockResolvedValue({ data: [{ id: 'other-user', full_name: 'Alex Reader' }], error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not query for terms shorter than two characters', () => {
    const { result } = renderHook(() => useUserSearch('a'), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('debounces and trims the term and excludes the signed-in user', async () => {
    const { result, rerender } = renderHook(({ term }: { term: string }) => useUserSearch(term), {
      initialProps: { term: 'a' },
      wrapper: makeWrapper(),
    });
    rerender({ term: '  alex  ' });
    expect(result.current.isDebouncing).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();

    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'other-user', full_name: 'Alex Reader' }]));
    expect(mocks.rpc).toHaveBeenCalledWith('get_public_profiles_for_search', { search_term: 'alex' });
    expect(mocks.neq).toHaveBeenCalledWith('id', 'current-user');
    expect(result.current.isDebouncing).toBe(false);
  });

  it('keeps search disabled without an authenticated user', async () => {
    mocks.useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useUserSearch('reader'), { wrapper: makeWrapper() });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('exposes RPC failures as query errors', async () => {
    const searchError = new Error('search unavailable');
    mocks.neq.mockResolvedValue({ data: null, error: searchError });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useUserSearch('reader'), { wrapper: makeWrapper() });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    await waitFor(() => expect(result.current.error).toBe(searchError));
    expect(consoleError).toHaveBeenCalledWith('User search failed', { errorName: 'Error' });
    consoleError.mockRestore();
  });
});
