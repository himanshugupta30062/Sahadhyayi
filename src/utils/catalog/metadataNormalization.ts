/**
 * Deterministic metadata normalization for books.
 * Preserves original scripts (Hindi, Devanagari, etc.) while standardizing
 * whitespace, subtitles, contributor formatting, and ISBN identifiers.
 */

export interface NormalizedTitle {
  cleanTitle: string;
  subtitle?: string;
  editionTag?: string;
}

export interface NormalizedAuthor {
  normalizedAuthor: string;
  originalAuthor: string;
  role?: string;
}

export interface NormalizedIsbn {
  isbn10?: string;
  isbn13?: string;
  isValid: boolean;
}

/**
 * Normalizes book titles.
 * Preserves multilingual characters (Hindi, Bengali, Tamil, etc.).
 * Strips cosmetic noise like "(Illustrated)", "[Annotated]", "(Vintage Classics)".
 * Extracts subtitles after ':', ' - ', or ' — '.
 */
export function normalizeTitle(rawTitle: string): NormalizedTitle {
  if (!rawTitle) return { cleanTitle: 'Untitled' };

  // Normalize Unicode to Canonical Decomposition followed by Canonical Composition
  let title = rawTitle.normalize('NFC').trim();

  // Extract edition brackets at end of title or matching edition keywords (including Hindi संस्करण)
  let editionTag: string | undefined;
  const editionMatch =
    title.match(/[([]\s*([^()[\]]*?(?:illustrated|annotated|revised|expanded|edition|संस्करण|classics?|\d+(?:st|nd|rd|th)?\s+ed\w*)[^()[\]]*?)\s*[)\]]/i) ||
    title.match(/[([]\s*([^()[\]]+?)\s*[)\]]$/); // trailing brackets

  if (editionMatch) {
    editionTag = editionMatch[1].trim();
    title = title.replace(editionMatch[0], '').trim();
  }

  // Extract subtitle after colon, long dash or spaced hyphen
  let cleanTitle = title;
  let subtitle: string | undefined;

  const subtitleSeparatorMatch = title.match(/^(.*?)(?:\s*[:—]\s*|\s+-\s+)(.*)$/);
  if (subtitleSeparatorMatch && subtitleSeparatorMatch[1].trim().length >= 2) {
    cleanTitle = subtitleSeparatorMatch[1].trim();
    subtitle = subtitleSeparatorMatch[2].trim();
  }

  // If subtitle has trailing bracket, extract editionTag if needed and clean subtitle
  if (subtitle) {
    const subEditionMatch = subtitle.match(/[([]\s*([^()[\]]+?)\s*[)\]]$/);
    if (subEditionMatch) {
      if (!editionTag) editionTag = subEditionMatch[1].trim();
      subtitle = subtitle.replace(subEditionMatch[0], '').trim();
    }
  }

  // Clean trailing punctuation
  cleanTitle = cleanTitle.replace(/[,;:\-\s]+$/, '').trim();

  return {
    cleanTitle: cleanTitle || rawTitle.trim(),
    subtitle: subtitle || undefined,
    editionTag: editionTag || undefined,
  };
}

/**
 * Normalizes author names.
 * Inverts "Last, First" into "First Last".
 * Removes common academic and honorific prefixes while preserving the original name.
 * Respects Indian names and multi-word names without breaking Devanagari script.
 */
export function normalizeAuthor(rawAuthor?: string | null): NormalizedAuthor {
  if (!rawAuthor || !rawAuthor.trim()) {
    return { normalizedAuthor: 'Unknown Author', originalAuthor: 'Unknown Author' };
  }

  const originalAuthor = rawAuthor.normalize('NFC').trim();
  let author = originalAuthor;

  // Invert "Last, First" if separated by comma (e.g. "Dostoevsky, Fyodor" -> "Fyodor Dostoevsky")
  if (author.includes(',') && !author.toLowerCase().includes('and') && !author.toLowerCase().includes('&')) {
    const parts = author.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      author = `${parts[1]} ${parts[0]}`;
    }
  }

  // Strip common honorifics (Dr., Prof., Sir, Pandit, Shri, Acharya)
  author = author.replace(/^(dr\.|prof\.|sir\s+|pandit\s+|shri\s+|achary\w*\s+)/i, '').trim();

  // Collapse multiple whitespaces
  author = author.replace(/\s+/g, ' ');

  return {
    normalizedAuthor: author || originalAuthor,
    originalAuthor,
  };
}

/**
 * Validates and normalizes ISBN-10 and ISBN-13 check digits.
 */
export function normalizeIsbn(rawIsbn?: string | null): NormalizedIsbn {
  if (!rawIsbn) return { isValid: false };

  // Remove all hyphens and spaces
  const clean = rawIsbn.replace(/[-\s]/g, '').trim().toUpperCase();

  // Validate ISBN-10
  if (/^\d{9}[\dX]$/.test(clean)) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean[i], 10) * (10 - i);
    }
    const checkChar = clean[9];
    const checkValue = checkChar === 'X' ? 10 : parseInt(checkChar, 10);
    sum += checkValue;

    if (sum % 11 === 0) {
      return { isbn10: clean, isValid: true };
    }
  }

  // Validate ISBN-13
  if (/^\d{13}$/.test(clean)) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(clean[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit === parseInt(clean[12], 10)) {
      return { isbn13: clean, isValid: true };
    }
  }

  return { isValid: false };
}

/**
 * Creates a stable canonical cluster key for matching editions of the same work.
 * Preserves Unicode letters/numbers while normalizing case and punctuation.
 */
export function createCanonicalClusterKey(title: string, author?: string | null): string {
  const normTitle = normalizeTitle(title).cleanTitle;
  const normAuthor = normalizeAuthor(author).normalizedAuthor;

  // Keep all unicode letters and numbers, lowercase, remove symbols
  const tKey = normTitle.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const aKey = normAuthor.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

  return `${tKey}::${aKey || 'unknown'}`;
}
