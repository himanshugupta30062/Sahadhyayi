// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; email?: string },
  queryOptions: null as any,
  mutationOptions: null as any,
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  eq: vi.fn(),
  upsert: vi.fn(),
  insert: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  resultByTable: {} as Record<string, any>,
  channelHandlers: [] as Array<{ type: string; filter: any; callback: (payload?: any) => unknown }>,
  channels: [] as any[],
  removeChannel: vi.fn().mockResolvedValue(undefined),
  track: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
  presenceState: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: (options: any) => { mocks.queryOptions = options; return { data: [], isLoading: false }; },
  useMutation: (options: any) => { mocks.mutationOptions = options; return { mutate: vi.fn(), isPending: false }; },
}));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mocks.from(table);
      const query: any = {
        select: (...args: unknown[]) => { mocks.select(table, ...args); return query; },
        order: (...args: unknown[]) => { mocks.order(table, ...args); return query; },
        limit: (...args: unknown[]) => { mocks.limit(table, ...args); return query; },
        eq: (...args: unknown[]) => { mocks.eq(table, ...args); return query; },
        upsert: (...args: unknown[]) => { mocks.upsert(table, ...args); return query; },
        insert: (...args: unknown[]) => { mocks.insert(table, ...args); return query; },
        single: () => Promise.resolve(mocks.single()),
        maybeSingle: () => Promise.resolve(mocks.maybeSingle()),
        then: (resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(mocks.resultByTable[table] || { data: [], error: null }).then(resolve, reject),
      };
      return query;
    },
    channel: (...args: unknown[]) => {
      const channel: any = {
        args,
        on: (type: string, filter: any, callback: (payload?: any) => unknown) => {
          mocks.channelHandlers.push({ type, filter, callback });
          return channel;
        },
        subscribe: (callback?: (status: string) => unknown) => {
          if (callback) void callback('SUBSCRIBED');
          return channel;
        },
        track: (...args: unknown[]) => mocks.track(...args),
        send: (...args: unknown[]) => mocks.send(...args),
        presenceState: () => mocks.presenceState(),
      };
      mocks.channels.push(channel);
      return channel;
    },
    removeChannel: (...args: unknown[]) => mocks.removeChannel(...args),
  },
}));

import { useReadingRooms, useCreateReadingRoom, useReadingRoomLive } from '@/hooks/useReadingRoom';

