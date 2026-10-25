import { afterEach, describe, expect, it, vi } from 'vitest';
import { reducer } from '@/hooks/use-toast';

const toast = (id: string, title: string) => ({
  id,
  title,
  open: true,
  onOpenChange: vi.fn(),
});

const initial = { toasts: [] as ReturnType<typeof toast>[] };

describe('toast reducer', () => {
  afterEach(() => vi.useRealTimers());

  it('adds a toast to the beginning and enforces the single-toast limit', () => {
    const first = reducer(initial, { type: 'ADD_TOAST', toast: toast('1', 'First') });
    expect(first.toasts).toHaveLength(1);
    expect(first.toasts[0].title).toBe('First');

    const second = reducer(first, { type: 'ADD_TOAST', toast: toast('2', 'Second') });
    expect(second.toasts).toHaveLength(1);
    expect(second.toasts[0].id).toBe('2');
  });

  it('updates only the toast matching the supplied id', () => {
    const state = { toasts: [toast('1', 'Before'), toast('2', 'Unchanged')] };
    const next = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'After' } });
    expect(next.toasts[0].title).toBe('After');
    expect(next.toasts[1].title).toBe('Unchanged');
  });

  it('dismisses a specific toast without dismissing other toasts', () => {
    vi.useFakeTimers();
    const state = { toasts: [toast('1', 'First'), toast('2', 'Second')] };
    const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(next.toasts[0].open).toBe(false);
    expect(next.toasts[1].open).toBe(true);
  });

  it('dismisses every toast when no id is supplied', () => {
    vi.useFakeTimers();
    const state = { toasts: [toast('1', 'First'), toast('2', 'Second')] };
    const next = reducer(state, { type: 'DISMISS_TOAST' });
    expect(next.toasts.every((item) => item.open === false)).toBe(true);
  });

  it('removes one toast by id and clears all when no id is supplied', () => {
    const state = { toasts: [toast('1', 'First'), toast('2', 'Second')] };
    expect(reducer(state, { type: 'REMOVE_TOAST', toastId: '1' }).toasts.map((item) => item.id)).toEqual(['2']);
    expect(reducer(state, { type: 'REMOVE_TOAST' }).toasts).toEqual([]);
  });
});
