/**
 * Unified Reading Progress Storage
 * Ensures single progress model keyed by user ID and book ID.
 * Persists locally instantly and falls back cleanly across sessions.
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

export const loadProgressLocally = (
  bookId: string,
  userId?: string | null
): ReadingProgressRecord | null => {
  try {
    const key = getProgressStorageKey(bookId, userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as ReadingProgressRecord;
      if (parsed && typeof parsed.currentPage === 'number') {
        return parsed;
      }
    }

    // Fallback to legacy unkeyed localStorage for backward compatibility
    const legacyPage = localStorage.getItem(`book-${bookId}-page`);
    const legacyPos = localStorage.getItem(`book-${bookId}-position`);
    const legacyBookmarks = localStorage.getItem(`book-${bookId}-bookmarks`);

    if (legacyPage || legacyPos || legacyBookmarks) {
      const page = legacyPage ? parseInt(legacyPage, 10) : 1;
      let bookmarks: string[] = [];
      if (legacyBookmarks) {
        try {
          bookmarks = JSON.parse(legacyBookmarks);
        } catch {
          bookmarks = [];
        }
      }
      return {
        bookId,
        userId: userId || null,
        currentPage: Number.isFinite(page) && page > 0 ? page : 1,
        totalPages: 1,
        position: legacyPos || null,
        bookmarks,
        updatedAt: Date.now(),
      };
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

    // Also update legacy keys to keep older views working
    localStorage.setItem(`book-${params.bookId}-page`, String(record.currentPage));
    if (record.position) {
      localStorage.setItem(`book-${params.bookId}-position`, record.position);
    }
    if (record.bookmarks) {
      localStorage.setItem(`book-${params.bookId}-bookmarks`, JSON.stringify(record.bookmarks));
    }
  } catch (err) {
    console.error('Failed to save local reading progress:', err);
  }
};
