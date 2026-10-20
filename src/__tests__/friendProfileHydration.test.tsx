/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFriends, useFriendRequests } from '@/hooks/useFriends';

const { mockSupabase, mockAuth } = vi.hoisted(() => ({
  mockSupabase: { from: vi.fn(), rpc: vi.fn() },
  mockAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({ supabase: mockSupabase }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => mockAuth() }));

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('friend profile hydration', () => {
  let tableResult: { data: unknown[]; error: unknown };
  let builder: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ user: { id: 'reader-a' } });
    tableResult = { data: [], error: null };
    builder = {
      select: vi.fn(() => builder),
      or: vi.fn(() => builder),
      then: (resolve: (value: typeof tableResult) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(tableResult).then(resolve, reject),
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'friends') {
        tableResult = {
          data: [{ id: 'friendship-1', user1_id: 'reader-a', user2_id: 'reader-b', created_at: '2026-10-20T00:00:00Z' }],
          error: null,
        };
      } else {
        tableResult = {
          data: [{ id: 'request-1', requester_id: 'reader-b', addressee_id: 'reader-a', status: 'pending', created_at: '2026-10-20T00:00:00Z' }],
          error: null,
        };
      }
      return builder;
    });
    mockSupabase.rpc.mockResolvedValue({
      data: [{
        id: 'reader-b',
        username: 'reader_b',
        full_name: 'Reader B',
        bio: 'Loves classics',
        profile_photo_url: 'https://example.com/avatar.png',
        location_lat: null,
        location_lng: null,
        location_sharing: false,
        last_seen: null,
      }],
      error: null,
    });
  });

  afterEach(() => cleanup());

  it('hydrates mutual friends without joining profiles through direct table RLS', async () => {
    const { result } = renderHook(() => useFriends(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.data?.[0]?.friend_profile?.full_name).toBe('Reader B'));
    expect(mockSupabase.from).toHaveBeenCalledWith('friends');
    expect(builder.select).toHaveBeenCalledWith('id, user1_id, user2_id, created_at');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_profiles_for_social_context', {
      profile_ids: ['reader-b'],
    });
    expect(result.current.data?.[0]?.friend_profile?.profile_photo_url).toBe('https://example.com/avatar.png');
    expect(result.current.data?.[0]?.friend_profile?.location_lat).toBeNull();
  });

  it('hydrates pending friend requests with basic profile details', async () => {
    const { result } = renderHook(() => useFriendRequests(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.data?.[0]?.requester_profile?.username).toBe('reader_b'));
    expect(mockSupabase.from).toHaveBeenCalledWith('friend_requests');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_profiles_for_social_context', {
      profile_ids: ['reader-b', 'reader-a'],
    });
  });

  it('returns an empty profile list without calling the RPC for empty relationships', async () => {
    tableResult = { data: [], error: null };
    mockSupabase.from.mockImplementation(() => {
      tableResult = { data: [], error: null };
      return builder;
    });
    const { result } = renderHook(() => useFriends(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});
