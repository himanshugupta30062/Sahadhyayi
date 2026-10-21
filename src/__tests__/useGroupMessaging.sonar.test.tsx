/** @vitest-environment jsdom */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSupabase, mockToast, authState } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    auth: { getUser: vi.fn() },
  },
  mockToast: vi.fn(),
  authState: { user: { id: 'reader-1' } as { id: string } | null },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({ supabase: mockSupabase }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: authState.user }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));

import { useGroupMembers, useGroupMessages } from '@/hooks/useGroupMessaging';

function makeQuery(response: { data: unknown[]; error: null }) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    then: (resolve: (value: typeof response) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject),
  };
  return query;
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('group messaging authorization and realtime cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = { id: 'reader-1' };
    mockSupabase.from.mockImplementation(() => makeQuery({ data: [], error: null }));
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    };
    mockSupabase.channel.mockReturnValue(channel);
    mockSupabase.removeChannel.mockResolvedValue(undefined);
  });

  it('does not fetch group membership rows for anonymous visitors', async () => {
    authState.user = null;
    const { result } = renderHook(() => useGroupMembers('group-1'), { wrapper: makeWrapper() });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('fetches members for an authenticated viewer', async () => {
    const { result } = renderHook(() => useGroupMembers('group-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.from).toHaveBeenCalledWith('group_chat_members');
    expect(result.current.data).toEqual([]);
  });

  it('cleans up the realtime channel when group-message subscriptions unmount', async () => {
    const { unmount, result } = renderHook(() => useGroupMessages('group-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const channel = mockSupabase.channel.mock.results[0]?.value;
    expect(channel).toBeDefined();

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
