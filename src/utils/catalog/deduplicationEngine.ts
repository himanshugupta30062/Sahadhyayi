import type { Edition, Work } from '@/types/bookCatalog';
import {
  createCanonicalClusterKey,
  normalizeAuthor,
  normalizeIsbn,
  normalizeTitle,
} from './metadataNormalization';
import { evaluateBookQuality, buildAssetOptions } from './qualityScoring';

export interface JunkIdentificationResult {
  isJunk: boolean;
  reason?: string;
  category?: 'test_or_spam' | 'ghost_empty' | 'corrupt_metadata';
}

/**
 * Detects whether a book record is fake, test spam, or a zero-content ghost.
 */
export function identifyJunkCandidate(book: {
  title?: string | null;
  author?: string | null;
  cover_image_url?: string | null;
  pdf_url?: string | null;
  epub_url?: string | null;
  description?: string | null;
  pages?: number | null;
}): JunkIdentificationResult {
  const title = (book.title || '').trim();
  const author = (book.author || '').trim();
  const desc = (book.description || '').trim();
  const cover = (book.cover_image_url || '').trim();
  const pdf = (book.pdf_url || '').trim();
  const epub = (book.epub_url || '').trim();
  const pages = book.pages || 0;

  // 1. Check for test, placeholder or spam titles
  if (!title || title.length < 2) {
    return { isJunk: true, reason: 'Title is missing or less than 2 characters', category: 'test_or_spam' };
  }

  if (/^(test|testing|asdf|sample|demo|untitled|book\s*\d*|n\/a|null|undefined)$/i.test(title)) {
    return { isJunk: true, reason: `Placeholder title detected: "${title}"`, category: 'test_or_spam' };
  }

  // 2. Check for empty ghost records
  const hasContent = Boolean(pdf || epub);
  const hasVisual = Boolean(cover);
  const hasMetadata = Boolean(desc && desc.length >= 30) || pages > 10;

  if (!hasContent && !hasVisual && !hasMetadata) {
    return {
      isJunk: true,
      reason: 'Empty ghost record: no readable content, no cover, and no descriptive metadata',
      category: 'ghost_empty',
    };
  }

  return { isJunk: false };
}

/**
 * Maps a raw database row or API response into an Edition object.
 */
export function mapRawToEdition(raw: any, sourceProvider?: string): Edition {
  const normTitle = normalizeTitle(raw.title || '');
  const normAuthor = normalizeAuthor(raw.author);
  const normIsbn = normalizeIsbn(raw.isbn);

  const provider = sourceProvider || (raw.pdf_url?.includes('gutenberg') ? 'gutenberg' : raw.cover_image_url?.includes('supabase') ? 'sahadhyayi' : 'open_web');

  const evalResult = evaluateBookQuality({
    title: normTitle.cleanTitle,
    author: normAuthor.normalizedAuthor,
    description: raw.description,
    coverImageUrl: raw.cover_image_url,
    pdfUrl: raw.pdf_url,
    epubUrl: raw.epub_url,
    isbn: normIsbn.isbn13 || normIsbn.isbn10 || raw.isbn,
    publicationYear: raw.publication_year,
    pages: raw.pages,
    genre: raw.genre,
    language: raw.language || 'English',
    sourceProvider: provider,
  });

  const assets = buildAssetOptions(raw.pdf_url, raw.epub_url, provider);

  return {
    id: String(raw.id || raw.isbn || normTitle.cleanTitle),
    workId: createCanonicalClusterKey(normTitle.cleanTitle, normAuthor.normalizedAuthor),
    title: normTitle.cleanTitle,
    subtitle: normTitle.subtitle,
    editionTag: normTitle.editionTag,
    author: normAuthor.normalizedAuthor,
    publisher: raw.publisher,
    publicationYear: raw.publication_year,
    language: raw.language || 'English',
    isbn10: normIsbn.isbn10,
    isbn13: normIsbn.isbn13,
    pages: raw.pages,
    genre: raw.genre,
    description: raw.description,
    coverImageUrl: raw.cover_image_url,
    accessStatus: evalResult.accessStatus,
    licenseEvidence: evalResult.licenseEvidence,
    qualityScore: evalResult.score,
    qualityBreakdown: evalResult.breakdown,
    qualityReasons: evalResult.reasons,
    isPreferredEdition: false,
    whyThisEdition: evalResult.whyThisEdition,
    assets,
    sources: [
      {
        provider,
        providerId: String(raw.id || raw.isbn || ''),
        sourceUrl: raw.pdf_url || raw.cover_image_url || '',
        importedAt: raw.created_at || new Date().toISOString(),
      },
    ],
  };
}

/**
 * Clusters multiple editions into unified Works, selects the best edition as preferred,
 * backfills missing metadata into the preferred edition, and preserves distinct alternatives.
 */
export function clusterEditionsIntoWorks(editions: Edition[]): Work[] {
  const clusterMap = new Map<string, Edition[]>();

  for (const edition of editions) {
    const key = createCanonicalClusterKey(edition.title, edition.author);
    if (!clusterMap.has(key)) {
      clusterMap.set(key, []);
    }
    clusterMap.get(key)!.push(edition);
  }

  const works: Work[] = [];

  for (const [key, cluster] of clusterMap.entries()) {
    // Sort cluster by quality score descending
    cluster.sort((a, b) => b.qualityScore - a.qualityScore);

    // Best edition is the first element
    const preferred = { ...cluster[0], isPreferredEdition: true };
    const alternatives = cluster.slice(1).map(ed => ({ ...ed, isPreferredEdition: false }));

    // Field-level metadata merging: backfill any gaps in the preferred edition
    // from alternatives without overwriting existing high-confidence data
    for (const alt of alternatives) {
      if (!preferred.coverImageUrl && alt.coverImageUrl) {
        preferred.coverImageUrl = alt.coverImageUrl;
      }
      if (!preferred.description && alt.description) {
        preferred.description = alt.description;
      }
      if (!preferred.isbn13 && alt.isbn13) {
        preferred.isbn13 = alt.isbn13;
      }
      if (!preferred.isbn10 && alt.isbn10) {
        preferred.isbn10 = alt.isbn10;
      }
      if (!preferred.publicationYear && alt.publicationYear) {
        preferred.publicationYear = alt.publicationYear;
      }
      if (!preferred.genre && alt.genre) {
        preferred.genre = alt.genre;
      }
      if (!preferred.pages && alt.pages) {
        preferred.pages = alt.pages;
      }
      // Merge unique assets
      for (const asset of alt.assets) {
        if (!preferred.assets.some(a => a.format === asset.format && a.downloadUrl === asset.downloadUrl)) {
          preferred.assets.push(asset);
        }
      }
    }

    works.push({
      id: preferred.id,
      canonicalKey: key,
      canonicalTitle: preferred.title,
      canonicalAuthor: preferred.author,
      language: preferred.language,
      preferredEdition: preferred,
      alternativeEditions: alternatives,
      totalEditionsCount: cluster.length,
    });
  }

  return works;
}

