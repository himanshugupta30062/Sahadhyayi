/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToggleUserFollow, useUserFollows } from '@/hooks/useUserFollows';

const { mockSupabase, mockAuth } = vi.hoisted(() => ({
  mockSupabase: { from: vi.fn() },
  mockAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => mockAuth(),
}));

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('reader follow hooks', () => {
  let queryResult: { data: unknown; error: unknown };
  let builder: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ user: { id: 'reader-a' } });
    queryResult = { data: [{ following_id: 'reader-b' }], error: null };
    builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      then: (resolve: (value: typeof queryResult) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(queryResult).then(resolve, reject),
    };
    mockSupabase.from.mockReturnValue(builder);
  });

  afterEach(() => cleanup());

  it('loads only the current reader’s outgoing follows', async () => {
    const { result } = renderHook(() => useUserFollows(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(['reader-b']));
    expect(mockSupabase.from).toHaveBeenCalledWith('user_follows');
    expect(builder.select).toHaveBeenCalledWith('following_id');
    expect(builder.eq).toHaveBeenCalledWith('follower_id', 'reader-a');
  });

  it('inserts a follow for the signed-in reader', async () => {
    const { result } = renderHook(() => useToggleUserFollow(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({ targetUserId: 'reader-b', isFollowing: false });

    expect(mockSupabase.from).toHaveBeenCalledWith('user_follows');
    expect(builder.insert).toHaveBeenCalledWith({ follower_id: 'reader-a', following_id: 'reader-b' });
  });

  it('deletes only the signed-in reader’s follow edge when unfollowing', async () => {
    const { result } = renderHook(() => useToggleUserFollow(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({ targetUserId: 'reader-b', isFollowing: true });

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'follower_id', 'reader-a');
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'following_id', 'reader-b');
  });

  it('rejects attempts to follow the current account', async () => {
    const { result } = renderHook(() => useToggleUserFollow(), { wrapper: makeWrapper() });

    await expect(
      result.current.mutateAsync({ targetUserId: 'reader-a', isFollowing: false })
    ).rejects.toThrow('You cannot follow your own account.');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
