/**
 * Sahadhyayi Core Book Catalog Data Contract
 * Models the intellectual Work, specific Edition, Asset access options, Source provenance,
 * duplicate clustering, quality evaluation, and admin resolution.
 */

export type AccessStatus =
  | 'verified_full_text'    // Valid, complete, readable book hosted or directly downloadable
  | 'carefully_edited'       // Professionally prepared (e.g. Standard Ebooks)
  | 'open_textbook'          // Peer-reviewed educational textbook (e.g. Open Textbook Library, OpenStax)
  | 'scholarly_oa'           // Scholarly open access (e.g. DOAB, OAPEN)
  | 'public_domain'          // Verified public domain literature (e.g. Gutenberg)
  | 'official_reader'        // Readable via verified official online viewer
  | 'preview_only'           // Limited publisher preview (e.g. Google Books preview)
  | 'borrowing_required'     // Controlled digital lending / borrow required (e.g. Open Library borrow)
  | 'metadata_only'          // Bibliographic record with no readable digital asset
  | 'access_unverified';     // Link or asset exists but availability is unconfirmed

export type LicenseEvidence =
  | 'public_domain'
  | 'cc_by'
  | 'cc_by_sa'
  | 'cc_by_nc'
  | 'cc_by_nc_sa'
  | 'open_access'
  | 'publisher_preview'
  | 'restricted'
  | 'unknown';

export type AssetFormat = 'epub' | 'pdf' | 'html' | 'audio' | 'external_reader';

export interface AssetOption {
  format: AssetFormat;
  downloadUrl?: string;
  readerUrl?: string;
  isDirectDownload: boolean;
  isDirectRead: boolean;
  fileSize?: string;
  verified: boolean;
  sourceProvider: string;
  lastCheckedAt?: string;
}

export interface SourceRecord {
  provider: string;
  providerId: string;
  sourceUrl: string;
  license?: LicenseEvidence;
  importedAt: string;
}

export interface Contributor {
  name: string;
  role: 'author' | 'translator' | 'editor' | 'illustrator';
}

export interface QualityScoreBreakdown {
  contentIntegrity: number;     // max 30 (reflowable EPUB / valid full text vs PDF vs preview)
  bibliographicConfidence: number; // max 20 (ISBN-10/13 check digit, stable IDs)
  verifiedAccess: number;       // max 15 (direct open access vs external viewer)
  editorialAssurance: number;   // max 15 (Standard Ebooks, Open Textbook Library, Gutenberg)
  metadataCompleteness: number; // max 10 (description, pages, year, tags)
  readingUsability: number;     // max 5 (typography, chapter markers, reflowable)
  presentation: number;         // max 5 (valid non-placeholder cover)
  demotions: number;            // negative points
}

export interface Edition {
  id: string;
  workId: string;
  title: string;
  subtitle?: string;
  editionTag?: string;
  author: string;
  contributors?: Contributor[];
  publisher?: string;
  publicationYear?: number;
  editionName?: string;
  language: string;
  originalScript?: string;
  isbn10?: string;
  isbn13?: string;
  pages?: number;
  genre?: string;
  description?: string;
  coverImageUrl?: string;
  accessStatus: AccessStatus;
  licenseEvidence: LicenseEvidence;
  qualityScore: number; // 0 to 100
  qualityBreakdown: QualityScoreBreakdown;
  qualityReasons: string[];
  isPreferredEdition: boolean;
  whyThisEdition?: string;
  assets: AssetOption[];
  sources: SourceRecord[];
}

export interface Work {
  id: string;
  canonicalKey: string;
  canonicalTitle: string;
  canonicalAuthor: string;
  language: string;
  preferredEdition: Edition;
  alternativeEditions: Edition[];
  totalEditionsCount: number;
}

// -------------------------------------------------------------
// DUPLICATE DETECTION & RESOLUTION CONTRACTS
// -------------------------------------------------------------

export interface BookIdentity {
  id?: string;
  cleanTitle: string;
  normalizedTitleKey: string;
  subtitle?: string;
  editionTag?: string;
  volumeTag?: string;
  cleanAuthors: string[];
  primaryAuthor: string;
  normalizedAuthorKey: string;
  isbns: string[]; // Validated ISBN-10 or 13, hyphen-stripped
  primaryIsbn?: string;
  language: string;
  isOriginalScript: boolean;
  publicationYear?: number;
  publisher?: string;
  stableProviderId?: string;
  sourceUrl?: string;
  raw: any;
}

