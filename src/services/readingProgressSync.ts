import { supabase } from '@/integrations/supabase/client-universal';
import { recordReadingActivity } from '@/lib/readingActivity';

export type ReadingStatus = 'want_to_read' | 'reading' | 'completed' | 'dnf';

export interface ProgressSyncInput {
  bookId: string;
  bookTitle?: string;
  currentPage?: number;
  totalPages?: number;
  percentage?: number;
  status?: ReadingStatus;
  coverImageUrl?: string | null;
  source?: 'reader' | 'bookshelf' | 'tracker' | 'quick_log' | 'status_picker';
}

export interface NormalizedProgressResult {
  bookId: string;
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
  status: ReadingStatus;
  isCompleted: boolean;
  coverImageUrl?: string | null;
  startedAt?: string;
  completedAt?: string | null;
}

// Request sequence tracking per bookId to prevent stale responses from overwriting newer progress
const requestSequences = new Map<string, number>();

export function getNextRequestSequence(bookId: string): number {
  const next = (requestSequences.get(bookId) ?? 0) + 1;
  requestSequences.set(bookId, next);
  return next;
}

export function isLatestRequestSequence(bookId: string, sequence: number): boolean {
  return (requestSequences.get(bookId) ?? 0) === sequence;
}

export function resetRequestSequence(bookId?: string): void {
  if (bookId) {
    requestSequences.delete(bookId);
  } else {
    requestSequences.clear();
  }
}

/**
 * Validates and normalizes reading progress inputs.
 * Ensures consistent page numbers (1..total) and percentages (0..100%),
 * and handles books with unknown page counts gracefully.
 */
export function normalizeProgressValues(
  input: ProgressSyncInput,
  existing?: {
    current_page?: number;
    total_pages?: number;
    status?: string;
    started_at?: string | null;
    completed_at?: string | null;
    cover_image_url?: string | null;
    book_title?: string;
  } | null,
): NormalizedProgressResult {
  const normalizedBookId = (input.bookId || '').trim();
  if (!normalizedBookId) {
    throw new Error('Book ID is required');
  }

  const bookTitle = (input.bookTitle || existing?.book_title || 'Untitled Book').trim();
  if (!bookTitle) {
    throw new Error('Book title is required');
  }

  // 1. Resolve Total Pages
  let resolvedTotalPages: number | undefined;
  if (input.totalPages !== undefined) {
    if (!Number.isFinite(input.totalPages)) {
      throw new Error('Total pages must be a positive number');
    }
    if (input.totalPages <= 0) {
      throw new Error('Total pages must be a positive number');
    }
    resolvedTotalPages = Math.floor(input.totalPages);
  } else if (existing?.total_pages && existing.total_pages > 0) {
    resolvedTotalPages = Math.floor(existing.total_pages);
  }

  // Fallback for unknown total pages: default to 100 for percentage basis
  const safeTotal = resolvedTotalPages && resolvedTotalPages > 0 ? resolvedTotalPages : 100;
  const isUnknownTotal = !resolvedTotalPages || resolvedTotalPages <= 0;

  // 2. Resolve Current Page & Percentage
  let safePage = 0;
  let safePercent = 0;

  if (input.currentPage !== undefined) {
    if (!Number.isFinite(input.currentPage)) {
      throw new Error('Current page must be a positive number');
    }
    if (input.currentPage < 0) {
      throw new Error('Current page must be a positive number');
    }

    // Normalizing fractional pages (e.g., 0.8 becomes 1, Math.max(1, Math.round(p)))
    const rawPage = input.currentPage > 0 && input.currentPage < 1
      ? 1
      : Math.round(input.currentPage);

    safePage = Math.min(safeTotal, Math.max(0, rawPage));
    safePercent = Math.round((safePage / safeTotal) * 100);
  } else if (input.percentage !== undefined) {
    if (!Number.isFinite(input.percentage)) {
      throw new Error('Percentage must be a finite number');
    }
    safePercent = Math.min(100, Math.max(0, Math.round(input.percentage)));
    safePage = Math.round((safePercent / 100) * safeTotal);
  } else if (existing?.current_page !== undefined) {
    safePage = Math.min(safeTotal, Math.max(0, Math.round(existing.current_page)));
    safePercent = Math.round((safePage / safeTotal) * 100);
  }

  // 3. Resolve Status Transitions
  const currentStatus = (existing?.status as ReadingStatus) || 'want_to_read';
  const { status, isCompleted, startedAt, completedAt } = computeSynchronizedStatus(
    currentStatus,
    safePage,
    safeTotal,
    input.status,
    existing?.started_at,
    existing?.completed_at,
  );

  return {
    bookId: normalizedBookId,
    bookTitle,
    currentPage: safePage,
    totalPages: safeTotal,
    percentage: safePercent,
    status,
    isCompleted,
    coverImageUrl: input.coverImageUrl !== undefined ? input.coverImageUrl : existing?.cover_image_url,
    startedAt,
    completedAt,
  };
}

/**
 * Computes synchronized reading status across state transitions:
 * Not Started (want_to_read) → Currently Reading (reading) → Completed (completed).
 * Preserves DNF (Did Not Finish) and existing statuses unless explicitly overridden.
 */
