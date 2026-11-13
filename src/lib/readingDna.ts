export interface ReadingDna {
  user_id: string;
  genres: Array<{ name: string; weight: number }>;
  moods: string[];
  pace: string | null;
  themes: string[];
  summary: string | null;
  signature_color: string | null;
  generated_at: string;
  visibility?: "public" | "friends" | "private";
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
  const magnitude = Math.sqrt(magA * magB);
  if (magnitude === 0) return 0;
  return Math.min(1, Math.max(0, dotProduct / magnitude));
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

export interface CompatibilityBreakdown {
  score: number;
  confidence: "high" | "moderate" | "emerging";
  sharedGenres: string[];
  sharedMoods: string[];
  sharedThemes: string[];
  paceMatch: boolean;
  overlappingBooks: Array<{
    id?: string;
    title: string;
    author?: string | null;
    myRating?: number | null;
    theirRating?: number | null;
  }>;
  narrativeExplanation: string;
  differencesInTaste: string[];
}

export const getCompatibilityBreakdown = (
  myDna: ReadingDna | null,
  theirDna: ReadingDna | null,
  myShelf: ShelfBookItem[] = [],
  theirShelf: ShelfBookItem[] = []
): CompatibilityBreakdown => {
  const score = matchScore(myDna, theirDna);

  if (!myDna || !theirDna) {
    return {
      score: 0,
      confidence: "emerging",
      sharedGenres: [],
      sharedMoods: [],
      sharedThemes: [],
      paceMatch: false,
      overlappingBooks: [],
      narrativeExplanation: "Generate or share Reading DNA to unlock taste compatibility insights.",
      differencesInTaste: [],
    };
  }

  // Intersect helper preserving clean capitalization
  const intersect = (mine: string[], theirs: string[]) => {
    const theirSet = new Set(theirs.map(norm));
    const seen = new Set<string>();
    const matches: string[] = [];
    mine.forEach((m) => {
      const n = norm(m);
      if (theirSet.has(n) && !seen.has(n)) {
        seen.add(n);
        matches.push(m.trim());
      }
    });
    return matches;
  };

  const myGenreNames = myDna.genres.map((g) => g.name);
  const theirGenreNames = theirDna.genres.map((g) => g.name);

  const sharedGenres = intersect(myGenreNames, theirGenreNames);
  const sharedMoods = intersect(myDna.moods, theirDna.moods);
  const sharedThemes = intersect(myDna.themes, theirDna.themes);
  const paceMatch = Boolean(
    myDna.pace && theirDna.pace && norm(myDna.pace) === norm(theirDna.pace)
  );

  // Confidence check: prevents misleading false precision when user has minimal shelf history
  const totalGenres = myDna.genres.length + theirDna.genres.length;
  const confidence: "high" | "moderate" | "emerging" =
    totalGenres >= 6 && (myDna.moods.length > 0 || myDna.themes.length > 0)
      ? "high"
      : totalGenres >= 2
      ? "moderate"
      : "emerging";

  // Book overlap on shelves
  const theirBookMap = new Map(
    theirShelf
      .map((b) => [b.book_id || b.id || b.books_library?.id, b])
      .filter(([id]) => Boolean(id))
  );

  const overlappingBooks = myShelf
    .filter((myBook) => {
      const id = myBook.book_id || myBook.id || myBook.books_library?.id;
      return id && theirBookMap.has(id);
    })
    .map((myBook) => {
      const id = myBook.book_id || myBook.id || myBook.books_library?.id;
      const theirBook = theirBookMap.get(id!);
      return {
        id,
        title: myBook.books_library?.title || theirBook?.books_library?.title || "Untitled Book",
        author: myBook.books_library?.author || theirBook?.books_library?.author,
        myRating: myBook.rating,
        theirRating: theirBook?.rating,
      };
    });

  // Differences in taste (genres present in one but not the other)
  const myGenreSet = new Set(myGenreNames.map(norm));
  const differencesInTaste = theirGenreNames
    .filter((g) => !myGenreSet.has(norm(g)))
    .slice(0, 4);

  // Natural narrative explanation
  let narrativeExplanation = "";
  if (sharedGenres.length > 0 && sharedMoods.length > 0) {
    narrativeExplanation = `Your reading tastes align because you both enjoy ${sharedGenres.slice(0, 3).join(", ")} with ${sharedMoods.slice(0, 2).join(" and ")} tones${paceMatch ? " at a similar reading pace" : ""}.`;
  } else if (sharedGenres.length > 0) {
    narrativeExplanation = `You share a strong interest in ${sharedGenres.slice(0, 3).join(", ")}${paceMatch ? " and read at a compatible pace" : ""}.`;
  } else if (sharedMoods.length > 0 || sharedThemes.length > 0) {
    const tones = [...sharedMoods, ...sharedThemes].slice(0, 3).join(" and ");
    narrativeExplanation = `While your genre selections differ, you both connect with ${tones} stories.`;
  } else {
    narrativeExplanation = `You have distinct literary styles, offering fresh perspectives and cross-genre discoveries.`;
  }

  return {
    score,
    confidence,
    sharedGenres,
    sharedMoods,
    sharedThemes,
    paceMatch,
    overlappingBooks,
    narrativeExplanation,
    differencesInTaste,
  };
};
