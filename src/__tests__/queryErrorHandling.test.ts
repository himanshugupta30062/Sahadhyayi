import type { QueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { invalidateQueriesSafely } from '@/lib/queryErrorHandling';

describe('invalidateQueriesSafely', () => {
  it('invalidates the requested query key', () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const client = { invalidateQueries } as unknown as Pick<QueryClient, 'invalidateQueries'>;

    invalidateQueriesSafely(client, ['social-posts']);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['social-posts'] });
  });

  it('reports a rejected background invalidation without leaking a rejection', async () => {
    const failure = new Error('cache refresh failed');
    const invalidateQueries = vi.fn().mockRejectedValue(failure);
    const client = { invalidateQueries } as unknown as Pick<QueryClient, 'invalidateQueries'>;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    invalidateQueriesSafely(client, ['comments']);

    try {
      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith('Background query operation failed:', failure);
      });
    } finally {
      errorSpy.mockRestore();
    }
  });
});
