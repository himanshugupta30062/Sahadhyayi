import { BOOK_MOODS, BOOK_CONTENT_WARNINGS, type BookMood, type BookContentWarning } from '@/hooks/useBookExperience';

export type MoodId =
  | 'comforting'
  | 'uplifting'
  | 'thought-provoking'
  | 'dark'
  | 'adventurous'
  | 'romantic'
  | 'funny'
  | 'mysterious'
  | 'immersive'
  | 'emotional';

export type PaceFilter = 'all' | 'short' | 'medium' | 'long';

export interface MoodMetadata {
  id: MoodId;
  label: string;
  icon: string;
  description: string;
  keywords: string[];
  communityTags: BookMood[];
}

export const DISCOVERY_MOODS: MoodMetadata[] = [
  {
    id: 'comforting',
    label: 'Comforting & Cozy',
    icon: '☕',
    description: 'Gentle, heartwarming stories to soothe and comfort you.',
    keywords: ['comfort', 'cozy', 'gentle', 'wholesome', 'warm', 'heartwarming', 'feel-good', 'peaceful', 'hygge', 'slice of life'],
    communityTags: ['comforting'],
  },
  {
    id: 'uplifting',
    label: 'Uplifting & Hopeful',
    icon: '✨',
    description: 'Inspiring tales of resilience, joy, triumph, and hope.',
    keywords: ['hope', 'uplifting', 'inspiring', 'triumph', 'joy', 'resilience', 'positive', 'courage', 'optimism', 'bright'],
    communityTags: ['hopeful', 'inspiring'],
  },
  {
    id: 'thought-provoking',
    label: 'Thought-Provoking',
    icon: '🧠',
    description: 'Philosophical, deep reads that challenge ideas and expand your mind.',
    keywords: ['philosophy', 'philosophical', 'thought-provoking', 'intellectual', 'insightful', 'contemplative', 'deep', 'ideas', 'society', 'existential'],
    communityTags: ['reflective', 'challenging'],
  },
  {
    id: 'dark',
    label: 'Dark & Atmospheric',
    icon: '🌑',
    description: 'Gritty, eerie, haunting, and psychologically intense narratives.',
    keywords: ['dark', 'gritty', 'gothic', 'haunting', 'noir', 'macabre', 'bleak', 'sinister', 'psychological', 'dystopian', 'shadow'],
    communityTags: ['dark'],
  },
  {
    id: 'adventurous',
    label: 'Adventurous & Epic',
    icon: '🗺️',
    description: 'High-stakes journeys, quests, exploration, and exhilarating action.',
    keywords: ['adventure', 'quest', 'expedition', 'action', 'journey', 'thrilling', 'epic', 'survival', 'peril', 'odyssey'],
    communityTags: ['adventurous'],
  },
  {
    id: 'romantic',
    label: 'Romantic & Passionate',
    icon: '💖',
    description: 'Heartfelt romances, emotional connections, and tender bonds.',
    keywords: ['romance', 'love', 'passion', 'relationship', 'chemistry', 'yearning', 'heartfelt', 'affection', 'sweetheart'],
    communityTags: ['romantic'],
  },
  {
    id: 'funny',
    label: 'Funny & Lighthearted',
    icon: '😄',
    description: 'Witty, charming, humorous reads guaranteed to make you smile.',
    keywords: ['humor', 'funny', 'comedy', 'witty', 'satire', 'hilarious', 'amusing', 'laugh', 'quirky', 'playful', 'silly'],
    communityTags: ['funny'],
  },
  {
    id: 'mysterious',
    label: 'Mysterious & Suspenseful',
    icon: '🔍',
    description: 'Enigmatic puzzles, investigations, secrets, and thrilling twists.',
    keywords: ['mystery', 'secret', 'investigation', 'puzzle', 'detective', 'suspense', 'whodunit', 'enigmatic', 'crime', 'clues'],
    communityTags: ['mysterious', 'tense'],
  },
  {
    id: 'immersive',
    label: 'Immersive World-Building',
    icon: '🏰',
    description: 'Richly textured settings, expansive sagas, and intricate lore.',
    keywords: ['world-building', 'lore', 'saga', 'universe', 'chronicle', 'historical', 'sprawling', 'expansive', 'fantasy', 'sci-fi'],
    communityTags: ['challenging', 'adventurous'],
  },
  {
    id: 'emotional',
    label: 'Emotional & Poignant',
    icon: '🌧️',
    description: 'Deeply touching, bittersweet stories of human longing and growth.',
    keywords: ['emotional', 'poignant', 'bittersweet', 'tearjerker', 'melancholy', 'grief', 'moving', 'heartache', 'loss', 'tender'],
    communityTags: ['sad', 'reflective'],
  },
];

export const CONTENT_WARNING_OPTIONS = BOOK_CONTENT_WARNINGS;