describe('useReadingRoom', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1', email: 'reader@example.com' };
    mocks.queryOptions = null;
    mocks.mutationOptions = null;
    mocks.invalidateQueries.mockClear();
    mocks.from.mockClear();
    mocks.select.mockClear();
    mocks.order.mockClear();
    mocks.limit.mockClear();
    mocks.eq.mockClear();
    mocks.upsert.mockClear();
    mocks.insert.mockClear();
    mocks.single.mockReset().mockReturnValue({ data: { id: 'room-1', book_id: 'book-1', name: 'Quiet Reading', created_by: 'reader-1' }, error: null });
    mocks.maybeSingle.mockReset().mockReturnValue({ data: { full_name: 'Reader One', profile_photo_url: null }, error: null });
    mocks.resultByTable = {
      reading_rooms: { data: [{ id: 'room-1', book_id: 'book-1', name: 'Quiet Reading', created_by: 'reader-1', created_at: '2026-01-01' }], error: null },
      reading_room_messages: { data: [{ id: 'msg-1', room_id: 'room-1', user_id: 'reader-2', body: 'Hello', created_at: '2026-01-01' }], error: null },
      reading_room_events: { data: [{ id: 'evt-1', room_id: 'room-1', user_id: 'reader-2', kind: 'chapter_complete', chapter: 3, created_at: '2026-01-02T00:00:00Z' }], error: null },
      profiles: { data: { full_name: 'Reader Two', profile_photo_url: null }, error: null },
    };
    mocks.channelHandlers = [];
    mocks.channels = [];
    mocks.removeChannel.mockClear().mockResolvedValue(undefined);
    mocks.track.mockClear().mockResolvedValue(undefined);
    mocks.send.mockClear().mockResolvedValue(undefined);
    mocks.presenceState.mockReset().mockReturnValue({
      reader: [{ user_id: 'reader-1', name: 'Reader', page: 4, share_page: true }],
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads rooms with bounded query options and filters by book when requested', async () => {
    renderHook(() => useReadingRooms('book-1', { refetchInterval: false }));
    expect(mocks.queryOptions.queryKey).toEqual(['reading-rooms', 'book-1']);
    expect(mocks.queryOptions.refetchInterval).toBe(false);
    await expect(mocks.queryOptions.queryFn()).resolves.toEqual(mocks.resultByTable.reading_rooms.data);
    expect(mocks.limit).toHaveBeenCalledWith('reading_rooms', 40);
    expect(mocks.eq).toHaveBeenCalledWith('reading_rooms', 'book_id', 'book-1');
  });

  it('creates a room for the signed-in reader and invalidates the room cache', async () => {
    renderHook(() => useCreateReadingRoom());
    await expect(mocks.mutationOptions.mutationFn({ book_id: 'book-1', name: 'Quiet Reading' })).resolves.toEqual({
      id: 'room-1', book_id: 'book-1', name: 'Quiet Reading', created_by: 'reader-1',
    });
    expect(mocks.upsert).toHaveBeenCalledWith('reading_rooms', {
      book_id: 'book-1', name: 'Quiet Reading', created_by: 'reader-1',
    }, { onConflict: 'book_id' });
    mocks.mutationOptions.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['reading-rooms'] });
  });

  it('requires authentication to create a room and propagates database errors', async () => {
    mocks.user = null;
    renderHook(() => useCreateReadingRoom());
    await expect(mocks.mutationOptions.mutationFn({ book_id: 'book-1', name: 'Room' })).rejects.toThrow('Sign in first.');

    mocks.user = { id: 'reader-1' };
    mocks.single.mockReturnValue({ data: null, error: new Error('database unavailable') });
    const { result } = renderHook(() => useCreateReadingRoom());
    await expect(mocks.mutationOptions.mutationFn({ book_id: 'book-1', name: 'Room' })).rejects.toThrow('database unavailable');
  });

  it('loads recent messages and chapter pulses, tracks presence, and cleans up its channel', async () => {
    const { result, unmount } = renderHook(() => useReadingRoomLive(
      { id: 'room-1', book_id: 'book-1', name: 'Quiet Reading' },
      true,
      4,
    ));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].body).toBe('Hello');
    expect(result.current.pulses).toHaveLength(1);
    expect(result.current.pulses[0].chapter).toBe(3);
    await waitFor(() => expect(mocks.track).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'reader-1', name: 'reader', page: 4, share_page: true,
    })));
    unmount();
    expect(mocks.removeChannel).toHaveBeenCalled();
  });

  it('deduplicates broadcast chat messages and appends chapter-complete pulses', async () => {
    const { result } = renderHook(() => useReadingRoomLive(
      { id: 'room-1', book_id: 'book-1', name: 'Quiet Reading' },
      false,
      9,
    ));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const chat = mocks.channelHandlers.find((handler) => handler.type === 'broadcast' && handler.filter.event === 'room_chat');
    const pulse = mocks.channelHandlers.find((handler) => handler.type === 'broadcast' && handler.filter.event === 'chapter_complete');
    act(() => {
      chat?.callback({ payload: { id: 'msg-2', room_id: 'room-1', user_id: 'reader-3', body: 'New note', created_at: '2026-01-03' } });
      chat?.callback({ payload: { id: 'msg-2', room_id: 'room-1', user_id: 'reader-3', body: 'New note', created_at: '2026-01-03' } });
      pulse?.callback({ payload: { user_id: 'reader-3', user_name: 'Third Reader', chapter: 5 } });
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.pulses.at(-1)).toMatchObject({ user_id: 'reader-3', user_name: 'Third Reader', chapter: 5 });
  });

  it('hydrates profiles for realtime messages and flattens presence state', async () => {
    const { result } = renderHook(() => useReadingRoomLive(
      { id: 'room-1', book_id: 'book-1', name: 'Quiet Reading' },
      true,
      2,
    ));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const messageInsert = mocks.channelHandlers.find((handler) =>
      handler.type === 'postgres_changes' && handler.filter.table === 'reading_room_messages'
    );
    await act(async () => {
      await messageInsert?.callback({ new: { id: 'msg-2', room_id: 'room-1', user_id: 'reader-3', body: 'Realtime', created_at: '2026-01-04' } });
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages[1].profiles).toMatchObject({ full_name: 'Reader Two' });

    const sync = mocks.channelHandlers.find((handler) => handler.type === 'presence');
    act(() => { sync?.callback(); });
    expect(result.current.presence).toEqual([{ user_id: 'reader-1', name: 'Reader', page: 4, share_page: true }]);
  });

  it('sends trimmed messages and emits chapter pulses only for an active room and user', async () => {
    const { result } = renderHook(() => useReadingRoomLive(
      { id: 'room-1', book_id: 'book-1', name: 'Quiet Reading' },
      true,
      3,
    ));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    mocks.single.mockReturnValue({ data: { id: 'msg-new', room_id: 'room-1', user_id: 'reader-1', body: 'hello', created_at: '2026-01-05' }, error: null });
    await act(async () => {
      await result.current.sendMessage('  hello  ');
      await result.current.emitPulse(6);
    });
    expect(mocks.insert).toHaveBeenCalledWith('reading_room_messages', { room_id: 'room-1', user_id: 'reader-1', body: 'hello' });
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ event: 'room_chat' }));
    expect(mocks.insert).toHaveBeenCalledWith('reading_room_events', { room_id: 'room-1', user_id: 'reader-1', kind: 'chapter_complete', chapter: 6 });
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ event: 'chapter_complete' }));
  });

  it('ignores blank messages and does not send room events for guests', async () => {
    const { result, unmount } = renderHook(() => useReadingRoomLive(null, false, null));
    await act(async () => {
      await result.current.sendMessage('  ');
      await result.current.emitPulse(2);
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    unmount();
    mocks.user = null;
    const guest = renderHook(() => useReadingRoomLive({ id: 'room-1', book_id: 'book-1', name: 'Room' }, false, null));
    await act(async () => { await guest.result.current.emitPulse(1); });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
