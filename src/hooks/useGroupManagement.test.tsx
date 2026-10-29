// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  authUserResult: { data: { user: { id: 'reader-1' } }, error: null } as any,
  queryOptions: null as any,
  mutationOptions: null as any,
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  resultByTable: {} as Record<string, any>,
  groupListResult: { data: [{ id: 'g1', name: 'Readers' }], error: null } as any,
  countResult: { data: [{ group_id: 'g1', member_count: 4 }], error: null } as any,
  rpc: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: (options: any) => { mocks.queryOptions = options; return { data: [], isLoading: false }; },
  useMutation: (options: any) => { mocks.mutationOptions = options; return { mutate: vi.fn(), isPending: false }; },
}));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve(mocks.authUserResult) },
    from: (table: string) => {
      mocks.from(table);
      const query: any = {
        select: (...args: unknown[]) => { mocks.select(table, ...args); return query; },
        order: (...args: unknown[]) => { mocks.order(table, ...args); return Promise.resolve(mocks.groupListResult); },
        insert: (...args: unknown[]) => { mocks.insert(table, ...args); return query; },
        update: (...args: unknown[]) => { mocks.update(table, ...args); return query; },
        delete: (...args: unknown[]) => { mocks.delete(table, ...args); return query; },
        eq: (...args: unknown[]) => { mocks.eq(table, ...args); return query; },
        single: () => Promise.resolve(mocks.single()),
        maybeSingle: () => Promise.resolve(mocks.maybeSingle()),
        then: (resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(mocks.resultByTable[table] || { data: null, error: null }).then(resolve, reject),
      };
      return query;
    },
    rpc: (...args: unknown[]) => mocks.rpc(...args),
    channel: () => {
      const channel: any = {
        on: () => channel,
        subscribe: () => channel,
      };
      return channel;
    },
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
}));

import {
  DEFAULT_READING_GROUP_NAME,
  useGroups,
  useCreateGroup,
  useJoinGroup,
  useLeaveGroup,
  useAddGroupMember,
  useUpdateGroup,
  useDeleteGroup,
} from '@/hooks/useGroupManagement';

