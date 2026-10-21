import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Logs rejected background operations so they never become unhandled promises. */
export function reportBackgroundAsyncError(error: unknown): void {
  console.error('Background query operation failed:', error);
}

/** Invalidates one query without leaking an unhandled rejection into the UI. */
export function invalidateQueriesSafely(
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
  queryKey: QueryKey,
): void {
  void queryClient.invalidateQueries({ queryKey }).catch(reportBackgroundAsyncError);
}
