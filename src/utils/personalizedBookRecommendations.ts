export interface RecommendationCandidate {
  id: string;
  title: string;
  author?: string | null;
  genre?: string | null;
  description?: string | null;
}

export interface ReadingPreference {
  book_id: string;
  status: 'want_to_read' | 'reading' | 'completed' | 'dnf';
  rating?: number | null;
  books_library?: { genre?: string | null; author?: string | null } | null;
}

export interface PersonalizedBook extends RecommendationCandidate {
  score: number;
  reason: string;
}

const normalize = (value?: string | null) => value?.trim().toLocaleLowerCase() ?? '';

/** Rank unshelved catalog books using genres/authors from completed or currently-reading books. */
export function rankPersonalizedBooks(
  catalog: RecommendationCandidate[],
  shelf: ReadingPreference[],
  limit = 8,
): PersonalizedBook[] {
  const shelvedIds = new Set(shelf.map((item) => item.book_id));
  const genreWeights = new Map<string, number>();
  const authorWeights = new Map<string, number>();

  shelf.forEach((item) => {
    if (item.status === 'dnf' || item.status === 'want_to_read') return;
    const ratingBoost = item.rating && item.rating >= 4 ? 1.5 : item.rating === 3 ? 1 : 0.5;
    const genre = normalize(item.books_library?.genre);
    const author = normalize(item.books_library?.author);
    if (genre) genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + ratingBoost);
    if (author) authorWeights.set(author, (authorWeights.get(author) ?? 0) + ratingBoost * 1.25;
  });

  return catalog
    .filter((book) => !shelvedIds.has(book.id))
    .map((book) => {
      const genreScore = genreWeights.get(normalize(book.genre)) ?? 0;
      const authorScore = authorWeights.get(normalize(book.author)) ?? 0;
      const score = genreScore + authorScore;
      const reason = authorScore > 0 && genreScore > 0
        ? 'A genre and author you enjoy'
        : authorScore > 0
          ? 'An author you enjoy'
          : genreScore > 0
            ? 'A genre you enjoy'
            : '';
      return { ...book, score, reason };
    })
    .filter((book) => book.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, Math.max(0, limit));
}