describe('useGroupManagement', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.authUserResult = { data: { user: { id: 'reader-1' } }, error: null };
    mocks.queryOptions = null;
    mocks.mutationOptions = null;
    mocks.invalidateQueries.mockClear();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.from.mockReset();
    mocks.select.mockReset();
    mocks.order.mockReset();
    mocks.insert.mockReset();
    mocks.update.mockReset();
    mocks.delete.mockReset();
    mocks.eq.mockReset();
    mocks.single.mockReset().mockReturnValue({ data: { id: 'member-1' }, error: null });
    mocks.maybeSingle.mockReset().mockReturnValue({ data: { name: 'Ordinary Group' }, error: null });
    mocks.resultByTable = {};
    mocks.groupListResult = { data: [{ id: 'g1', name: 'Readers' }], error: null };
    mocks.countResult = { data: [{ group_id: 'g1', member_count: 4 }], error: null };
    mocks.rpc.mockReset().mockResolvedValue(mocks.countResult);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads authenticated groups and enables realtime invalidation', async () => {
    renderHook(() => useGroups());
    expect(mocks.queryOptions.queryKey).toEqual(['all-groups', 'reader-1']);
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual(mocks.groupListResult.data);
    expect(mocks.select).toHaveBeenCalled();
    expect(mocks.order).toHaveBeenCalledWith('group_chats', 'created_at', { ascending: false });
  });

  it('uses aggregate member counts for anonymous group discovery', async () => {
    mocks.user = null;
    mocks.groupListResult = { data: [{ id: 'g1', name: 'Readers' }, { id: 'g2', name: 'Silent readers' }], error: null };
    renderHook(() => useGroups({ enabled: false }));
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([
      { id: 'g1', name: 'Readers', member_count: 4, group_members: [{ count: 4 }] },
      { id: 'g2', name: 'Silent readers', member_count: 0, group_members: [{ count: 0 }] },
    ]);
    expect(mocks.rpc).toHaveBeenCalledWith('get_public_group_member_counts');
  });

  it('creates a trimmed group and adds the creator as administrator', async () => {
    mocks.resultByTable = {
      group_chats: { data: null, error: null },
      group_chat_members: { data: null, error: null },
    };
    renderHook(() => useCreateGroup());
    const result = await mocks.mutationOptions.mutationFn({ name: '  Book Club  ', description: '  Weekly reading  ', isPrivate: true });
    expect(result).toMatchObject({ name: 'Book Club', description: 'Weekly reading', created_by: 'reader-1', is_encrypted: true });
    expect(mocks.insert).toHaveBeenCalledWith('group_chats', [expect.objectContaining({
      name: 'Book Club', description: 'Weekly reading', created_by: 'reader-1', is_encrypted: true,
    })]);
    expect(mocks.insert).toHaveBeenCalledWith('group_chat_members', [expect.objectContaining({ user_id: 'reader-1', role: 'admin' })]);
  });

  it('validates group names and handles missing authentication', async () => {
    renderHook(() => useCreateGroup());
    await expect(mocks.mutationOptions.mutationFn({ name: '   ' })).rejects.toThrow('Group name is required');
    mocks.authUserResult = { data: { user: null }, error: null };
    await expect(mocks.mutationOptions.mutationFn({ name: 'Readers' })).rejects.toThrow('Please sign in to create a group');
    mocks.authUserResult = { data: { user: null }, error: { message: 'session unavailable' } };
    await expect(mocks.mutationOptions.mutationFn({ name: 'Readers' })).rejects.toThrow('Authentication error: session unavailable');
  });

  it('rolls back a group when creator membership cannot be inserted', async () => {
    mocks.resultByTable = {
      group_chats: { data: null, error: null },
      group_chat_members: { data: null, error: { message: 'membership insert failed' } },
    };
    renderHook(() => useCreateGroup());
    await expect(mocks.mutationOptions.mutationFn({ name: 'Readers' })).rejects.toThrow('Failed to add creator as admin');
    expect(mocks.delete).toHaveBeenCalledWith('group_chats');
    expect(mocks.eq).toHaveBeenCalledWith('group_chats', 'id', expect.any(String));
  });

  it('joins a group and invalidates all membership caches on success', async () => {
    renderHook(() => useJoinGroup());
    await expect(mocks.mutationOptions.mutationFn('group-1')).resolves.toEqual({ id: 'member-1' });
    mocks.mutationOptions.onSuccess();
    expect(mocks.insert).toHaveBeenCalledWith('group_chat_members', [{ group_id: 'group-1', user_id: 'reader-1', role: 'member' }]);
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Successfully joined the group!');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['all-groups'] });
  });

  it('blocks unauthenticated joins and prevents leaving the default community', async () => {
    renderHook(() => useJoinGroup());
    mocks.authUserResult = { data: { user: null }, error: null };
    await expect(mocks.mutationOptions.mutationFn('group-1')).rejects.toThrow('User not authenticated');

    renderHook(() => useLeaveGroup());
    mocks.authUserResult = { data: { user: { id: 'reader-1' } }, error: null };
    mocks.maybeSingle.mockReturnValue({ data: { name: DEFAULT_READING_GROUP_NAME }, error: null });
    await expect(mocks.mutationOptions.mutationFn('default-group')).rejects.toThrow('You cannot leave the Sahadhyayi Community Reading Circle.');
  });

  it('leaves ordinary groups and reports mutation errors', async () => {
    renderHook(() => useLeaveGroup());
    await expect(mocks.mutationOptions.mutationFn('group-1')).resolves.toBeUndefined();
    expect(mocks.delete).toHaveBeenCalledWith('group_chat_members');
    mocks.mutationOptions.onSuccess();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Successfully left the group');
    mocks.mutationOptions.onError(new Error('network issue'));
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to leave group: network issue');
  });

  it('adds a member and invalidates that group member query', async () => {
    renderHook(() => useAddGroupMember());
    await expect(mocks.mutationOptions.mutationFn({ groupId: 'group-2', userId: 'reader-2' })).resolves.toEqual({ data: { id: 'member-1' }, error: null });
    mocks.mutationOptions.onSuccess(undefined, { groupId: 'group-2', userId: 'reader-2' });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['group-members', 'group-2'] });
  });

  it('updates group fields safely and treats empty updates as a no-op', async () => {
    renderHook(() => useUpdateGroup());
    await mocks.mutationOptions.mutationFn({ groupId: 'group-1', name: '  Updated name ', description: '  ' });
    expect(mocks.update).toHaveBeenCalledWith('group_chats', { name: 'Updated name', description: null });
    const before = mocks.update.mock.calls.length;
    await expect(mocks.mutationOptions.mutationFn({ groupId: 'group-1' })).resolves.toBeUndefined();
    expect(mocks.update).toHaveBeenCalledTimes(before);
    await expect(mocks.mutationOptions.mutationFn({ groupId: 'group-1', name: '  ' })).rejects.toThrow('Group name is required');
  });

  it('deletes a group and reports errors from delete/update operations', async () => {
    renderHook(() => useDeleteGroup());
    await expect(mocks.mutationOptions.mutationFn('group-1')).resolves.toBeUndefined();
    mocks.mutationOptions.onSuccess();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Group deleted');
    mocks.mutationOptions.onError(new Error('permission denied'));
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to delete group: permission denied');
  });
});