export type DuplicateClassification =
  | 'exact_duplicate_edition'      // Identical ISBN or matching title+author+year+format
  | 'same_work_different_edition'  // Matching title+author but different year/publisher/tag
  | 'translation_variant'          // Same work in different language / translator
  | 'possible_duplicate_review'    // High title similarity but author/details ambiguous
  | 'distinct_work';               // Unique work, not duplicate

export type MatchConfidence = 'high' | 'medium' | 'low';

export interface DuplicateGroup {
  groupId: string;
  clusterKey: string;
  classification: DuplicateClassification;
  confidence: MatchConfidence;
  evidence: string[];
  books: any[]; // The raw or normalized book records in this group
}

export interface QualityEvidence {
  hasReflowableEpub?: boolean;
  hasDirectPdf?: boolean;
  isBrokenLink?: boolean;
  isGooglePreview?: boolean;
  hasValidIsbn?: boolean;
  isPeerReviewed?: boolean;
  provider?: string;
}

export interface QualityScoreResult {
  score: number; // 0 to 100
  confidence: MatchConfidence;
  breakdown: QualityScoreBreakdown;
  reasons: string[];
  accessStatus: AccessStatus;
  licenseEvidence?: LicenseEvidence;
  whyThisEdition?: string;
}

export interface DuplicateRecommendation {
  groupId: string;
  primaryBookId: string;
  secondaryBookId?: string;
  recommendedKeepIds: string[];
  duplicateIds: string[];
  archiveCandidateIds: string[];
  identityConfidence: MatchConfidence;
  classification: DuplicateClassification;
  qualityScores: Record<string, QualityScoreResult>;
  reasonsForRecommendation: string[];
  proposedMergedMetadata: {
    description?: string;
    cover_image_url?: string;
    isbn?: string;
    publication_year?: number;
    pages?: number;
    pdf_url?: string;
    author_bio?: string;
    genre?: string;
  };
  warnings: string[];
  requiresManualReview: boolean;
}

export interface UserReferenceCounts {
  bookshelf: number;
  personalLibrary: number;
  readingProgress: number;
  rooms: number;
  marginNotes: number;
  posts: number;
  total: number;
}

export interface AuditGroupSummary {
  groupId: string;
  clusterTitle: string;
  author: string;
  count: number;
  classification: DuplicateClassification;
  confidence: MatchConfidence;
  recommendedPrimary: {
    id: string;
    title: string;
    author: string;
    qualityScore: number;
    accessStatus: AccessStatus;
    reason: string;
  };
  recommendedSecondary?: {
    id: string;
    title: string;
    author: string;
    qualityScore: number;
    accessStatus: AccessStatus;
    reason: string;
  };
  candidateRecords: Array<{
    id: string;
    title: string;
    author: string;
    isbn?: string;
    publication_year?: number;
    cover_image_url?: string;
    pdf_url?: string;
    qualityScore: number;
    accessStatus: AccessStatus;
    isPrimary: boolean;
    isSecondary: boolean;
    isArchiveCandidate: boolean;
    userReferences: UserReferenceCounts;
    proposedAction: string;
  }>;
  archiveCandidatesCount: number;
  totalUserReferences: number;
  proposedAction: DuplicateResolutionAction;
  requiresManualReview: boolean;
  warnings: string[];
}

export interface LibraryDuplicateAudit {
  totalRecordsScanned: number;
  candidateGroupsCount: number;
  highConfidenceGroupsCount: number;
  ambiguousGroupsCount: number;
  possibleJunkCount: number;
  groups: AuditGroupSummary[];
  summary: {
    potentialRedundantRecords: number;
    averageQualityScore: number;
    executionImpact: {
      booksToArchive: number;
      metadataFieldsToEnrich: number;
      userReferencesToSafelyMigrate: number;
    };
  };
  timestamp: string;
}

export type DuplicateResolutionAction =
  | 'merge_and_archive_duplicates'
  | 'keep_primary_only'
  | 'keep_top_editions'
  | 'keep_separate'
  | 'mark_for_review'
  | 'archive_junk'
  | 'restore_archived_record';

export interface ResolutionOptions {
  dryRun?: boolean;
  reason?: string;
  customPrimaryId?: string;
  customKeepIds?: string[];
  mergeMetadata?: boolean;
}

export interface ResolutionResult {
  success: boolean;
  action: DuplicateResolutionAction;
  groupId: string;
  primaryId?: string;
  archivedBookIds: string[];
  migratedUserReferences: {
    bookshelf: number;
    readingProgress: number;
    rooms: number;
    marginNotes: number;
  };
  mergedFields: string[];
  dryRun: boolean;
  message: string;
}
