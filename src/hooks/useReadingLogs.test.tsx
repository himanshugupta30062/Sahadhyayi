// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({ user: { id: 'reader-1' } as null | { id: string }, insert: vi.fn(), select: vi.fn(), single: vi.fn(), from: vi.fn() }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client-universal', () => ({ supabase: { from: (...args: unknown[]) => mocks.from(...args) } }));
import { useCreateReadingLog } from './useReadingLogs';

const setup = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(() => useCreateReadingLog(), { wrapper });
};

describe('useCreateReadingLog', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.single.mockReset().mockResolvedValue({ data: { id: 'log-1' }, error: null });
    mocks.select.mockReset().mockReturnValue({ single: mocks.single });
    mocks.insert.mockReset().mockReturnValue({ select: mocks.select });
    mocks.from.mockReset().mockReturnValue({ insert: mocks.insert });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('writes validated activity and a trimmed private journal note under the current user', async () => {
    const { result } = setup();
    await act(async () => result.current.mutateAsync({ bookId: ' book-1 ', pagesRead: 12, currentPage: 42, totalPages: 300, minutesRead: 20, percentage: 14, journalNote: '  Quiet morning reading  ' }));
    expect(mocks.from).toHaveBeenCalledWith('reading_logs');
    expect(mocks.insert).toHaveBeenCalledWith({ user_id: 'reader-1', book_id: 'book-1', pages_read: 12, current_page: 42, total_pages: 300, minutes_read: 20, percentage: 14, journal_note: 'Quiet morning reading' });
  });

  it('rejects empty activity and invalid progress before database writes', async () => {
    const { result } = setup();
    await expect(result.current.mutateAsync({ bookId: 'book-1' })).rejects.toThrow('Add pages');
    await expect(result.current.mutateAsync({ bookId: 'book-1', minutesRead: 0 })).rejects.toThrow('positive whole number');
    await expect(result.current.mutateAsync({ bookId: 'book-1', percentage: 101, pagesRead: 2 })).rejects.toThrow('between 0 and 100');
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    mocks.user = null;
    const { result } = setup();
    await expect(result.current.mutateAsync({ bookId: 'book-1', pagesRead: 1 })).rejects.toThrow('Sign in');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