export const PACE_DEFINITIONS: Record<PaceFilter, { label: string; description: string; pageRange: string }> = {
  all: { label: 'Any pace', description: 'All lengths & reading tempos', pageRange: 'All books' },
  short: { label: 'Quick read', description: 'Up to 220 pages (~2–4 hrs)', pageRange: '≤ 220 pages' },
  medium: { label: 'Balanced pace', description: '221–420 pages (~5–8 hrs)', pageRange: '221–420 pages' },
  long: { label: 'Deep immersion', description: '421+ pages (9+ hrs)', pageRange: '> 420 pages' },
};

export interface BookExperienceSummary {
  book_id: string;
  moods: string[];
  pacing: 'fast' | 'medium' | 'slow' | null;
  content_warnings: string[];
  community_tags_count: number;
}

export interface ContentWarningFilterState {
  hiddenWarnings: string[];
  strictUnknown: boolean;
}

export interface DiscoveryPreferences {
  selectedMood: MoodId | null;
  paceFilter: PaceFilter;
  includeUnknownLength: boolean;
  contentWarnings: ContentWarningFilterState;
  savedAt?: string;
  consentGiven: boolean;
}

export const DISCOVERY_PREFERENCES_STORAGE_KEY = 'sahadhyayi_discovery_preferences_v1';

export function loadSavedDiscoveryPreferences(): DiscoveryPreferences | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(DISCOVERY_PREFERENCES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.consentGiven) {
      return parsed as DiscoveryPreferences;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function saveDiscoveryPreferences(prefs: DiscoveryPreferences): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (prefs.consentGiven) {
      window.localStorage.setItem(
        DISCOVERY_PREFERENCES_STORAGE_KEY,
        JSON.stringify({ ...prefs, savedAt: new Date().toISOString() })
      );
    } else {
      window.localStorage.removeItem(DISCOVERY_PREFERENCES_STORAGE_KEY);
    }
  } catch {
    // Ignore quota errors
  }
}