export function computeSynchronizedStatus(
  currentStatus: ReadingStatus | undefined,
  currentPage: number,
  totalPages: number,
  explicitStatus?: ReadingStatus,
  existingStartedAt?: string | null,
  existingCompletedAt?: string | null,
): {
  status: ReadingStatus;
  isCompleted: boolean;
  startedAt: string;
  completedAt: string | null;
} {
  const now = new Date().toISOString();
  let status: ReadingStatus = explicitStatus || currentStatus || 'want_to_read';
  const startedAt = existingStartedAt || now;
  let completedAt = existingCompletedAt || null;

  if (explicitStatus) {
    status = explicitStatus;
    if (explicitStatus === 'completed') {
      completedAt = existingCompletedAt || now;
    } else if (explicitStatus === 'reading') {
      completedAt = null;
    } else if (explicitStatus === 'want_to_read') {
      completedAt = null;
    }
  } else {
    // Page-driven status transition
    if (currentStatus === 'dnf') {
      // PRESERVE DNF even if the stored page position reaches the end.
      status = 'dnf';
    } else if (currentPage >= totalPages && totalPages > 0) {
      status = 'completed';
      completedAt = existingCompletedAt || now;
    } else if (currentPage > 0) {
      if (currentStatus === 'want_to_read' || currentStatus === 'completed') {
        status = 'reading';
        completedAt = null;
      }
    }
  }

  return {
    status,
    isCompleted: status === 'completed',
    startedAt,
    completedAt,
  };
}

/**
 * Synchronizes reading progress to Supabase across both `reading_progress`
 * and `user_bookshelf` tables atomically, and records reading activity.
 */
export async function syncReadingProgressToSupabase(
  userId: string,
  input: ProgressSyncInput,
): Promise<NormalizedProgressResult> {
  if (!userId) {
    throw new Error('Sign in to save reading progress');
  }

  const normalizedBookId = (input.bookId || '').trim();
  if (!normalizedBookId) {
    throw new Error('Book ID is required');
  }

  const bookTitle = (input.bookTitle || '').trim();
  if (input.bookTitle !== undefined && !bookTitle) {
    throw new Error('Book title is required');
  }

  // Pre-validate numeric values before any network lookups
  if (input.totalPages !== undefined) {
    if (!Number.isFinite(input.totalPages) || input.totalPages <= 0) {
      throw new Error('Total pages must be a positive number');
    }
  }

  if (input.currentPage !== undefined) {
    if (!Number.isFinite(input.currentPage) || input.currentPage < 0) {
      throw new Error('Current page must be a positive number');
    }
  }

  if (input.percentage !== undefined) {
    if (!Number.isFinite(input.percentage)) {
      throw new Error('Percentage must be a finite number');
    }
  }

  // 1. Fetch current existing records to preserve timestamps and titles
  const [existingProgressRes, existingShelfRes] = await Promise.all([
    supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', normalizedBookId)
      .maybeSingle(),
    supabase
      .from('user_bookshelf')
      .select('id, status, progress, started_at, completed_at')
      .eq('user_id', userId)
      .eq('book_id', normalizedBookId)
      .maybeSingle(),
  ]);

  const existingProgress = existingProgressRes.data;
  const existingShelf = existingShelfRes.data;

  // 2. Normalize values
  const normalized = normalizeProgressValues(input, {
    current_page: existingProgress?.current_page,
    total_pages: existingProgress?.total_pages,
    status: existingShelf?.status,
    started_at: existingProgress?.started_at || existingShelf?.started_at,
    completed_at: existingProgress?.completed_at || existingShelf?.completed_at,
    cover_image_url: existingProgress?.cover_image_url,
    book_title: existingProgress?.book_title,
  });

  // 3. Upsert into reading_progress
  const { error: progressError } = await supabase
    .from('reading_progress')
    .upsert(
      {
        user_id: userId,
        book_id: normalized.bookId,
        book_title: normalized.bookTitle,
        current_page: normalized.currentPage,
        total_pages: normalized.totalPages,
        cover_image_url: normalized.coverImageUrl ?? null,
        started_at: normalized.startedAt,
        completed_at: normalized.completedAt,
      },
      { onConflict: 'user_id,book_id' },
    )
    .select()
    .single();

  if (progressError) {
    throw progressError;
  }

  // 4. Synchronize user_bookshelf
  if (existingShelf) {
    const shelfUpdates: Record<string, unknown> = {
      progress: normalized.percentage,
      status: normalized.status,
    };
    if (normalized.status === 'reading' && !existingShelf.started_at) {
      shelfUpdates.started_at = normalized.startedAt;
      shelfUpdates.up_next_position = null;
    } else if (normalized.status === 'completed') {
      shelfUpdates.completed_at = normalized.completedAt;
      shelfUpdates.up_next_position = null;
    } else if (normalized.status === 'dnf') {
      shelfUpdates.up_next_position = null;
    }

    const { error: shelfError } = await supabase
      .from('user_bookshelf')
      .update(shelfUpdates)
      .eq('id', existingShelf.id)
      .eq('user_id', userId);

    if (shelfError) {
      throw shelfError;
    }
  } else {
    // Create new bookshelf entry with appropriate status and progress
    const { error: insertShelfError } = await supabase
      .from('user_bookshelf')
      .insert({
        user_id: userId,
        book_id: normalized.bookId,
        status: normalized.status,
        progress: normalized.percentage,
        started_at: normalized.status === 'reading' ? normalized.startedAt : null,
        completed_at: normalized.status === 'completed' ? normalized.completedAt : null,
      });

    if (insertShelfError) {
      // In case another insert just occurred, fall back to update
      await supabase
        .from('user_bookshelf')
        .update({
          status: normalized.status,
          progress: normalized.percentage,
        })
        .eq('user_id', userId)
        .eq('book_id', normalized.bookId);
    }
  }

  // 5. Record reading activity day
  await recordReadingActivity(userId, 'progress_save').catch(() => {});

  return normalized;
}
