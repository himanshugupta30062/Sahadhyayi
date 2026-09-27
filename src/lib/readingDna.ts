export interface ReadingDna {
  user_id: string;
  genres: Array<{ name: string; weight: number }>;
  moods: string[];
  pace: string | null;
  themes: string[];
  summary: string | null;
  signature_color: string | null;
  generated_at: string;
}

export interface ShelfBookItem {
  book_id?: string;
  id?: string;
  status?: string;
  rating?: number | null;
  books_library?: {
    id?: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
    genre: string | null;
  } | null;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Weighted Jaccard similarity over genres
 */
export const genreOverlap = (a: ReadingDna, b: ReadingDna): number => {
  const am = new Map(a.genres.map((g) => [norm(g.name), g.weight]));
  const bm = new Map(b.genres.map((g) => [norm(g.name), g.weight]));
  let inter = 0;
  let union = 0;
  const keys = new Set([...am.keys(), ...bm.keys()]);
  keys.forEach((k) => {
    const av = am.get(k) ?? 0;
    const bv = bm.get(k) ?? 0;
    inter += Math.min(av, bv);
    union += Math.max(av, bv);
  });
  return union === 0 ? 0 : inter / union;
};

/**
 * Cosine similarity over mood / theme string vectors
 */
export const cosineSimilarity = (a: string[], b: string[]): number => {
  if (!a.length || !b.length) return 0;
  const allTerms = Array.from(new Set([...a.map(norm), ...b.map(norm)]));
  const vecA = allTerms.map((t) => (a.map(norm).includes(t) ? 1 : 0));
  const vecB = allTerms.map((t) => (b.map(norm).includes(t) ? 1 : 0));

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < allTerms.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
};

/**
 * Match % computed client-side from two DNA rows:
 * weighted Jaccard over genres (45%) + cosine over mood vectors (25%) + themes (20%) + pace alignment (10%)
 */
export const matchScore = (a: ReadingDna | null, b: ReadingDna | null): number => {
  if (!a || !b) return 0;
  const g = genreOverlap(a, b);
  const m = cosineSimilarity(a.moods, b.moods);
  const t = cosineSimilarity(a.themes, b.themes);
  const p = norm(a.pace ?? "") && norm(a.pace ?? "") === norm(b.pace ?? "") ? 1 : 0;

  // Normalized weights
  const raw = g * 0.45 + m * 0.25 + t * 0.2 + p * 0.1;
  return Math.min(100, Math.max(0, Math.round(raw * 100)));
};

/**
 * Cross-recommendations: books on one shelf and not the other,
 * filtered/ranked by top-genre overlap with the viewing user's DNA.
 */
export const getCrossRecommendations = (
  myShelf: ShelfBookItem[],
  friendShelf: ShelfBookItem[],
  myDna: ReadingDna | null,
  limit = 5
): ShelfBookItem[] => {
  const myBookIds = new Set(
    myShelf.map((b) => b.book_id || b.id || b.books_library?.id).filter(Boolean)
  );

  // Books only on friend's shelf
  const unreadByMe = friendShelf.filter((b) => {
    const bId = b.book_id || b.id || b.books_library?.id;
    return bId && !myBookIds.has(bId) && b.books_library?.title;
  });

  if (!myDna || myDna.genres.length === 0) {
    return unreadByMe.slice(0, limit);
  }

  // Rank by user's top genres
  const genreWeights = new Map(myDna.genres.map((g) => [norm(g.name), g.weight]));

  const scored = unreadByMe.map((item) => {
    const bookGenre = norm(item.books_library?.genre || "");
    let score = 0;
    if (bookGenre) {
      genreWeights.forEach((weight, genreName) => {
        if (bookGenre.includes(genreName) || genreName.includes(bookGenre)) {
          score += weight * 10;
        }
      });
    }
    // Boost if friend rated it high
    if (item.rating) {
      score += item.rating;
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
};
