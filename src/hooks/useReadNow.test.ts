import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReadNow } from './useReadNow';

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  mutateAsync: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('@/hooks/useUserBookshelf', () => ({
  useAddToBookshelf: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock('@/hooks/use-toast', () => ({
  toast: mocks.toast,
}));

describe('useReadNow', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.mutateAsync.mockReset();
    mocks.toast.mockReset();
    delete (window as any).checkReadingGoal;
  });

  it('requires authentication and does not mutate the bookshelf', async () => {
    const { result } = renderHook(() => useReadNow());
    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleReadNow('book-1', 'The Book');
    });

    expect(success).toBe(false);
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Authentication Required',
      variant: 'destructive',
    }));
  });

  it('stops when the reading-goal guard rejects the action', async () => {
    mocks.user = { id: 'user-1' };
    (window as any).checkReadingGoal = vi.fn(() => false);
    const { result } = renderHook(() => useReadNow());

    await act(async () => {
      expect(await result.current.handleReadNow('book-1', 'The Book')).toBe(false);
    });
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it('adds the book as currently reading and reports success', async () => {
    mocks.user = { id: 'user-1' };
    (window as any).checkReadingGoal = vi.fn(() => true);
    mocks.mutateAsync.mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useReadNow());

    await act(async () => {
      expect(await result.current.handleReadNow('book-1', 'The Book')).toBe(true);
    });
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ bookId: 'book-1', status: 'reading' });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Success',
      description: 'Added "The Book" to your current reads!',
    }));
  });

  it('converts bookshelf mutation failures into an error toast and false result', async () => {
    mocks.user = { id: 'user-1' };
    mocks.mutateAsync.mockRejectedValue(new Error('Network unavailable'));
    const { result } = renderHook(() => useReadNow());

    await act(async () => {
      expect(await result.current.handleReadNow('book-2', 'Another Book')).toBe(false);
    });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'Network unavailable',
      variant: 'destructive',
    }));
  });

  it('uses a fallback error message for non-Error rejections', async () => {
    mocks.user = { id: 'user-1' };
    mocks.mutateAsync.mockRejectedValue({});
    const { result } = renderHook(() => useReadNow());

    await act(async () => {
      expect(await result.current.handleReadNow('book-3', 'Third Book')).toBe(false);
    });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'Failed to add book to reading list',
    }));
  });
});
