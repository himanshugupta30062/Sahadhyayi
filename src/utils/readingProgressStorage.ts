/**
 * Unified Reading Progress Storage.
 *
 * Every record is scoped to a user (or the guest scope). Older unscoped keys
 * cannot be safely attributed to an account, so they are discarded rather
 * than restored into whichever account happens to open the book next.
 */

export interface ReadingProgressRecord {
  bookId: string;
  userId?: string | null;
  currentPage: number;
  totalPages: number;
  position?: string | null;
  bookmarks?: string[];
  updatedAt: number;
}

export const getProgressStorageKey = (bookId: string, userId?: string | null): string => {
  if (userId) {
    return `sahadhyayi_progress_${userId}_${bookId}`;
  }
  return `sahadhyayi_progress_guest_${bookId}`;
};

const removeLegacyProgress = (bookId: string): void => {
  try {
    localStorage.removeItem(`book-${bookId}-page`);
    localStorage.removeItem(`book-${bookId}-position`);
    localStorage.removeItem(`book-${bookId}-bookmarks`);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
};

export const loadProgressLocally = (
  bookId: string,
  userId?: string | null
): ReadingProgressRecord | null => {
  try {
    const key = getProgressStorageKey(bookId, userId);
    const raw = localStorage.getItem(key);

    // Legacy keys were shared across all browser users and have no trustworthy
    // owner. Never migrate them into a signed-in or guest session.
    removeLegacyProgress(bookId);

    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as ReadingProgressRecord;
      if (
        parsed &&
        parsed.bookId === bookId &&
        (parsed.userId ?? null) === (userId ?? null) &&
        Number.isFinite(parsed.currentPage) &&
        parsed.currentPage > 0
      ) {
        return parsed;
      }
    } catch {
      // Ignore corrupted scoped data and let the cloud source restore progress.
    }
  } catch (err) {
    console.error('Failed to load local reading progress:', err);
  }
  return null;
};

export const saveProgressLocally = (
  params: {
    bookId: string;
    currentPage: number;
    totalPages?: number;
    position?: string | null;
    bookmarks?: string[];
  },
  userId?: string | null
): void => {
  try {
    const key = getProgressStorageKey(params.bookId, userId);
    const existing = loadProgressLocally(params.bookId, userId);

    const record: ReadingProgressRecord = {
      bookId: params.bookId,
      userId: userId || null,
      currentPage: Math.max(1, params.currentPage),
      totalPages: Math.max(1, params.totalPages || existing?.totalPages || 1),
      position: params.position !== undefined ? params.position : existing?.position || null,
      bookmarks: params.bookmarks !== undefined ? params.bookmarks : existing?.bookmarks || [],
      updatedAt: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(record));
    // Do not mirror records to legacy unscoped keys: doing so would leak
    // reading positions and bookmarks when accounts switch on one device.
    removeLegacyProgress(params.bookId);
  } catch (err) {
    console.error('Failed to save local reading progress:', err);
  }
};
