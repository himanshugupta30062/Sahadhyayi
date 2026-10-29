import { BookIdentity } from '@/types/bookCatalog';
import { normalizeTitle, normalizeAuthor, validateISBN } from './metadataNormalization';

/**
 * Normalizes book metadata sufficiently to identify duplicates,
 * while strictly preserving original scripts (e.g. Devanagari),
 * distinct subtitles, volume numbers, and translation roles.
 */
export function normalizeBookIdentity(book: any): BookIdentity {
  if (!book) {
    return {
      cleanTitle: 'Untitled',
      normalizedTitleKey: 'untitled',
      cleanAuthors: ['Unknown Author'],
      primaryAuthor: 'Unknown Author',
      normalizedAuthorKey: 'unknownauthor',
      isbns: [],
      language: 'en',
      isOriginalScript: false,
      raw: book,
    };
  }

  // 1. Title, Subtitle, Edition & Volume Tags
  const rawTitle = (book.title || '').trim();
  const titleNorm = normalizeTitle(rawTitle);

  // Extract explicit volume or part indicators (e.g. "Volume 1", "Vol. 2", "Part 1")
  let volumeTag: string | undefined;
  const volMatch = rawTitle.match(/\b(?:vol(?:ume|\.)?|part|खण्ड|भाग)\s*([0-9ivxlcdm]+)\b/i);
  if (volMatch) {
    volumeTag = `vol-${volMatch[1].toLowerCase()}`;
  }

  // Generate alphanumeric key for fuzzy matching
  const normalizedTitleKey = titleNorm.cleanTitle
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '')
    .trim() || 'untitled';

  // 2. Authors & Contributors
  const rawAuthor = (book.author || '').trim();
  let cleanAuthors: string[] = [];

  if (rawAuthor) {
    // Split multi-author strings by semicolon, " and ", " & ", or comma if not Last, First format
    const candidateParts = rawAuthor.includes(';')
      ? rawAuthor.split(';')
      : rawAuthor.includes(' and ')
      ? rawAuthor.split(' and ')
      : rawAuthor.includes(' & ')
      ? rawAuthor.split(' & ')
      : [rawAuthor];

    cleanAuthors = candidateParts
      .map((part: string) => normalizeAuthor(part.trim()).normalizedAuthor)
      .filter(Boolean);
  }

  if (cleanAuthors.length === 0) {
    cleanAuthors = ['Unknown Author'];
  }

  const primaryAuthor = cleanAuthors[0];
  const normalizedAuthorKey = primaryAuthor
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '')
    .trim() || 'unknownauthor';

  // 3. ISBNs with Checksum Verification
  const isbns: string[] = [];
  const rawIsbn = (book.isbn || '').toString().trim();
  if (rawIsbn) {
    // Can contain multiple ISBNs separated by comma/slash/space
    const tokens = rawIsbn.split(/[,/;\s]+/);
    for (const token of tokens) {
      const cleanToken = token.replace(/[^0-9X]/gi, '').toUpperCase();
      if (cleanToken.length === 10 || cleanToken.length === 13) {
        if (validateISBN(cleanToken)) {
          if (!isbns.includes(cleanToken)) {
            isbns.push(cleanToken);
          }
        }
      }
    }
  }

  // 4. Language & Script Preservation
  const rawLang = (book.language || 'English').toLowerCase().trim();
  let language = 'en';
  if (rawLang.includes('hindi') || rawLang === 'hi' || rawLang.includes('हिन्दी') || rawLang.includes('हिंदी')) {
    language = 'hi';
  } else if (rawLang.includes('sanskrit') || rawLang === 'sa') {
    language = 'sa';
  } else if (rawLang.includes('french') || rawLang === 'fr') {
    language = 'fr';
  } else if (rawLang.includes('german') || rawLang === 'de') {
    language = 'de';
  } else if (rawLang.includes('spanish') || rawLang === 'es') {
    language = 'es';
  } else if (rawLang.includes('tamil') || rawLang === 'ta') {
    language = 'ta';
  } else if (rawLang.includes('bengali') || rawLang === 'bn') {
    language = 'bn';
  }

  // Detect Devanagari or non-Latin script characters
  const isOriginalScript = /[\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF]/.test(rawTitle + rawAuthor);

  // 5. Year, Publisher, Provider IDs
  let publicationYear: number | undefined;
  if (book.publication_year) {
    const yr = typeof book.publication_year === 'number'
      ? book.publication_year
      : Number.parseInt(String(book.publication_year), 10);
    if (!Number.isNaN(yr) && yr > 500 && yr <= new Date().getFullYear() + 1) {
      publicationYear = yr;
    }
  }

  const publisher = (book.publisher || '').trim() || undefined;

  // Extract stable provider ID and source URL
  let stableProviderId: string | undefined = book.provider_id || book.gutenberg_id || book.open_library_id;
  const sourceUrl: string | undefined = book.pdf_url || book.source_url;

  if (!stableProviderId && sourceUrl) {
    const gutenbergMatch = sourceUrl.match(/gutenberg\.org\/(?:ebooks|files)\/(\d+)/i);
    if (gutenbergMatch) {
      stableProviderId = `gutenberg-${gutenbergMatch[1]}`;
    } else {
      const archiveMatch = sourceUrl.match(/archive\.org\/download\/([^/]+)/i);
      if (archiveMatch) {
        stableProviderId = `archive-${archiveMatch[1]}`;
      } else {
        const standardEbooksMatch = sourceUrl.match(/standardebooks\.org\/ebooks\/([^/]+)/i);
        if (standardEbooksMatch) {
          stableProviderId = `standardebooks-${standardEbooksMatch[1]}`;
        }
      }
    }
  }

  return {
    id: book.id,
    cleanTitle: titleNorm.cleanTitle,
    normalizedTitleKey,
    subtitle: titleNorm.subtitle,
    editionTag: titleNorm.editionTag,
    volumeTag,
    cleanAuthors,
    primaryAuthor,
    normalizedAuthorKey,
    isbns,
    primaryIsbn: isbns[0],
    language,
    isOriginalScript,
    publicationYear,
    publisher,
    stableProviderId,
    sourceUrl,
    raw: book,
  };
}
