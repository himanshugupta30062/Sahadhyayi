import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';
import { getCoverQualityScore } from '@/utils/getCoverQualityScore';
import {
  BASE_BOOK_SELECT_COLUMNS,
  detectBookSchemaCapabilities,
  getPublicBookSelectColumns,
  applyPublicBookFilter,
  isBookPubliclyVisible,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';
import { normalizeAuthor, normalizeTitle } from '@/utils/catalog/metadataNormalization';

import type { AccessStatus, LicenseEvidence } from '@/types/bookCatalog';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
  publication_year?: number;
  language?: string;
  pdf_url?: string;
  epub_url?: string;
  created_at: string;
  price?: number;
  rating?: number;
  isbn?: string;
  pages?: number;
  author_bio?: string;
  accessStatus?: AccessStatus;
  licenseEvidence?: LicenseEvidence;
  qualityScore?: number;
  qualityReasons?: string[];
  whyThisEdition?: string;
  isPreferredEdition?: boolean;
  alternativeEditionsCount?: number;
  alternativeEditions?: any[];
  assets?: any[];
  status?: string;
  catalog_status?: string;
}

// Only select columns we actually use — avoids transferring unnecessary data
export const BOOK_SELECT_COLUMNS = BASE_BOOK_SELECT_COLUMNS;

// Sorting rules (displayed to users via SortingInfoTooltip)
export const SORTING_RULES = [
  { label: 'Verified PDF with complete metadata & cover', points: 'Top Tier (10,000+)', priority: 'highest' },
  { label: 'Verified PDF with cover photo', points: 'Tier 2 (8,800+)', priority: 'high' },
  { label: 'Other verified full text with cover (EPUB / HTML)', points: 'Tier 3 (8,200+)', priority: 'high' },
  { label: 'Genuine book with cover & online reader (Google Books, etc.)', points: 'Tier 4 (7,500–7,800)', priority: 'high' },
  { label: 'Genuine book with cover & bibliographic metadata', points: 'Tier 5 (6,200–6,500)', priority: 'medium' },
  { label: 'Genuine book with verified PDF without cover photo', points: 'Tier 6 (4,500–4,700)', priority: 'medium' },
  { label: 'Academic papers, technical reports & preprints', points: 'Demoted (3,200+)', priority: 'demoted' },
  { label: 'Metadata-only records without cover photo', points: 'Bottom (1,500+)', priority: 'low' },
  { label: 'Per-page diversity (max 1 / author & title per page)', points: 'Spread across pages', priority: 'info' },
  { label: 'Tie-breaker', points: 'newest first, then title, then ID', priority: 'info' },
];

/**
 * Evaluates whether a book has a verified, working PDF link.
 * A non-empty pdf_url does NOT automatically count as a verified PDF.
 */
