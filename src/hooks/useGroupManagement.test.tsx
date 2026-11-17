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
  in: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  resultByTable: {} as Record<string, any>,
  groupListResult: { data: [{ id: 'g1', name: 'Readers', visibility: 'public', is_encrypted: false }], error: null } as any,
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
        in: (...args: unknown[]) => { mocks.in(table, ...args); return query; },
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
    mocks.in.mockReset();
    mocks.single.mockReset().mockReturnValue({ data: { id: 'member-1' }, error: null });
    mocks.maybeSingle.mockReset().mockReturnValue({ data: { name: 'Ordinary Group' }, error: null });
    mocks.resultByTable = {};
    mocks.groupListResult = { data: [{ id: 'g1', name: 'Readers', visibility: 'public', is_encrypted: false }], error: null };
    mocks.countResult = { data: [{ group_id: 'g1', member_count: 4 }], error: null };
    mocks.rpc.mockReset().mockResolvedValue(mocks.countResult);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads authenticated public groups using aggregate member counts', async () => {
    renderHook(() => useGroups());
    expect(mocks.queryOptions.queryKey).toEqual(['all-groups', 'reader-1']);

    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([
      {
        ...mocks.groupListResult.data[0],
        member_count: 4,
        group_members: [{ count: 4 }],
      },
    ]);

    expect(mocks.select).toHaveBeenCalledWith('group_chats', '*');
    expect(mocks.order).toHaveBeenCalledWith('group_chats', 'created_at', { ascending: false });
    expect(mocks.rpc).toHaveBeenCalledWith('get_public_group_member_counts');
    expect(mocks.from).not.toHaveBeenCalledWith('group_chat_members');
  });

  it('allows anonymous readers to browse public groups without selecting membership rows', async () => {
    mocks.user = null;
    renderHook(() => useGroups());
    expect(mocks.queryOptions.enabled).toBe(true);

    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([
      {
        ...mocks.groupListResult.data[0],
        member_count: 4,
        group_members: [{ count: 4 }],
      },
    ]);

    expect(mocks.rpc).toHaveBeenCalledWith('get_public_group_member_counts');
    expect(mocks.from).not.toHaveBeenCalledWith('group_chat_members');
  });

  it('counts active members for private and encrypted groups only for signed-in readers', async () => {
    mocks.groupListResult = {
      data: [
        { id: 'public-1', name: 'Public Circle', visibility: 'public', is_encrypted: false },
        { id: 'private-1', name: 'Private Circle', visibility: 'private', is_encrypted: false },
        { id: 'encrypted-1', name: 'Encrypted Circle', visibility: 'public', is_encrypted: true },
      ],
      error: null,
    };
    mocks.resultByTable.group_chat_members = {
      data: [{ group_id: 'private-1' }, { group_id: 'private-1' }, { group_id: 'encrypted-1' }],
      error: null,
    };
    renderHook(() => useGroups());

    const groups = await mocks.queryOptions.queryFn();

    expect(groups.map((group: any) => [group.id, group.member_count])).toEqual([
      ['public-1', 4],
      ['private-1', 2],
      ['encrypted-1', 1],
    ]);
    expect(mocks.in).toHaveBeenCalledWith('group_chat_members', 'group_id', ['private-1', 'encrypted-1']);
    expect(mocks.eq).toHaveBeenCalledWith('group_chat_members', 'status', 'active');
  });

  it('keeps the public directory visible when optional member counts fail', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Count service unavailable' },
    });
    renderHook(() => useGroups());

    await expect(mocks.queryOptions.queryFn()).resolves.toEqual([
      {
        ...mocks.groupListResult.data[0],
        member_count: 0,
        group_members: [{ count: 0 }],
      },
    ]);
  });

  it('creates a trimmed private group through the atomic lifecycle RPC', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: 'group-123', error: null });
    renderHook(() => useCreateGroup());
    const result = await mocks.mutationOptions.mutationFn({
      name: '  Book Club  ',
      description: '  Weekly reading  ',
      isPrivate: true,
    });

    expect(result).toBe('group-123');
    expect(mocks.rpc).toHaveBeenCalledWith('create_reading_group', {
      p_name: 'Book Club',
      p_description: 'Weekly reading',
      p_visibility: 'private',
      p_join_policy: 'invite_only',
      p_category: null,
      p_language_code: null,
      p_rules: null,
    });
    expect(mocks.from).not.toHaveBeenCalledWith('group_chats');
    expect(mocks.from).not.toHaveBeenCalledWith('group_chat_members');
  });

  it('validates group names and rejects server-side authorization errors', async () => {
    renderHook(() => useCreateGroup());
    await expect(mocks.mutationOptions.mutationFn({ name: '   ' })).rejects.toThrow('Group name is required');
    expect(mocks.rpc).not.toHaveBeenCalled();

    mocks.user = null;
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Not authenticated' } });
    await expect(mocks.mutationOptions.mutationFn({ name: 'Readers' })).rejects.toThrow('Not authenticated');
    expect(mocks.rpc).toHaveBeenCalledWith('create_reading_group', expect.objectContaining({
      p_name: 'Readers',
    }));
  });

  it('surfaces atomic group-creation failures without partial client-side writes', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Creator membership could not be created' } });
    renderHook(() => useCreateGroup());

    await expect(mocks.mutationOptions.mutationFn({ name: 'Readers' })).rejects.toThrow(
      'Creator membership could not be created',
    );
    expect(mocks.rpc).toHaveBeenCalledWith('create_reading_group', expect.objectContaining({
      p_name: 'Readers',
    }));
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it('joins a group through the membership RPC and invalidates caches on success', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: 'active', error: null });
    renderHook(() => useJoinGroup());

    await expect(mocks.mutationOptions.mutationFn('group-1')).resolves.toBe('active');
    mocks.mutationOptions.onSuccess('active');

    expect(mocks.rpc).toHaveBeenCalledWith('request_or_join_reading_group', { p_group_id: 'group-1' });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Successfully joined the group!');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['all-groups'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user-joined-groups'] });
  });

  it('surfaces unauthenticated joins and protected default-group leave errors from the database', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'User not authenticated' } });
    renderHook(() => useJoinGroup());
    await expect(mocks.mutationOptions.mutationFn('group-1')).rejects.toThrow('User not authenticated');
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'request_or_join_reading_group', { p_group_id: 'group-1' });

    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'You cannot leave the Sahadhyayi Community Reading Circle.' },
    });
    renderHook(() => useLeaveGroup());
    await expect(mocks.mutationOptions.mutationFn('default-group')).rejects.toThrow(
      'You cannot leave the Sahadhyayi Community Reading Circle.',
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'leave_reading_group', { p_group_id: 'default-group' });
  });

  it('leaves a group through the lifecycle RPC and reports mutation errors', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
    renderHook(() => useLeaveGroup());
    await expect(mocks.mutationOptions.mutationFn('group-1')).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith('leave_reading_group', { p_group_id: 'group-1' });
    expect(mocks.delete).not.toHaveBeenCalled();
    mocks.mutationOptions.onSuccess();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Successfully left the group');
    mocks.mutationOptions.onError(new Error('network issue'));
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to leave group: network issue');
  });

  it('adds a member and invalidates that group member query', async () => {
    renderHook(() => useAddGroupMember());
    await expect(mocks.mutationOptions.mutationFn({ groupId: 'group-2', userId: 'reader-2' })).resolves.toEqual({ id: 'member-1' });
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
