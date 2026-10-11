/**
 * Sahadhyayi Core Book Catalog Data Contract
 * Models the intellectual Work, specific Edition, Asset access options, and Source provenance.
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
  contentIntegrity: number;     // max 25
  bibliographicConfidence: number; // max 20
  editorialAssurance: number;   // max 15
  metadataCompleteness: number; // max 15
  readingAccess: number;        // max 10
  rightsProvenance: number;     // max 10
  presentation: number;         // max 5
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
