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

  // Extract edition brackets at end of title or matching edition keywords (including Hindi संस्करण).
  // Scan simple bracket groups first so matching stays linear in the title length.
  let editionTag: string | undefined;
  const editionKeywords = /illustrated|annotated|revised|expanded|edition|संस्करण|classic|classics|[0-9]{1,4}(?:st|nd|rd|th)?[ \t]{1,8}ed[a-z]{0,32}/i;
  const bracketPattern = /[([]([^()[\]]*)[)\]]/g;
  let editionMatch: RegExpExecArray | null = null;
  let bracketMatch: RegExpExecArray | null;

  while ((bracketMatch = bracketPattern.exec(title)) !== null) {
    const bracketText = bracketMatch[1].trim();
    const isTrailingBracket = bracketMatch.index + bracketMatch[0].length === title.length;
    if (editionKeywords.test(bracketText) || isTrailingBracket) {
      editionMatch = bracketMatch;
      break;
    }
  }

  if (editionMatch) {
    editionTag = editionMatch[1].trim();
    title = title.slice(0, editionMatch.index) + title.slice(editionMatch.index + editionMatch[0].length);
    title = title.trim();
  }

  // Extract subtitle after colon, long dash or spaced hyphen
  let cleanTitle = title;
  let subtitle: string | undefined;

  const subtitleSeparators = [
    { index: title.indexOf(':'), length: 1 },
    { index: title.indexOf('—'), length: 1 },
    { index: title.indexOf(' - '), length: 3 },
  ].filter((separator) => separator.index >= 0).sort((a, b) => a.index - b.index);

  const subtitleSeparator = subtitleSeparators[0];
  if (subtitleSeparator) {
    const possibleTitle = title.slice(0, subtitleSeparator.index).trim();
    if (possibleTitle.length >= 2) {
      cleanTitle = possibleTitle;
      subtitle = title.slice(subtitleSeparator.index + subtitleSeparator.length).trim();
    }
  }

  // If subtitle ends with a simple bracket group, extract it without a backtracking regex.
  if (subtitle) {
    const closingBracket = subtitle[subtitle.length - 1];
    const openingBracket = closingBracket === ')' ? '(' : closingBracket === ']' ? '[' : null;
    const openingIndex = openingBracket ? subtitle.lastIndexOf(openingBracket) : -1;
    if (openingIndex >= 0) {
      const bracketText = subtitle.slice(openingIndex + 1, -1).trim();
      if (bracketText && !/[()[\]]/.test(bracketText)) {
        if (!editionTag) editionTag = bracketText;
        subtitle = subtitle.slice(0, openingIndex).trim();
      }
    }
  }

  // Remove a trailing volume/part marker from the work title. Volume identity is
  // captured separately by normalizeBookIdentity, so it must not pollute the title key.
  cleanTitle = cleanTitle
    .replace(/[ \t]{1,64}(?:vol(?:ume|\.)?|part)[ \t]{0,16}(?:[0-9]{1,8}|[ivxlcdm]{1,16})[ \t]{0,16}$/i, '')
    .replace(/[ \t]{1,64}(?:खण्ड|खंड|भाग)[ \t]{0,16}[०-९0-9]{1,8}[ \t]{0,16}$/u, '')
    .trim();

  // Clean trailing punctuation
  cleanTitle = cleanTitle.replace(/[,;:\- \t\r\n]{1,256}$/, '').trim();

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

  // Strip lifecycle dates like ", 1942-2018" or "(1942-2018)" or "b. 1942"
  author = author.replace(/,?\s*\(?\b(?:b\.\s*)?\d{4}\s*-\s*\d{0,4}\)?/g, '').trim();

  // If multiple co-authors separated by semicolon, slash, or "et al.", take primary author
  if (author.includes(';') || author.includes('/') || /\bet\s+al\.?/i.test(author)) {
    author = author.split(/[;/]|(\s+et\s+al\.?)/i)[0].trim();
  }

  // If co-authors separated by "and", "&", or "with"
  if (/\s+(?:and|&|with)\s+/i.test(author)) {
    author = author.split(/\s+(?:and|&|with)\s+/i)[0].trim();
  }

  // Invert "Last, First" if separated by comma (e.g. "Dostoevsky, Fyodor" -> "Fyodor Dostoevsky")
  if (author.includes(',')) {
    const parts = author.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      // Only invert if first part is a single surname without spaces (e.g. "Dostoevsky, Fyodor")
      // If first part has spaces (e.g. "Stephen Hawking, Leonard Mlodinow"), keep primary author parts[0]
      if (!parts[0].includes(' ')) {
        author = `${parts[1]} ${parts[0]}`;
      } else {
        author = parts[0];
      }
    } else if (parts.length > 2 && !parts[0].includes(' ')) {
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
      sum += Number.parseInt(clean[i], 10) * (10 - i);
    }
    const checkChar = clean[9];
    const checkValue = checkChar === 'X' ? 10 : Number.parseInt(checkChar, 10);
    sum += checkValue;

    if (sum % 11 === 0) {
      return { isbn10: clean, isValid: true };
    }
  }

  // Validate ISBN-13
  if (/^\d{13}$/.test(clean)) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(clean[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit === Number.parseInt(clean[12], 10)) {
      return { isbn13: clean, isValid: true };
    }
  }

  return { isValid: false };
}

/**
 * Validates whether an ISBN-10 or ISBN-13 is mathematically valid
 */
export function validateISBN(rawIsbn?: string | null): boolean {
  return normalizeIsbn(rawIsbn).isValid;
}

/**
 * Creates a stable canonical cluster key for matching editions of the same work.
 * Preserves Unicode letters/numbers while normalizing case and punctuation.
 */
export function createCanonicalClusterKey(title: string, author?: string | null): string {
  const normTitle = normalizeTitle(title).cleanTitle;
  const normAuthor = normalizeAuthor(author).normalizedAuthor;

  // Keep all unicode letters and numbers, lowercase, remove symbols
  const tKey = normTitle.toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim();
  const aKey = normAuthor.toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim();

  return `${tKey}::${aKey || 'unknown'}`;
}
