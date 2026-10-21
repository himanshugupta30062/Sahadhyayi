/** @vitest-environment jsdom */

import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mutationOptions, invalidateQueries, toast } = vi.hoisted(() => ({
  mutationOptions: [] as any[],
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: [], isLoading: false, error: null, refetch: vi.fn() })),
  useMutation: vi.fn((options: any) => {
    mutationOptions.push(options);
    return {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      isLoading: false,
      isSuccess: false,
      isError: false,
      reset: vi.fn(),
    };
  }),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'reader-1', email: 'reader@example.com', user_metadata: { full_name: 'Reader' } },
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'reader-1' } }, error: null }) },
  },
}));

vi.mock('@/hooks/use-toast', () => ({ toast }));

import BookIdeasSection from '@/components/books/BookIdeasSection';
import BookReadersConnection from '@/components/books/BookReadersConnection';
import CreateYourVersionSection from '@/components/books/CreateYourVersionSection';

async function invokeAllSuccessCallbacks(): Promise<void> {
  const callbacks = mutationOptions.filter((options) => typeof options.onSuccess === 'function');
  expect(callbacks.length).toBeGreaterThan(0);
  await act(async () => {
    for (const options of callbacks) {
      await options.onSuccess(undefined, {});
    }
  });
}

describe('book-community cache invalidation callbacks', () => {
  beforeEach(() => {
    mutationOptions.length = 0;
    invalidateQueries.mockClear();
    toast.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('invalidates the book-feedback cache after each successful feedback mutation', async () => {
    const bookId = 'book-ideas-1';
    render(<BookIdeasSection bookId={bookId} bookTitle="Test Book" />);

    await invokeAllSuccessCallbacks();

    expect(invalidateQueries).toHaveBeenCalledTimes(4);
    for (const [call] of invalidateQueries.mock.calls) {
      expect(call).toEqual({ queryKey: ['book_feedback', bookId] });
    }
  });

  it('invalidates reader comments after each successful comment mutation', async () => {
    const bookId = 'reader-comments-1';
    render(<BookReadersConnection bookId={bookId} bookTitle="Test Book" />);

    await invokeAllSuccessCallbacks();

    expect(invalidateQueries).toHaveBeenCalledTimes(4);
    for (const [call] of invalidateQueries.mock.calls) {
      expect(call).toEqual({ queryKey: ['book_reader_comments', bookId] });
    }
  });

  it('invalidates personal book versions after every successful version mutation', async () => {
    const bookId = 'versions-book-1';
    render(<CreateYourVersionSection bookId={bookId} bookTitle="Test Book" />);

    await invokeAllSuccessCallbacks();

    expect(invalidateQueries).toHaveBeenCalledTimes(4);
    for (const [call] of invalidateQueries.mock.calls) {
      expect(call).toEqual({ queryKey: ['book_user_versions', bookId, 'reader-1'] });
    }
  });
});
