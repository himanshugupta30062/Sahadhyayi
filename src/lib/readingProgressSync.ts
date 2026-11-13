export type ShelfReadingStatus = 'want_to_read' | 'reading' | 'completed' | 'dnf' | string;

export interface SyncedReadingState {
  percentage: number;
  status: ShelfReadingStatus;
}

/** Derive bookshelf percentage/status from canonical page progress. */
export function deriveSyncedReadingState(
  currentPage: number,
  totalPages: number,
  currentStatus: ShelfReadingStatus,
): SyncedReadingState {
  if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages) || totalPages <= 0) {
    throw new Error('Reading progress requires finite pages and a positive page count');
  }
  const page = Math.min(totalPages, Math.max(0, currentPage));
  const percentage = Math.round((page / totalPages) * 100);
  const status = currentStatus === 'dnf'
    ? 'dnf'
    : page >= totalPages
      ? 'completed'
      : currentStatus === 'want_to_read' || currentStatus === 'completed'
        ? 'reading'
        : currentStatus;
  return { percentage, status };
}
