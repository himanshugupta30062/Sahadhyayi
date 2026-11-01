import { supabase } from '@/integrations/supabase/client-universal';
import {
  LibraryDuplicateAudit,
  AuditGroupSummary,
  UserReferenceCounts,
  DuplicateResolutionAction,
} from '@/types/bookCatalog';
import { detectDuplicateGroups } from './duplicateDetection';
import { recommendBestEditions } from './editionRecommendation';
import { identifyJunkCandidate } from './qualityScoring';

/**
 * Fetches user reference counts for a list of book IDs from Supabase
 */
async function fetchUserReferenceCounts(bookIds: string[]): Promise<Record<string, UserReferenceCounts>> {
  const result: Record<string, UserReferenceCounts> = {};
  for (const id of bookIds) {
    result[id] = {
      bookshelf: 0,
      personalLibrary: 0,
      readingProgress: 0,
      rooms: 0,
      marginNotes: 0,
      posts: 0,
      total: 0,
    };
  }

  if (bookIds.length === 0) return result;

  try {
    // 1. user_bookshelf
    const { data: shelfData } = await supabase
      .from('user_bookshelf')
      .select('book_id')
      .in('book_id', bookIds);

    if (shelfData) {
      for (const row of shelfData) {
        if (result[row.book_id]) {
          result[row.book_id].bookshelf++;
          result[row.book_id].total++;
        }
      }
    }

    // 2. reading_progress
    const { data: progressData } = await supabase
      .from('reading_progress')
      .select('book_id')
      .in('book_id', bookIds);

    if (progressData) {
      for (const row of progressData) {
        if (row.book_id && result[row.book_id]) {
          result[row.book_id].readingProgress++;
          result[row.book_id].total++;
        }
      }
    }

    // 3. reading_rooms
    const { data: roomData } = await supabase
      .from('reading_rooms')
      .select('book_id')
      .in('book_id', bookIds);

    if (roomData) {
      for (const row of roomData) {
        if (row.book_id && result[row.book_id]) {
          result[row.book_id].rooms++;
          result[row.book_id].total++;
        }
      }
    }

    // 4. margin_notes
    const { data: notesData } = await supabase
      .from('margin_notes')
      .select('book_id')
      .in('book_id', bookIds);

    if (notesData) {
      for (const row of notesData) {
        if (row.book_id && result[row.book_id]) {
          result[row.book_id].marginNotes++;
          result[row.book_id].total++;
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch dependent user references for books:', err);
  }

  return result;
}

/**
 * Scans catalog records and produces a comprehensive read-only duplicate audit report.
 * Dynamically computes all counts, match evidence, and proposed cleanup impact.
 */
export async function generateLibraryDuplicateAudit(
  providedBooks?: any[]
): Promise<LibraryDuplicateAudit> {
  let booksToAudit: any[] = [];

  if (providedBooks && providedBooks.length > 0) {
    booksToAudit = providedBooks;
  } else {
    // Fetch all active books from Supabase in safe paginated batches
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('books_library')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('Error fetching catalog books for audit:', error);
        break;
      }

      if (data && data.length > 0) {
        booksToAudit.push(...data);
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }
  }

  const totalRecordsScanned = booksToAudit.length;
  if (totalRecordsScanned === 0) {
    return {
      totalRecordsScanned: 0,
      candidateGroupsCount: 0,
      highConfidenceGroupsCount: 0,
      ambiguousGroupsCount: 0,
      possibleJunkCount: 0,
      groups: [],
      summary: {
        potentialRedundantRecords: 0,
        averageQualityScore: 0,
        executionImpact: {
          booksToArchive: 0,
          metadataFieldsToEnrich: 0,
          userReferencesToSafelyMigrate: 0,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // 1. Detect Duplicate Groups
  const rawGroups = detectDuplicateGroups(booksToAudit);

  // Filter only groups that have 2 or more books (candidate duplicate groups)
  const duplicateCandidateGroups = rawGroups.filter((g) => g.books.length > 1);

  // Extract all book IDs involved in duplicate groups for reference lookup
  const duplicateBookIds = duplicateCandidateGroups.flatMap((g) =>
    g.books.map((b) => b.id).filter(Boolean)
  );

  const referenceMap = await fetchUserReferenceCounts(duplicateBookIds);

  // 2. Build recommendations and summaries for each group
  const groupSummaries: AuditGroupSummary[] = [];
  let possibleJunkCount = 0;
  let totalRedundant = 0;
  let totalQualityScoreSum = 0;
  let totalFieldsToEnrich = 0;
  let totalReferencesToMigrate = 0;

  for (const group of duplicateCandidateGroups) {
    const rec = recommendBestEditions(group);
    const candidateRecords = group.books.map((b) => {
      const id = b.id;
      const qScore = rec.qualityScores[id] || { score: 0, accessStatus: 'metadata_only' as const };
      const isPrimary = id === rec.primaryBookId;
      const isSecondary = id === rec.secondaryBookId;
      const isArchiveCandidate = rec.archiveCandidateIds.includes(id);
      const userRefs = referenceMap[id] || {
        bookshelf: 0,
        personalLibrary: 0,
        readingProgress: 0,
        rooms: 0,
        marginNotes: 0,
        posts: 0,
        total: 0,
      };

      const junkCheck = identifyJunkCandidate(b);
      if (junkCheck.isJunk) {
        possibleJunkCount++;
      }

      totalQualityScoreSum += qScore.score;

      let proposedAction = 'Keep as primary';
      if (isSecondary) proposedAction = 'Preserve as alternative edition';
      else if (junkCheck.isJunk) proposedAction = 'Archive as junk placeholder';
      else if (isArchiveCandidate) proposedAction = 'Merge & archive redundant record';

      if (!isPrimary && !isSecondary) {
        totalReferencesToMigrate += userRefs.total;
      }

      return {
        id,
        title: b.title,
        author: b.author || 'Unknown Author',
        isbn: b.isbn,
        publication_year: b.publication_year,
        cover_image_url: b.cover_image_url,
        pdf_url: b.pdf_url,
        qualityScore: qScore.score,
        accessStatus: qScore.accessStatus,
        isPrimary,
        isSecondary,
        isArchiveCandidate,
        userReferences: userRefs,
        proposedAction,
      };
    });

    const primaryRecord = candidateRecords.find((c) => c.isPrimary) || candidateRecords[0];
    const secondaryRecord = candidateRecords.find((c) => c.isSecondary);

    const groupReferencesTotal = candidateRecords.reduce(
      (sum, c) => sum + c.userReferences.total,
      0
    );

    totalRedundant += rec.archiveCandidateIds.length;
    totalFieldsToEnrich += Object.keys(rec.proposedMergedMetadata).length;

    let proposedGroupAction = rec.archiveCandidateIds.length > 0
      ? 'merge_and_archive_duplicates' as const
      : 'keep_top_editions' as const;

    if (rec.requiresManualReview) {
      proposedGroupAction = 'mark_for_review' as const;
    }

    groupSummaries.push({
      groupId: group.groupId,
      clusterTitle: primaryRecord.title,
      author: primaryRecord.author,
      count: candidateRecords.length,
      classification: group.classification,
      confidence: group.confidence,
      recommendedPrimary: {
        id: primaryRecord.id,
        title: primaryRecord.title,
        author: primaryRecord.author,
        qualityScore: primaryRecord.qualityScore,
        accessStatus: primaryRecord.accessStatus,
        reason: rec.reasonsForRecommendation[0] || 'Highest verified quality edition',
      },
      recommendedSecondary: secondaryRecord
        ? {
            id: secondaryRecord.id,
            title: secondaryRecord.title,
            author: secondaryRecord.author,
            qualityScore: secondaryRecord.qualityScore,
            accessStatus: secondaryRecord.accessStatus,
            reason: rec.reasonsForRecommendation[1] || 'Distinct translated/edition variant',
          }
        : undefined,
      candidateRecords,
      archiveCandidatesCount: rec.archiveCandidateIds.length,
      totalUserReferences: groupReferencesTotal,
      proposedAction: proposedGroupAction,
      requiresManualReview: rec.requiresManualReview,
      warnings: rec.warnings,
    });
  }

  // 3. Sort groups in Dashboard Priority Order:
  // 1. High-confidence groups with many redundant records
  // 2. Clear primary superiority (large score difference)
  // 3. Groups containing broken/suspicious assets
  // 4. Ambiguous groups requiring manual judgment
  // 5. Low-priority groups
  groupSummaries.sort((a, b) => {
    // High-confidence with multiple redundant records first
    const scoreA =
      (a.confidence === 'high' ? 100 : a.confidence === 'medium' ? 50 : 10) +
      a.archiveCandidatesCount * 20 -
      (a.requiresManualReview ? 30 : 0);
    const scoreB =
      (b.confidence === 'high' ? 100 : b.confidence === 'medium' ? 50 : 10) +
      b.archiveCandidatesCount * 20 -
      (b.requiresManualReview ? 30 : 0);
    return scoreB - scoreA;
  });

  const highConfidenceGroupsCount = groupSummaries.filter((g) => g.confidence === 'high').length;
  const ambiguousGroupsCount = groupSummaries.filter((g) => g.requiresManualReview).length;
  const totalAuditedRecords = duplicateCandidateGroups.reduce((acc, g) => acc + g.books.length, 0);
  const averageQualityScore = totalAuditedRecords > 0
    ? Math.round(totalQualityScoreSum / totalAuditedRecords)
    : 0;

  return {
    totalRecordsScanned,
    candidateGroupsCount: groupSummaries.length,
    highConfidenceGroupsCount,
    ambiguousGroupsCount,
    possibleJunkCount,
    groups: groupSummaries,
    summary: {
      potentialRedundantRecords: totalRedundant,
      averageQualityScore,
      executionImpact: {
        booksToArchive: totalRedundant,
        metadataFieldsToEnrich: totalFieldsToEnrich,
        userReferencesToSafelyMigrate: totalReferencesToMigrate,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

