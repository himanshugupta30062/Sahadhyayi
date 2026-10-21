/** @vitest-environment jsdom */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSupabase, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockSupabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({ supabase: mockSupabase }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: { id: 'reader-1' } }) }));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import {
  useAddGroupMember,
  useCreateGroup,
  useDeleteGroup,
  useGroups,
  useJoinGroup,
  useLeaveGroup,
  useUpdateGroup,
} from '@/hooks/useGroupManagement';

const groupRow = {
  id: 'group-1',
  name: 'Test Readers',
  description: null,
  created_by: 'reader-1',
  created_at: '2026-01-01T00:00:00.000Z',
};

function makeQuery(table: string) {
  const response = table === 'group_chats'
    ? { data: [groupRow], error: null }
    : { data: { id: 'member-1', group_id: 'group-1', user_id: 'reader-1' }, error: null };
  const query: any = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    insert: vi.fn(() => query),
    delete: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(response)),
    then: (resolve: (value: typeof response) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject),
  };
  return query;
}

function makeHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined as never);
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, invalidateSpy, wrapper };
}

describe('useGroupManagement Sonar regression coverage', () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'reader-1' } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => makeQuery(table));
    mockSupabase.rpc.mockResolvedValue({
      data: [{ group_id: 'group-1', member_count: 4 }],
      error: null,
    });
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    });
    mockSupabase.removeChannel.mockResolvedValue(undefined);
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('maps aggregate public member counts without embedding membership rows', async () => {
    const { wrapper } = makeHarness();
    const { result } = renderHook(() => useGroups(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSupabase.from).toHaveBeenCalledWith('group_chats');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_public_group_member_counts');
    expect(result.current.data?.[0]).toMatchObject({ id: 'group-1', member_count: 4 });
  });

  it('keeps public discovery available if the aggregate count RPC is unavailable', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'RPC not deployed' },
    });
    const { wrapper } = makeHarness();
    const { result } = renderHook(() => useGroups(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]).toMatchObject({ id: 'group-1' });
    expect(result.current.data?.[0]).not.toHaveProperty('member_count');
  });

  it('runs create, join, leave, add-member, update, and delete success invalidations', async () => {
    const { wrapper, invalidateSpy } = makeHarness();

    const created = renderHook(() => useCreateGroup(), { wrapper });
    await act(async () => {
      await created.result.current.mutateAsync({ name: '  New Readers  ', description: ' notes ', isPrivate: false });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-groups'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['all-groups'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-joined-groups'] });

    const joined = renderHook(() => useJoinGroup(), { wrapper });
    await act(async () => { await joined.result.current.mutateAsync('group-1'); });
    expect(mockToastSuccess).toHaveBeenCalledWith('Successfully joined the group!');

    const left = renderHook(() => useLeaveGroup(), { wrapper });
    await act(async () => { await left.result.current.mutateAsync('group-1'); });
    expect(mockToastSuccess).toHaveBeenCalledWith('Successfully left the group');

    const added = renderHook(() => useAddGroupMember(), { wrapper });
    await act(async () => { await added.result.current.mutateAsync({ groupId: 'group-1', userId: 'reader-2' }); });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['group-members', 'group-1'] });

    const updated = renderHook(() => useUpdateGroup(), { wrapper });
    await act(async () => {
      await updated.result.current.mutateAsync({ groupId: 'group-1', name: ' Updated name ' });
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Group updated');

    const deleted = renderHook(() => useDeleteGroup(), { wrapper });
    await act(async () => { await deleted.result.current.mutateAsync('group-1'); });
    expect(mockToastSuccess).toHaveBeenCalledWith('Group deleted');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['all-groups'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-groups'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-joined-groups'] });
  });
});