export function isVerifiedPdf(book: any): boolean {
  if (!book) return false;

  // 1. Explicit broken link flags or unverified access status
  if (book.isBrokenLink === true) return false;
  if (book.accessStatus === 'access_unverified') return false;

  // 2. If structured assets exist, check the PDF asset's verification status
  if (Array.isArray(book.assets) && book.assets.length > 0) {
    const pdfAsset = book.assets.find((a: any) => a.format === 'pdf');
    if (pdfAsset) {
      if (pdfAsset.verified === false) return false;
      const url = (pdfAsset.downloadUrl || pdfAsset.readerUrl || '').trim();
      if (!url || url.includes('books.google.') || url.includes('broken') || url.includes('404')) {
        return false;
      }
      return true;
    }
  }

  // 3. Check raw pdf_url
  const pdf = (book.pdf_url || book.pdfUrl || '').trim();
  if (!pdf) return false;

  // Reject Google Books previews masquerading as PDFs
  if (
    book.isGooglePreview ||
    book.accessStatus === 'preview_only' ||
    pdf.includes('books.google.')
  ) {
    return false;
  }

  // Reject invalid, placeholder, or broken link patterns
  if (
    pdf === '#' ||
    pdf.startsWith('javascript:') ||
    pdf.includes('broken') ||
    pdf.includes('404') ||
    pdf.includes('invalid')
  ) {
    return false;
  }

  // Must be a valid HTTP/HTTPS URL or storage path
  if (!/^https?:\/\//i.test(pdf) && !pdf.startsWith('/')) {
    return false;
  }

  // Check verified PDF indicators:
  // - Direct .pdf extension
  // - Or hosted on verified document repository (Supabase, Gutenberg, Open Textbook, OpenStax, Archive.org download, NCERT, DOAB)
  // - Or book.accessStatus indicates verified full text
  const isPdfExtension = /\.pdf(\?|#|$)/i.test(pdf);
  const isTrustedHost =
    pdf.includes('supabase.co') ||
    pdf.includes('gutenberg.org') ||
    pdf.includes('open.umn.edu') ||
    pdf.includes('openstax.org') ||
    pdf.includes('archive.org/download') ||
    pdf.includes('ncert.nic.in') ||
    pdf.includes('doabooks.org');
  const isVerifiedAccessStatus =
    book.accessStatus === 'verified_full_text' ||
    book.accessStatus === 'open_textbook' ||
    book.accessStatus === 'public_domain';

  return isPdfExtension || isTrustedHost || isVerifiedAccessStatus;
}

/**
 * Evaluates whether a book has a valid cover image (not null, empty, or placeholder).
 */
export function hasValidCover(book: any): boolean {
  if (!book) return false;
  const cover = normalizeCoverUrl(book.cover_image_url || book.coverImageUrl);
  if (!cover) return false;
  const lower = cover.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('default') ||
    lower.includes('no-cover') ||
    lower.includes('nocover') ||
    lower === '#' ||
    lower.startsWith('javascript:')
  ) {
    return false;
  }
  return true;
}

/**
 * Evaluates whether a book has complete metadata:
 * title, author, cover, description, language, etc.
 */
export function hasCompleteMetadata(book: any): boolean {
  if (!book) return false;

  // Title: non-empty, length >= 2, not placeholder
  const title = (book.title || '').trim();
  if (!title || title.length < 2 || /^(test|untitled|sample|demo|n\/a|null|undefined)$/i.test(title)) {
    return false;
  }

  // Author: non-empty, not unknown / anonymous
  const author = (book.author || '').trim();
  if (
    !author ||
    author.toLowerCase() === 'unknown author' ||
    author.toLowerCase() === 'unknown' ||
    author.toLowerCase() === 'anonymous'
  ) {
    return false;
  }

  // Cover: valid cover image present and not placeholder
  if (!hasValidCover(book)) {
    return false;
  }

  // Description: meaningful synopsis (>= 20 characters)
  const description = (book.description || '').trim();
  if (!description || description.length < 20) {
    return false;
  }

  // Language: present
  const language = (book.language || '').trim();
  if (!language) {
    return false;
  }

  return true;
}

/**
 * Checks if a book has other verified full-text formats (such as EPUB or official HTML readers).
 */
