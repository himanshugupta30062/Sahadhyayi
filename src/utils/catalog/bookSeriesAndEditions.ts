import type { BookSeries, Edition, ParsedSeriesInfo, SeriesVolume, Work } from '@/types/bookCatalog';
import type { BookshelfItem } from '@/hooks/useUserBookshelf';
import {
  createCanonicalClusterKey,
  normalizeAuthor,
  normalizeIsbn,
  normalizeTitle,
  validateISBN,
} from './metadataNormalization';

// ============================================================================
// ISBN NORMALIZATION, CONVERSION & FORMATTING
// ============================================================================

/**
 * Validates whether an ISBN-10 string passes the mod-11 checksum.
 */
export function isValidIsbn10(isbn: string): boolean {
  if (!isbn) return false;
  const clean = isbn.replace(/[-\s]/g, '').trim().toUpperCase();
  if (!/^\d{9}[\dX]$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(clean[i], 10) * (10 - i);
  }
  const checkChar = clean[9];
  const checkVal = checkChar === 'X' ? 10 : Number.parseInt(checkChar, 10);
  sum += checkVal;

  return sum % 11 === 0;
}

/**
 * Validates whether an ISBN-13 string passes the mod-10 checksum.
 */
export function isValidIsbn13(isbn: string): boolean {
  if (!isbn) return false;
  const clean = isbn.replace(/[-\s]/g, '').trim();
  if (!/^\d{13}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(clean[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number.parseInt(clean[12], 10);
}

/**
 * Converts a valid ISBN-10 to its canonical EAN-13 (ISBN-13) equivalent with prefix 978.
 */
export function isbn10ToIsbn13(isbn10: string): string | null {
  if (!isValidIsbn10(isbn10)) return null;
  const clean10 = isbn10.replace(/[-\s]/g, '').trim().toUpperCase();
  const core9 = clean10.slice(0, 9);
  const prefix12 = `978${core9}`;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(prefix12[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${prefix12}${checkDigit}`;
}

/**
 * Formats an ISBN into standard hyphenated representation for readable display.
 */
export function formatIsbn(isbn: string): string {
  if (!isbn) return '';
  const clean = isbn.replace(/[-\s]/g, '').trim().toUpperCase();

  if (clean.length === 13 && isValidIsbn13(clean)) {
    // 978-X-XXX-XXXXX-X standard partition
    return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 7)}-${clean.slice(7, 12)}-${clean.slice(12)}`;
  }

  if (clean.length === 10 && isValidIsbn10(clean)) {
    // X-XXX-XXXXX-X standard partition
    return `${clean.slice(0, 1)}-${clean.slice(1, 4)}-${clean.slice(4, 9)}-${clean.slice(9)}`;
  }

  return clean;
}

/**
 * Returns canonical ISBN-13 if valid or convertible, otherwise normalized ISBN-10, or null.
 */
export function getCanonicalIsbn(raw?: string | null): string | null {
  if (!raw) return null;
  const norm = normalizeIsbn(raw);
  if (!norm.isValid) return null;

  if (norm.isbn13) return norm.isbn13;
  if (norm.isbn10) {
    const converted = isbn10ToIsbn13(norm.isbn10);
    return converted || norm.isbn10;
  }

  return null;
}

// ============================================================================
// SERIES PARSING & SEQUENCE LOGIC
// ============================================================================

const ROMAN_NUMERALS: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5,
  vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15,
};

const HINDI_NUMERALS: Record<string, number> = {
  '०': 0, '१': 1, '२': 2, '३': 3, '४': 4,
  '५': 5, '६': 6, '७': 7, '८': 8, '९': 9,
};

function parseHindiNumber(text: string): number | null {
  let res = 0;
  let hasDigit = false;
  for (const ch of text) {
    if (ch in HINDI_NUMERALS) {
      res = res * 10 + HINDI_NUMERALS[ch];
      hasDigit = true;
    }
  }
  return hasDigit ? res : null;
}

/**
 * Parses series name and sequence information from a book title or description.
 * Gracefully recognizes parenthetical markers, subtitles, Roman numerals, and Hindi scripts.
 * Returns null or isStandalone: true if book is not part of a series.
 */
export function parseBookSeries(
  title: string,
  description?: string | null,
): ParsedSeriesInfo | null {
  if (!title || !title.trim()) return null;

  const rawTitle = title.normalize('NFC').trim();

  // 1. Look for parenthetical or bracketed series: e.g. "(Dune Chronicles, #1)", "(The Lord of the Rings, Book 1 of 3)"
  // Simplified to avoid catastrophic backtracking: use atomic groups and possessive quantifiers where possible
  // Match: (Series Name, #1) or (Series Name, Book 1) or (Series Name, Vol. 1) etc.
  const bracketRegex = /(?:\(|\[)\s*([^()[\]]{1,100}?)\s*[,:]\s*(?:#|book|vol(?:ume|\.)?|part|खण्ड|भाग|अंक)?\s*([0-9ivxlcdm०-९]+(?:\.[0-9]+)?|prequel|novella|companion)(?:\s+of\s+([0-9०-९]{1,3}))?\s*(?:\)|\])/i;
  const bracketMatch = rawTitle.match(bracketRegex);

  if (bracketMatch) {
    const seriesName = bracketMatch[1].trim();
    const rawSeq = bracketMatch[2].trim();
    const totalRaw = bracketMatch[3]?.trim();

    let volumeNumber: number | null = null;
    const lowerSeq = rawSeq.toLowerCase();

    if (lowerSeq === 'prequel') {
      volumeNumber = 0;
    } else if (lowerSeq in ROMAN_NUMERALS) {
      volumeNumber = ROMAN_NUMERALS[lowerSeq];
    } else if (/\d/.test(rawSeq)) {
      volumeNumber = Number.parseFloat(rawSeq);
    } else if (/[०-९]/.test(rawSeq)) {
      volumeNumber = parseHindiNumber(rawSeq);
    }

    let totalVolumes: number | null = null;
    if (totalRaw) {
      totalVolumes = /\d/.test(totalRaw) ? Number.parseInt(totalRaw, 10) : parseHindiNumber(totalRaw);
    }

    return {
      seriesName,
      volumeNumber: Number.isNaN(volumeNumber) ? null : volumeNumber,
      rawSequence: rawSeq,
      totalVolumes: Number.isNaN(totalVolumes) ? null : totalVolumes,
      isStandalone: false,
    };
  }

  // 2. Format: "(Series Name #1)" or "(Series Name 1)"
  // Simplified: limit the first capture group to avoid backtracking
  const simpleNumMatch = rawTitle.match(/[([]\s*([^()[\]#]{1,100}?)\s*#\s*([0-9]+(?:\.[0-9]+)?)\s*[)\]]/i);
  if (simpleNumMatch) {
    const seriesName = simpleNumMatch[1].trim();
    const volumeNumber = Number.parseFloat(simpleNumMatch[2]);
    return {
      seriesName,
      volumeNumber: Number.isNaN(volumeNumber) ? null : volumeNumber,
      rawSequence: simpleNumMatch[2],
      isStandalone: false,
    };
  }

  // 3. Format: "Book 1 of The Expanse" in description or title
  const bookOfRegex = /\b(?:book|volume|vol\.|part)\s+([0-9]+)\s+of\s+([^.,\n\r()]{3,40}?)(?:\s+series|\.|\n|,|$)/i;
  const bookOfMatch = rawTitle.match(bookOfRegex) || (description ? description.match(bookOfRegex) : null);

  if (bookOfMatch) {
    const volumeNumber = Number.parseInt(bookOfMatch[1], 10);
    const seriesName = bookOfMatch[2].trim();
    return {
      seriesName,
      volumeNumber,
      rawSequence: bookOfMatch[1],
      isStandalone: false,
    };
  }

  // 4. Format: "Harry Potter and the Sorcerer's Stone (Harry Potter, #1)"
  // Simplified: limit the first capture group
  const commaSeriesMatch = rawTitle.match(/[([]\s*([^()[\]]{1,100}?)\s*,\s*#?\s*([0-9]{1,3})\s*[)\]]/i);
  if (commaSeriesMatch) {
    const seriesName = commaSeriesMatch[1].trim();
    const volumeNumber = Number.parseInt(commaSeriesMatch[2], 10);
    return {
      seriesName,
      volumeNumber,
      rawSequence: commaSeriesMatch[2],
      isStandalone: false,
    };
  }

  // Standalone book
  return null;
}

/**
 * Deterministically compares two series volumes to establish the canonical reading order.
 * Prequels (0 or negative) come before Book 1.
 * Numeric positions sort ascending.
 * Unnumbered volumes sort by publication year ascending, then title.
 */
export function compareSeriesVolumes(a: SeriesVolume, b: SeriesVolume): number {
  const aHasNum = a.sequenceNumber !== null && a.sequenceNumber !== undefined;
  const bHasNum = b.sequenceNumber !== null && b.sequenceNumber !== undefined;

  if (aHasNum && bHasNum) {
    if (a.sequenceNumber !== b.sequenceNumber) {
      return (a.sequenceNumber as number) - (b.sequenceNumber as number);
    }
  } else if (aHasNum && !bHasNum) {
    return -1; // Numbered volumes come first
  } else if (!aHasNum && bHasNum) {
    return 1;
  }

  // Fallback to publication year
  if (a.publicationYear && b.publicationYear && a.publicationYear !== b.publicationYear) {
    return a.publicationYear - b.publicationYear;
  }

  // Fallback to title
  return a.title.localeCompare(b.title);
}

/**
 * Builds previous and next volume navigation links for the current book in a series.
 */
export function buildSeriesNavigation(
  volumes: SeriesVolume[],
  currentBookId: string,
): { prevVolume: SeriesVolume | null; nextVolume: SeriesVolume | null } {
  if (!volumes || volumes.length <= 1) {
    return { prevVolume: null, nextVolume: null };
  }

  // Deduplicate volumes by work identity or title to prevent multiple editions appearing
  const uniqueVolumes = deduplicateSeriesVolumes(volumes);
  const sorted = [...uniqueVolumes].sort(compareSeriesVolumes);

  const currentIndex = sorted.findIndex(v => v.bookId === currentBookId);
  if (currentIndex === -1) {
    return { prevVolume: null, nextVolume: null };
  }

  const prevVolume = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextVolume = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  return { prevVolume, nextVolume };
}

/**
 * Deduplicates series volumes so alternative editions of the same book do not clutter the series view.
 */
export function deduplicateSeriesVolumes(volumes: SeriesVolume[]): SeriesVolume[] {
  const seenKeys = new Set<string>();
  const deduplicated: SeriesVolume[] = [];

  for (const vol of volumes) {
    const norm = normalizeTitle(vol.title);
    const key = `${createCanonicalClusterKey(norm.cleanTitle, vol.author)}::${vol.sequenceNumber ?? 'none'}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicated.push(vol);
    }
  }

  return deduplicated;
}

// ============================================================================
// SAFE METADATA MERGING FOR IMPORTS & EDITIONS
// ============================================================================

export interface MergeOptions {
  /** If true, explicit values in existing take precedence over incoming external data */
  preferExistingUserEdits?: boolean;
}

/**
 * Safely merges incoming metadata into an existing edition.
 * Guarantees that existing user data or high-confidence values are not replaced with empty or placeholder fields.
 */
export function mergeEditionMetadata(
  existing: Partial<Edition>,
  incoming: Partial<Edition>,
  options: MergeOptions = { preferExistingUserEdits: true },
): Partial<Edition> {
  const merged: Partial<Edition> = { ...existing };

  const shouldOverwrite = (existingVal: any, incomingVal: any): boolean => {
    // If incoming is empty or undefined, never overwrite
    if (incomingVal === undefined || incomingVal === null || incomingVal === '') return false;
    // If existing is missing, accept incoming
    if (existingVal === undefined || existingVal === null || existingVal === '') return true;
    // If preferExistingUserEdits is on and existing is present, keep existing
    if (options.preferExistingUserEdits) return false;
    return true;
  };

  // Safe field copy
  if (shouldOverwrite(existing.title, incoming.title)) merged.title = incoming.title;
  if (shouldOverwrite(existing.subtitle, incoming.subtitle)) merged.subtitle = incoming.subtitle;
  if (shouldOverwrite(existing.author, incoming.author)) merged.author = incoming.author;
  if (shouldOverwrite(existing.publisher, incoming.publisher)) merged.publisher = incoming.publisher;
  if (shouldOverwrite(existing.publicationYear, incoming.publicationYear) && incoming.publicationYear && incoming.publicationYear > 0) {
    merged.publicationYear = incoming.publicationYear;
  }
  if (shouldOverwrite(existing.pages, incoming.pages) && incoming.pages && incoming.pages > 0) {
    merged.pages = incoming.pages;
  }
  if (shouldOverwrite(existing.language, incoming.language)) merged.language = incoming.language;
  if (shouldOverwrite(existing.format, incoming.format)) merged.format = incoming.format;

  // Cover: do not overwrite a valid cover with an empty string or placeholder
  if (incoming.coverImageUrl && (!existing.coverImageUrl || !options.preferExistingUserEdits)) {
    if (!incoming.coverImageUrl.includes('placeholder') && !incoming.coverImageUrl.includes('no-cover')) {
      merged.coverImageUrl = incoming.coverImageUrl;
    }
  }

  // Description: prefer longer / more descriptive text
  if (incoming.description) {
    if (!existing.description) {
      merged.description = incoming.description;
    } else if (!options.preferExistingUserEdits && incoming.description.length > (existing.description.length || 0)) {
      merged.description = incoming.description;
    }
  }

  // ISBNs: validate before merging
  if (incoming.isbn13 && isValidIsbn13(incoming.isbn13)) {
    if (!existing.isbn13 || !isValidIsbn13(existing.isbn13)) {
      merged.isbn13 = incoming.isbn13;
    }
  }
  if (incoming.isbn10 && isValidIsbn10(incoming.isbn10)) {
    if (!existing.isbn10 || !isValidIsbn10(existing.isbn10)) {
      merged.isbn10 = incoming.isbn10;
    }
  }

  return merged;
}

// ============================================================================
// EDITION READING CONTEXT & SHELF PRESERVATION
// ============================================================================

export interface EditionReadingContext {
  /** The edition currently being viewed */
  currentEditionId: string;
  /** Is this exact edition currently saved on the user's shelf? */
  isCurrentEditionShelved: boolean;
  /** The shelf record for the current edition (if shelved) */
  currentShelfItem: BookshelfItem | null;
  /** Does the user have another edition of this canonical work on their shelf? */
  hasOtherShelvedEdition: boolean;
  /** The alternative edition currently shelved (e.g. Paperback 2018) */
  otherShelvedEdition: Edition | null;
  /** The shelf item for that other edition */
  otherShelfItem: BookshelfItem | null;
  /** Friendly message explaining edition shelf status */
  noticeMessage?: string;
}

/**
 * Inspects a user's shelf items against a work's editions to identify whether
 * the user has already read or shelved a different edition, ensuring reading history
 * is preserved and never silently overwritten.
 */
export function getEditionReadingContext(
  currentEditionId: string,
  workEditions: Edition[],
  userShelfItems: BookshelfItem[],
): EditionReadingContext {
  const currentShelfItem = userShelfItems.find(item => item.book_id === currentEditionId) || null;
  const isCurrentEditionShelved = currentShelfItem !== null;

  // Check if any other edition of this work is on the shelf
  let otherShelvedEdition: Edition | null = null;
  let otherShelfItem: BookshelfItem | null = null;

  for (const edition of workEditions) {
    if (edition.id === currentEditionId) continue;
    const match = userShelfItems.find(item => item.book_id === edition.id);
    if (match) {
      otherShelvedEdition = edition;
      otherShelfItem = match;
      break;
    }
  }

  const hasOtherShelvedEdition = otherShelvedEdition !== null;

  let noticeMessage: string | undefined;
  if (!isCurrentEditionShelved && hasOtherShelvedEdition && otherShelvedEdition) {
    const statusLabel = otherShelfItem?.status ? otherShelfItem.status.replace('_', ' ') : 'shelved';
    noticeMessage = `You have another edition of this work on your "${statusLabel}" shelf (${otherShelvedEdition.format || 'Standard Edition'}${otherShelvedEdition.publicationYear ? `, ${otherShelvedEdition.publicationYear}` : ''}). Your reading history is preserved per edition.`;
  }

  return {
    currentEditionId,
    isCurrentEditionShelved,
    currentShelfItem,
    hasOtherShelvedEdition,
    otherShelvedEdition,
    otherShelfItem,
    noticeMessage,
  };
}