export function clearSavedDiscoveryPreferences(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(DISCOVERY_PREFERENCES_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export interface FilterBookParams {
  selectedMood: MoodId | null;
  paceFilter: PaceFilter;
  includeUnknownLength: boolean;
  contentWarnings: ContentWarningFilterState;
  genreFilter: string;
  languageFilter: string;
  availabilityFilter: 'all' | 'readable';
  searchQuery: string;
}

export interface BookScoreResult<T = any> {
  book: T;
  score: number;
  moodMatch?: {
    type: 'community' | 'inferred';
    label: string;
    reason: string;
  };
  paceMatch?: {
    label: string;
    source: 'pages' | 'community' | 'unknown';
  };
  contentWarningInfo: {
    warnings: string[];
    status: 'clean' | 'reported' | 'unreviewed';
  };
  isExcluded: boolean;
  exclusionReason?: string;
}

/**
 * Evaluates whether a book matches a pace filter.
 */
export function evaluatePaceMatch(
  pages?: number | null,
  communityPacing?: 'fast' | 'medium' | 'slow' | null,
  paceFilter: PaceFilter = 'all',
  includeUnknownLength = true
): { matches: boolean; source: 'pages' | 'community' | 'unknown'; label: string } {
  if (paceFilter === 'all') {
    return { matches: true, source: pages ? 'pages' : 'unknown', label: 'Any pace' };
  }

  // 1. If explicit community pacing matches
  if (communityPacing) {
    if (
      (paceFilter === 'short' && communityPacing === 'fast') ||
      (paceFilter === 'medium' && communityPacing === 'medium') ||
      (paceFilter === 'long' && communityPacing === 'slow')
    ) {
      return { matches: true, source: 'community', label: `Reader-tagged: ${communityPacing} pace` };
    }
  }

  // 2. If page count is recorded
  if (typeof pages === 'number' && pages > 0) {
    if (paceFilter === 'short' && pages <= 220) {
      return { matches: true, source: 'pages', label: `${pages} pages (quick read)` };
    }
    if (paceFilter === 'medium' && pages > 220 && pages <= 420) {
      return { matches: true, source: 'pages', label: `${pages} pages (balanced read)` };
    }
    if (paceFilter === 'long' && pages > 420) {
      return { matches: true, source: 'pages', label: `${pages} pages (deep read)` };
    }
    // Explicit length did not fall in the selected range
    return { matches: false, source: 'pages', label: `${pages} pages` };
  }

  // 3. Page count is unrecorded / unknown
  if (includeUnknownLength) {
    return { matches: true, source: 'unknown', label: 'Length unrecorded (included)' };
  }

  return { matches: false, source: 'unknown', label: 'Length unrecorded (strict excluded)' };
}

/**
 * Evaluates mood alignment for a book, distinguishing verified community tags from explainable inferred metadata.
 */
export function evaluateMoodMatch(
  book: { title?: string; author?: string; genre?: string; description?: string },
  communityMoods: string[] = [],
  selectedMood: MoodId | null
): { matches: boolean; type?: 'community' | 'inferred'; label?: string; reason?: string; scoreBoost: number } {
  if (!selectedMood) {
    return { matches: true, scoreBoost: 0 };
  }

  const moodDef = DISCOVERY_MOODS.find((m) => m.id === selectedMood);
  if (!moodDef) {
    return { matches: true, scoreBoost: 0 };
  }

  // 1. Check verified community tags
  const matchedCommunity = communityMoods.find((cm) =>
    moodDef.communityTags.some((tag) => tag.toLowerCase() === cm.toLowerCase())
  );

  if (matchedCommunity) {
    return {
      matches: true,
      type: 'community',
      label: moodDef.label,
      reason: `Reader community tagged: ${matchedCommunity}`,
      scoreBoost: 100,
    };
  }

  // 2. Explainable inference from book metadata (genre + description + title)
  const corpus = `${book.title || ''} ${book.genre || ''} ${book.description || ''}`.toLowerCase();
  const matchedKeyword = moodDef.keywords.find((kw) => corpus.includes(kw));

  if (matchedKeyword) {
    return {
      matches: true,
      type: 'inferred',
      label: moodDef.label,
      reason: `Inferred vibe from genre & synopsis (keyword: "${matchedKeyword}")`,
      scoreBoost: 45,
    };
  }

  // Mood did not match
  return {
    matches: false,
    scoreBoost: 0,
  };
}

/**
 * Evaluates content warnings on a book against user preferences.
 */
export function evaluateContentWarnings(
  communityWarnings: string[] = [],
  filterState: ContentWarningFilterState
): { isExcluded: boolean; status: 'clean' | 'reported' | 'unreviewed'; reason?: string } {
  const { hiddenWarnings, strictUnknown } = filterState;

  if (communityWarnings.length > 0) {
    const overlapping = communityWarnings.filter((w) =>
      hiddenWarnings.some((hw) => hw.toLowerCase() === w.toLowerCase())
    );

    if (overlapping.length > 0) {
      return {
        isExcluded: true,
        status: 'reported',
        reason: `Excluded due to reported content warnings: ${overlapping.join(', ')}`,
      };
    }

    return {
      isExcluded: false,
      status: 'reported',
    };
  }

  // No community warnings reported yet
  if (hiddenWarnings.length > 0 && strictUnknown) {
    return {
      isExcluded: true,
      status: 'unreviewed',
      reason: 'Excluded by strict safety setting: content warnings not yet reviewed by community',
    };
  }

  return {
    isExcluded: false,
    status: 'unreviewed',
  };
}

/**
 * Filter and score an entire catalog of books using mood, pace, content warnings, and standard catalog filters.
 */
export function filterAndRankBooks<T extends {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  language?: string;
  pdf_url?: string;
  pages?: number;
  created_at: string;
}>(
  books: T[],
  params: FilterBookParams,
  experienceSummaries: Map<string, BookExperienceSummary> = new Map()
): BookScoreResult<T>[] {
  const {
    selectedMood,
    paceFilter,
    includeUnknownLength,
    contentWarnings,
    genreFilter,
    languageFilter,
    availabilityFilter,
    searchQuery,
  } = params;

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const results: BookScoreResult<T>[] = [];

  for (const book of books) {
    // Search query
    if (normalizedSearch) {
      const matchSearch =
        book.title.toLowerCase().includes(normalizedSearch) ||
        (book.author && book.author.toLowerCase().includes(normalizedSearch)) ||
        (book.genre && book.genre.toLowerCase().includes(normalizedSearch));
      if (!matchSearch) continue;
    }

    // Language filter
    if (languageFilter !== 'all' && book.language !== languageFilter) {
      continue;
    }

    // Genre filter
    if (genreFilter !== 'all' && book.genre !== genreFilter) {
      continue;
    }

    // Availability filter
    if (availabilityFilter === 'readable' && !book.pdf_url) {
      continue;
    }

    // Experience summary for this book
    const exp = experienceSummaries.get(book.id);
    const commMoods = exp?.moods || [];
    const commPacing = exp?.pacing || null;
    const commWarnings = exp?.content_warnings || [];

    // 1. Content warnings check
    const cwEval = evaluateContentWarnings(commWarnings, contentWarnings);
    if (cwEval.isExcluded) {
      continue;
    }

    // 2. Pace match check
    const paceEval = evaluatePaceMatch(book.pages, commPacing, paceFilter, includeUnknownLength);
    if (!paceEval.matches) {
      continue;
    }

    // 3. Mood match check
    const moodEval = evaluateMoodMatch(book, commMoods, selectedMood);
    if (!moodEval.matches) {
      continue;
    }

    // Calculate ranking score
    let score = 0;
    score += moodEval.scoreBoost;
    if (book.pdf_url) score += 20;
    if (commMoods.length > 0) score += 10;
    if (book.pages) score += 5;

    results.push({
      book,
      score,
      moodMatch: moodEval.type ? {
        type: moodEval.type,
        label: moodEval.label!,
        reason: moodEval.reason!,
      } : undefined,
      paceMatch: {
        label: paceEval.label,
        source: paceEval.source,
      },
      contentWarningInfo: {
        warnings: commWarnings,
        status: cwEval.status,
      },
      isExcluded: false,
    });
  }

  return results;
}
