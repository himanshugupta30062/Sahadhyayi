import {
  DuplicateGroup,
  DuplicateRecommendation,
  QualityScoreResult,
  MatchConfidence,
} from '@/types/bookCatalog';
import { evaluateBookQuality, identifyJunkCandidate } from './qualityScoring';
import { normalizeBookIdentity } from './bookIdentity';

/**
 * Recommends the best one or two editions in a duplicate group,
 * backfills missing fields into the primary record, and flags redundant
 * duplicates or junk candidates.
 */
export function recommendBestEditions(group: DuplicateGroup): DuplicateRecommendation {
  const books = group.books || [];
  if (books.length === 0) {
    throw new Error('Cannot recommend editions for an empty group');
  }

  // 1. Evaluate quality score and identity for each book in the group
  const qualityScores: Record<string, QualityScoreResult> = {};
  const ratedBooks = books.map((book) => {
    const id = book.id || `temp-${Math.random()}`;
    const identity = normalizeBookIdentity(book);
    const quality = evaluateBookQuality(book);
    qualityScores[id] = quality;
    const junk = identifyJunkCandidate(book);
    return {
      book,
      id,
      identity,
      quality,
      junk,
    };
  });

  // Sort candidates by quality score descending
  ratedBooks.sort((a, b) => b.quality.score - a.quality.score);

  // 2. Select Primary Book
  const primary = ratedBooks[0];
  const primaryBookId = primary.id;

  const reasonsForRecommendation: string[] = [];
  reasonsForRecommendation.push(
    `Primary edition chosen: "${primary.book.title}" (Score: ${primary.quality.score}/100, Status: ${primary.quality.accessStatus}). ${primary.quality.reasons.slice(0, 2).join(', ')}`
  );

  // 3. Determine if a Secondary Edition is legitimately justified
  // A secondary edition is preserved ONLY if it represents a genuinely distinct edition:
  // e.g. a different language/translation, distinct editionTag (illustrated/annotated),
  // or a distinct publication year with complete content.
  let secondaryBookId: string | undefined;
  const recommendedKeepIds: string[] = [primaryBookId];
  const duplicateIds: string[] = [];
  const archiveCandidateIds: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < ratedBooks.length; i++) {
    const candidate = ratedBooks[i];
    const isDistinctTranslation =
      candidate.identity.language !== primary.identity.language ||
      candidate.identity.isOriginalScript !== primary.identity.isOriginalScript;

    const isDistinctEdition =
      Boolean(candidate.identity.editionTag) &&
      candidate.identity.editionTag !== primary.identity.editionTag;

    const hasSignificantContent = candidate.quality.score >= 50 && !candidate.junk.isJunk;

    if (!secondaryBookId && (isDistinctTranslation || isDistinctEdition) && hasSignificantContent) {
      // Eligible for secondary preservation
      secondaryBookId = candidate.id;
      recommendedKeepIds.push(candidate.id);
      reasonsForRecommendation.push(
        `Secondary edition preserved: "${candidate.book.title}" (Score: ${candidate.quality.score}/100) — Distinct manifestation (${isDistinctTranslation ? 'Translation/language variant' : candidate.identity.editionTag})`
      );
    } else {
      // Considered duplicate or redundant of the kept edition(s)
      duplicateIds.push(candidate.id);

      if (candidate.junk.isJunk || candidate.quality.score < 40) {
        archiveCandidateIds.push(candidate.id);
        warnings.push(
          `Record "${candidate.book.title}" (ID: ${candidate.id}) has low quality (${candidate.quality.score}/100) or missing content; recommended for archive/cleanup.`
        );
      } else {
        archiveCandidateIds.push(candidate.id);
        reasonsForRecommendation.push(
          `Identified redundant edition of "${primary.book.title}" (Score: ${candidate.quality.score}/100); useful metadata will be merged into primary.`
        );
      }
    }
  }

  // 4. Compute proposed merged metadata
  // Backfill non-conflicting fields from duplicates into primary if primary lacks them
  const proposedMergedMetadata: DuplicateRecommendation['proposedMergedMetadata'] = {};
  const primaryBook = primary.book;

  for (const candidate of ratedBooks.slice(1)) {
    const cBook = candidate.book;
    if (!primaryBook.description && cBook.description) {
      proposedMergedMetadata.description = cBook.description;
    }
    if (!primaryBook.cover_image_url && cBook.cover_image_url) {
      proposedMergedMetadata.cover_image_url = cBook.cover_image_url;
    }
    if (!primaryBook.isbn && cBook.isbn) {
      proposedMergedMetadata.isbn = cBook.isbn;
    }
    if (!primaryBook.publication_year && cBook.publication_year) {
      proposedMergedMetadata.publication_year = cBook.publication_year;
    }
    if (!primaryBook.pages && cBook.pages) {
      proposedMergedMetadata.pages = cBook.pages;
    }
    if (!primaryBook.pdf_url && cBook.pdf_url) {
      proposedMergedMetadata.pdf_url = cBook.pdf_url;
    }
    if (!primaryBook.author_bio && cBook.author_bio) {
      proposedMergedMetadata.author_bio = cBook.author_bio;
    }
    if (!primaryBook.genre && cBook.genre) {
      proposedMergedMetadata.genre = cBook.genre;
    }
  }

  // 5. Determine if manual review is required
  const requiresManualReview =
    group.classification === 'possible_duplicate_review' ||
    group.confidence === 'low' ||
    ratedBooks.some((b) => b.identity.cleanAuthors.join(', ') !== primary.identity.cleanAuthors.join(', ') && b.identity.primaryAuthor !== 'Unknown Author');

  if (requiresManualReview) {
    warnings.push('Group contains potential ambiguity; manual review recommended before executing merge.');
  }

  return {
    groupId: group.groupId,
    primaryBookId,
    secondaryBookId,
    recommendedKeepIds,
    duplicateIds,
    archiveCandidateIds,
    identityConfidence: group.confidence,
    classification: group.classification,
    qualityScores,
    reasonsForRecommendation,
    proposedMergedMetadata,
    warnings,
    requiresManualReview,
  };
}