export function hasOtherVerifiedFullText(book: any): boolean {
  if (!book) return false;
  if (isVerifiedPdf(book)) return false; // Already handled by verified PDF group
  if (book.isBrokenLink === true) return false;
  if (book.accessStatus === 'access_unverified' || book.accessStatus === 'preview_only') return false;

  const epub = (book.epub_url || book.epubUrl || '').trim();
  if (epub && !epub.includes('broken') && !epub.includes('404') && (/^https?:\/\//i.test(epub) || epub.startsWith('/'))) {
    return true;
  }

  if (Array.isArray(book.assets) && book.assets.length > 0) {
    const otherAsset = book.assets.find(
      (a: any) =>
        (a.format === 'epub' || a.format === 'html' || a.format === 'official_reader') &&
        a.verified !== false
    );
    if (otherAsset) {
      const url = (otherAsset.downloadUrl || otherAsset.readerUrl || '').trim();
      if (url && !url.includes('broken') && !url.includes('404')) {
        return true;
      }
    }
  }

  if (book.accessStatus === 'carefully_edited' || book.accessStatus === 'official_reader') {
    return true;
  }

  const pdf = (book.pdf_url || book.pdfUrl || '').trim();
  if (pdf.includes('.epub') || pdf.includes('standardebooks')) {
    return true;
  }

  return false;
}

/**
 * Resource types distinguishing direct download from online reading interfaces.
 */
export type BookResourceType =
  | 'verified_direct_pdf'
  | 'online_reader'
  | 'external_book_page'
  | 'no_reading_resource';

/**
 * Checks if a book has a supported online reader interface (e.g. Google Books preview, Internet Archive reader).
 */
export function isOnlineReader(book: any): boolean {
  if (!book) return false;
  if (isVerifiedPdf(book)) return false;
  if (book.isBrokenLink === true) return false;

  const pdf = (book.pdf_url || book.pdfUrl || '').trim();
  const epub = (book.epub_url || book.epubUrl || '').trim();

  if (Array.isArray(book.assets) && book.assets.length > 0) {
    const readerAsset = book.assets.find(
      (a: any) =>
        (a.format === 'official_reader' || a.format === 'web_reader' || a.format === 'google_preview') &&
        a.verified !== false
    );
    if (readerAsset) {
      const url = (readerAsset.readerUrl || readerAsset.downloadUrl || '').trim();
      if (url && !url.includes('broken') && !url.includes('404')) {
        return true;
      }
    }
  }

  const candidateUrl = pdf || epub;
  if (
    book.isGooglePreview === true ||
    book.accessStatus === 'preview_only' ||
    book.accessStatus === 'official_reader' ||
    candidateUrl.includes('books.google.') ||
    candidateUrl.includes('archive.org/stream') ||
    candidateUrl.includes('archive.org/details') ||
    candidateUrl.includes('openlibrary.org/books') ||
    candidateUrl.includes('hathitrust.org') ||
    candidateUrl.includes('read.amazon.') ||
    candidateUrl.includes('play.google.com/books/reader')
  ) {
    if (
      candidateUrl &&
      candidateUrl !== '#' &&
      !candidateUrl.startsWith('javascript:') &&
      !candidateUrl.includes('broken') &&
      !candidateUrl.includes('404')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates whether a record represents an academic paper, technical report, or non-book document.
 */
export function isNonBookDocument(book: any): boolean {
  if (!book) return false;
  const title = (book.title || '').trim().toLowerCase();
  const author = (book.author || '').trim().toLowerCase();
  const genre = (book.genre || '').trim().toLowerCase();
  const pdf = (book.pdf_url || book.pdfUrl || '').trim().toLowerCase();

  // Document/Report repositories in URL
  if (pdf.includes('/arxiv-') || pdf.includes('nasa_ntrs') || pdf.includes('eparlib.')) {
    return true;
  }

  // Document/Report indicators in title
  if (
    title.startsWith('nasa technical reports') ||
    title.startsWith('nasa-tm-') ||
    title.startsWith('nasa-cr-') ||
    title.startsWith('nasa-sp-') ||
    title.includes('technical report') ||
    title.includes('technical memorandum') ||
    title.includes('technical note') ||
    title.startsWith('cia reading room') ||
    title.startsWith('cia-rdp') ||
    title.startsWith('arxiv:') ||
    title.includes('[arxiv') ||
    title.includes('working paper') ||
    title.includes('conference proceedings') ||
    title.includes('legislative council') ||
    title.includes('lok sabha secretariat') ||
    title.includes('gazette')
  ) {
    return true;
  }

  // Institutional authors for reports & government docs
  if (
    author === 'national aeronautics and space administration' ||
    author === 'nasa' ||
    author === 'nasa technical reports server (ntrs)' ||
    author === 'central intelligence agency' ||
    author === 'cia' ||
    author === 'cia reading room' ||
    author === 'defense technical information center' ||
    author === 'united states government' ||
    author === 'lok sabha secretariat' ||
    author === 'tamil nadu legislative council'
  ) {
    return true;
  }

  // Explicit document genres
  if (
    genre === 'technical report' ||
    genre === 'research paper' ||
    genre === 'academic paper' ||
    genre === 'preprint' ||
    genre === 'government document'
  ) {
    return true;
  }

  return false;
}

/**
 * Classifies the primary digital resource attached to a book defensively.
 */
export function getBookResourceType(book: any): BookResourceType {
  if (!book) return 'no_reading_resource';
  if (book.isBrokenLink === true) return 'no_reading_resource';

  if (isVerifiedPdf(book) || hasOtherVerifiedFullText(book)) {
    return 'verified_direct_pdf';
  }

  if (isOnlineReader(book)) {
    return 'online_reader';
  }

  const pdf = (book.pdf_url || book.pdfUrl || '').trim();
  const epub = (book.epub_url || book.epubUrl || '').trim();
  const candidateUrl = pdf || epub;

  if (
    candidateUrl &&
    candidateUrl !== '#' &&
    !candidateUrl.startsWith('javascript:') &&
    !candidateUrl.includes('broken') &&
    !candidateUrl.includes('404') &&
    (/^https?:\/\//i.test(candidateUrl) || candidateUrl.startsWith('/'))
  ) {
    return 'external_book_page';
  }

  return 'no_reading_resource';
}

/**
 * Checks if a book has an unverified or broken reading link.
 */
export function hasUnverifiedOrBrokenLink(book: any): boolean {
  if (!book) return false;
  if (isVerifiedPdf(book) || hasOtherVerifiedFullText(book)) return false;
  if (book.isBrokenLink === true) return true;
  if (book.accessStatus === 'access_unverified') return true;

  const pdf = (book.pdf_url || book.pdfUrl || '').trim();
  const epub = (book.epub_url || book.epubUrl || '').trim();
  const candidateUrl = pdf || epub;

  if (
    candidateUrl.includes('broken') ||
    candidateUrl.includes('404') ||
    candidateUrl === '#' ||
    candidateUrl.startsWith('javascript:')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a book is metadata-only with no digital full-text access.
 */
export function isMetadataOnly(book: any): boolean {
  if (!book) return false;
  return getBookResourceType(book) === 'no_reading_resource';
}

/**
 * Calculates book ranking score according to the book-first hierarchy:
 * 1. Genuine book + valid cover + complete metadata + verified direct PDF (10,000+)
 * 2. Genuine book + valid cover + verified direct PDF (8,800+)
 * 3. Genuine book + valid cover + other verified full text (EPUB / HTML) (8,200+)
 * 4. Genuine book + valid cover + supported online reader (Google Books, etc.) (7,500–7,800)
 * 5. Genuine book + valid cover + complete bibliographic metadata (6,200–6,500)
 * 6. Genuine book with verified direct PDF without cover photo (4,500–4,700)
 * 7. Academic papers, technical reports & preprints (3,200–3,600)
 * 8. Other incomplete records without cover (1,500–2,400)
 * 9. Empty / ghost records (0+)
 */
export const getBookCompletenessScore = (book: any): number => {
  if (!book) return 0;

  const resourceType = getBookResourceType(book);
  const withCover = hasValidCover(book);
  const completeMeta = hasCompleteMetadata(book);
  const isDoc = isNonBookDocument(book);

  // Determine base tier score
  let baseScore = 0;

  if (isDoc) {
    // Non-book documents (NASA technical reports, CIA papers, preprints)
    baseScore = 3200;
    if (withCover) baseScore += 400;
  } else if (isVerifiedPdf(book)) {
    if (withCover && completeMeta) {
      baseScore = 10000; // Tier 1: Genuine book + valid cover + complete metadata + verified direct PDF
    } else if (withCover) {
      baseScore = 8800;  // Tier 2: Genuine book + valid cover + verified direct PDF
    } else {
      baseScore = 4500;  // Tier 6: Genuine book + verified direct PDF, but NO cover
      if (completeMeta) baseScore += 200;
    }
  } else if (hasOtherVerifiedFullText(book)) {
    if (withCover && completeMeta) {
      baseScore = 8400;  // Tier 3: Verified EPUB / official HTML + valid cover + complete metadata
    } else if (withCover) {
      baseScore = 8200;  // Tier 3: Verified EPUB / official HTML + valid cover
    } else {
      baseScore = 4500;  // Verified format without cover
      if (completeMeta) baseScore += 200;
    }
  } else if (resourceType === 'online_reader') {
    if (withCover) {
      baseScore = 7500;  // Tier 4: Genuine book + valid cover + supported online reader
      if (completeMeta) baseScore += 300; // 7,800
    } else {
      baseScore = 3500;  // Online reader without cover
      if (completeMeta) baseScore += 200;
    }
  } else if (resourceType === 'external_book_page') {
    if (withCover) {
      baseScore = 6000;  // Genuine book + valid cover + external info page
      if (completeMeta) baseScore += 300;
    } else {
      baseScore = 2000;
    }
  } else {
    // resourceType === 'no_reading_resource'
    const title = (book.title || '').trim();
    const desc = (book.description || '').trim();

    if (!withCover && (!desc || desc.length < 20) && (!title || title.length < 3)) {
      baseScore = 0;     // Empty ghost record
    } else if (withCover) {
      baseScore = 6200;  // Tier 5: Genuine book + valid cover + bibliographic metadata
      if (completeMeta) baseScore += 300; // 6,500
    } else {
      baseScore = 1500;  // Metadata-only book without cover
      if (completeMeta) baseScore += 200;
    }
  }

  // Detailed sub-scoring within tier (max 450 points, preserves relative quality within each tier)
  let subScore = 0;

  // Bibliographic metadata (max 140)
  const author = (book.author || '').trim();
  if (author && author.toLowerCase() !== 'unknown author' && author.toLowerCase() !== 'anonymous') {
    subScore += 50;
  }
  const isbn = (book.isbn || '').toString().replace(/[^0-9X]/gi, '');
  if (isbn.length >= 10) {
    subScore += 50;
  }
  const pubYear = book.publication_year || book.publicationYear;
  if (pubYear && pubYear > 1400 && pubYear <= new Date().getFullYear()) {
    subScore += 40;
  }

  // Synopsis, genre, pages, bio (max 130)
  const desc = (book.description || '').trim();
  if (desc.length >= 100) subScore += 40;
  else if (desc.length >= 20) subScore += 20;

  const genre = (book.genre || '').trim();
  if (genre) subScore += 30;

  const pages = book.pages;
  if (pages && pages > 10) subScore += 30;

  if (book.author_bio) subScore += 30;

  // Cover quality (max 60)
  if (withCover) {
    subScore += 30;
    const cover = normalizeCoverUrl(book.cover_image_url || book.coverImageUrl);
    if (cover) {
      subScore += Math.min(30, Math.round(getCoverQualityScore(cover) / 25) * 5);
    }
  }

  // Provenance / QualityScore bonus (max 40)
  if (typeof book.qualityScore === 'number' && book.qualityScore > 0) {
    subScore += Math.min(40, Math.round(book.qualityScore * 0.4));
  }

  return baseScore + subScore;
};

/**
 * Deterministic library book comparator function.
 */
export const compareLibraryBooks = (a: any, b: any): number => {
  const scoreA = getBookCompletenessScore(a);
  const scoreB = getBookCompletenessScore(b);
  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }
  // Tie-breaker 1: newest created_at first
  const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
  const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
  if (dateB !== dateA) {
    return dateB - dateA;
  }
  // Tie-breaker 2: title alphabetical
  const titleA = (a?.title || '').trim().toLowerCase();
  const titleB = (b?.title || '').trim().toLowerCase();
  const titleCompare = titleA.localeCompare(titleB);
  if (titleCompare !== 0) {
    return titleCompare;
  }
  // Tie-breaker 3: ID alphabetical for absolute determinism
  return String(a?.id || '').localeCompare(String(b?.id || ''));
};

export const sortBooksByCompleteness = (books: any[]): any[] => {
  return [...books].sort(compareLibraryBooks);
};

/**
 * Normalizes author key for per-page catalog diversity checks.
 */
export function getAuthorDiversificationKey(author?: string | null, title?: string | null): string {
  if (author) {
    let norm = normalizeAuthor(author).normalizedAuthor.toLowerCase().trim();
    if (norm && norm !== 'unknown author' && norm !== 'unknown' && norm !== 'anonymous') {
      norm = norm.replace(/\b[a-z]\.?\s+/gi, ' ').replace(/\s+/g, ' ').trim();
      return norm;
    }
  }
  if (title) {
    const lower = title.toLowerCase();
    if (lower.startsWith('cia reading room') || lower.startsWith('cia-') || lower.includes('cia reading room')) {
      return 'cia reading room';
    }
    if (lower.startsWith('nasa technical reports')) {
      return 'nasa technical reports';
    }
    if (lower.startsWith('ncert')) {
      return 'ncert';
    }
  }
  return '';
}

/**
 * Normalizes title key for per-page catalog diversity checks.
 */
export function getTitleDiversificationKey(title?: string | null): string {
  if (!title) return '';
  const norm = normalizeTitle(title).cleanTitle.toLowerCase().trim();
  const clean = norm.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  if (clean.startsWith('cia reading room')) {
    return 'cia reading room';
  }
  return clean;
}

/**
 * Distributes books across pages of size `pageSize` such that on any single page,
 * only 1 book of the same author (name) and only 1 book of the same title appears.
 * Subsequent books by the same author/title are deferred to subsequent pages,
 * ensuring rich diversity without deleting, hiding, or altering any book records.
 */
export function diversifyBooksPerPage(sortedBooks: any[], pageSize: number = 12): any[] {
  if (!sortedBooks || sortedBooks.length <= 1) return sortedBooks || [];
  if (pageSize <= 0) return sortedBooks;

  const remaining = [...sortedBooks];
  const diversified: any[] = [];

  while (remaining.length > 0) {
    const pageBooks: any[] = [];
    const seenAuthors = new Set<string>();
    const seenTitles = new Set<string>();
    const deferredForNextPages: any[] = [];

    for (const book of remaining) {
      if (pageBooks.length >= pageSize) {
        deferredForNextPages.push(book);
        continue;
      }

      const aKey = getAuthorDiversificationKey(book.author, book.title);
      const tKey = getTitleDiversificationKey(book.title);

      const hasAuthorCollision = Boolean(aKey && seenAuthors.has(aKey));
      const hasTitleCollision = Boolean(tKey && seenTitles.has(tKey));

      if (hasAuthorCollision || hasTitleCollision) {
        deferredForNextPages.push(book);
      } else {
        pageBooks.push(book);
        if (aKey) seenAuthors.add(aKey);
        if (tKey) seenTitles.add(tKey);
      }
    }

    // If remaining distinct candidates are fewer than pageSize,
    // fill the remaining slots from deferred books so pages are never left incomplete
    while (pageBooks.length < pageSize && deferredForNextPages.length > 0) {
      pageBooks.push(deferredForNextPages.shift()!);
    }

    diversified.push(...pageBooks);
    remaining.length = 0;
    remaining.push(...deferredForNextPages);
  }

  return diversified;
}

const mapBook = (book: any): Book => ({
  id: book.id,
  title: book.title,
  author: book.author || 'Unknown Author',
  genre: book.genre,
  cover_image_url: book.cover_image_url,
  description: book.description,
  publication_year: book.publication_year,
  language: book.language || 'English',
  pdf_url: book.pdf_url,
  created_at: book.created_at,
  price: 0,
  isbn: book.isbn,
  pages: book.pages,
  author_bio: book.author_bio,
  status: book.status,
  catalog_status: book.catalog_status,
});

// Shared cache settings — books don't change often
const CACHE_OPTIONS = {
  staleTime: 5 * 60 * 1000,   // 5 min before refetch
  gcTime: 30 * 60 * 1000,     // 30 min garbage collection
};

/** Fetch all books in paginated batches to avoid Supabase's 1000-row limit */
async function fetchAllBooks(): Promise<Book[]> {
  const caps = await detectBookSchemaCapabilities();
  const columns = getPublicBookSelectColumns(caps);
  const BATCH = 500;
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('books_library')
      .select(columns);

    query = applyPublicBookFilter(query, caps);

    const { data, error } = await query.range(offset, offset + BATCH - 1);

    if (error) {
      // Fallback: If status columns failed on unmigrated database, retry with base columns
      if (caps.hasStatus || caps.hasCatalogStatus) {
        console.warn('fetchAllBooks probe mismatch, falling back to base columns:', error.message);
        let fallbackQuery = supabase
          .from('books_library')
          .select(BASE_BOOK_SELECT_COLUMNS);
        fallbackQuery = applyPublicBookFilter(fallbackQuery, { hasStatus: false, hasCatalogStatus: false, checked: true });
        const fallbackRes = await fallbackQuery.range(offset, offset + BATCH - 1);
        if (fallbackRes.error) throw fallbackRes.error;
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          all.push(...fallbackRes.data);
          offset += BATCH;
          hasMore = fallbackRes.data.length === BATCH;
          continue;
        }
      }
      throw error;
    }
    if (data && data.length > 0) {
      all.push(...data);
      offset += BATCH;
      hasMore = data.length === BATCH;
    } else {
      hasMore = false;
    }
  }

  const visible = filterPublicBooks(all);
  return sortBooksByCompleteness(visible.map(mapBook));
}

export interface Genre {
  id: string;
  name: string;
}

export const useAllLibraryBooks = () => {
  return useQuery({
    queryKey: ['all-library-books'],
    queryFn: fetchAllBooks,
    ...CACHE_OPTIONS,
  });
};

export interface LibraryBookQueryOptions {
  /** Return only catalog records that already have a stored cover URL. */
  requireCover?: boolean;
  /** Optional exact genre filter, used by homepage discovery. */
  genre?: string;
  /** Whether the query is enabled (defaults to true) */
  enabled?: boolean;
}

export const useLibraryBooks = (
  searchQuery?: string,
  limit?: number,
  options: LibraryBookQueryOptions = {}
) => {
  const requireCover = options.requireCover === true;
  const genre = options.genre && options.genre !== 'All' ? options.genre : undefined;
  const enabled = options.enabled !== false;
  const cleanedQuery = (searchQuery || '').replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();

  return useQuery({
    queryKey: ['library-books', cleanedQuery, limit, requireCover, genre ?? 'All'],
    enabled,
    queryFn: async (): Promise<Book[]> => {
      const caps = await detectBookSchemaCapabilities();
      const columns = getPublicBookSelectColumns(caps);

      let query = supabase.from('books_library').select(columns);
      query = applyPublicBookFilter(query, caps);

      // Filter at the database before applying the limit, so homepage discovery
      // does not miss real covers merely because they occur later in the catalog.
      if (requireCover) {
        query = query.not('cover_image_url', 'is', null).neq('cover_image_url', '');
      }
      if (genre) {
        query = query.ilike('genre', genre.trim());
      }
      if (cleanedQuery) {
        query = query.or(
          `title.ilike.%${cleanedQuery}%,author.ilike.%${cleanedQuery}%,genre.ilike.%${cleanedQuery}%`
        );
      }

      if (requireCover) {
        query = query.order('created_at', { ascending: false });
      }
      if (limit) {
        query = query.limit(limit);
      } else if (requireCover) {
        query = query.limit(1000);
      }

      const { data, error } = await query;
      if (error) {
        // Fallback: If full column select fails (e.g. temporary schema or network glitch), try minimal guaranteed columns
        console.warn('Initial books_library query failed, attempting core fallback:', error.message);
        let fallbackQuery = supabase
          .from('books_library')
          .select('id,title,author,genre,cover_image_url,description,pdf_url,created_at');

        fallbackQuery = applyPublicBookFilter(fallbackQuery, { hasStatus: false, hasCatalogStatus: false, checked: true });

        if (requireCover) {
          fallbackQuery = fallbackQuery.not('cover_image_url', 'is', null).neq('cover_image_url', '');
        }
        if (genre) {
          fallbackQuery = fallbackQuery.ilike('genre', genre.trim());
        }
        if (cleanedQuery) {
          fallbackQuery = fallbackQuery.or(
            `title.ilike.%${cleanedQuery}%,author.ilike.%${cleanedQuery}%,genre.ilike.%${cleanedQuery}%`
          );
        }
        if (requireCover) {
          fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
        }
        const fallback = limit
          ? await fallbackQuery.limit(limit)
          : await fallbackQuery.limit(requireCover ? 1000 : 24);

        if (!fallback.error && fallback.data) {
          const visibleFallback = filterPublicBooks(fallback.data);
          return sortBooksByCompleteness(visibleFallback.map(mapBook));
        }
        throw error;
      }
      const visible = filterPublicBooks(data || []);
      return sortBooksByCompleteness(visible.map(mapBook));
    },
    retry: 2,
    ...CACHE_OPTIONS,
  });
};

export const useBooksByGenre = (genre: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async (): Promise<Book[]> => {
      const caps = await detectBookSchemaCapabilities();
      const columns = getPublicBookSelectColumns(caps);

      let query = supabase.from('books_library').select(columns);
      query = applyPublicBookFilter(query, caps);

      if (genre !== 'All') {
        if (genre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else {
          query = query.eq('genre', genre);
        }
      }

      const { data, error } = await query;
      if (error) {
        // Fallback query with core columns
        console.warn('Initial books_by_genre query failed, attempting core fallback:', error.message);
        let fallbackQuery = supabase
          .from('books_library')
          .select('id,title,author,genre,cover_image_url,description,pdf_url,created_at');

        fallbackQuery = applyPublicBookFilter(fallbackQuery, { hasStatus: false, hasCatalogStatus: false, checked: true });

        if (genre !== 'All') {
          fallbackQuery = genre === 'Hindi'
            ? fallbackQuery.eq('language', 'Hindi')
            : fallbackQuery.eq('genre', genre);
        }

        const fallback = await fallbackQuery;
        if (!fallback.error && fallback.data) {
          const visibleFallback = filterPublicBooks(fallback.data);
          return sortBooksByCompleteness(visibleFallback.map(mapBook));
        }
        throw error;
      }
      const visible = filterPublicBooks(data || []);
      return sortBooksByCompleteness(visible.map(mapBook));
    },
    retry: 2,
    ...CACHE_OPTIONS,
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Genre[]> => {
      const caps = await detectBookSchemaCapabilities();
      const cols = caps.hasCatalogStatus || caps.hasStatus
        ? `genre${caps.hasStatus ? ',status' : ''}${caps.hasCatalogStatus ? ',catalog_status' : ''}`
        : 'genre';

      let query = supabase
        .from('books_library')
        .select(cols)
        .not('genre', 'is', null);

      query = applyPublicBookFilter(query, caps);

      const { data, error } = await query;
      if (error) throw error;

      const visible = filterPublicBooks(data || []);
      const uniqueGenres = [...new Set((visible as Array<{ genre: string }>).map(item => item.genre).filter(Boolean))];
      return uniqueGenres.map((genre, index) => ({
        id: index.toString(),
        name: genre as string,
      }));
    },
  });
};
