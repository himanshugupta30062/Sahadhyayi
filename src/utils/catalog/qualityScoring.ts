import type {
  AccessStatus,
  LicenseEvidence,
  QualityScoreBreakdown,
  QualityScoreResult,
  QualityEvidence,
  MatchConfidence,
  AssetOption,
} from '@/types/bookCatalog';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';

export interface BookEvaluationInput {
  id?: string;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  cover_image_url?: string | null;
  pdfUrl?: string | null;
  pdf_url?: string | null;
  epubUrl?: string | null;
  isbn?: string | null;
  publicationYear?: number | null;
  publication_year?: number | null;
  pages?: number | null;
  genre?: string | null;
  language?: string | null;
  sourceProvider?: string | null;
  licenseEvidence?: LicenseEvidence;
  hasTableOfContents?: boolean;
  isPeerReviewed?: boolean;
  isBrokenLink?: boolean;
  isGooglePreview?: boolean;
}

/**
 * Evaluates book quality against the 100-point rubric:
 * 1. Actual content integrity and readability (30)
 * 2. Correct edition and bibliographic identity (20)
 * 3. Verified access and format reliability (15)
 * 4. Source provenance and editorial assurance (15)
 * 5. Metadata completeness and consistency (10)
 * 6. Reading usability and accessibility (5)
 * 7. Cover accuracy and quality (5)
 * Total: 100
 */
export function evaluateBookQuality(
  input: BookEvaluationInput | any,
  evidence?: QualityEvidence
): QualityScoreResult {
  const reasons: string[] = [];

  const rawTitle = (input.title || '').trim();
  const rawAuthor = (input.author || '').trim();
  const rawDesc = (input.description || '').trim();
  const pdf = input.pdfUrl || input.pdf_url || '';
  const epub = input.epubUrl || '';
  const cover = normalizeCoverUrl(input.coverImageUrl || input.cover_image_url);
  const rawIsbn = (input.isbn || '').toString().trim();
  let provider = (input.sourceProvider || '').toLowerCase();
  if (!provider) {
    if (pdf.includes('standardebooks') || epub.includes('standardebooks')) {
      provider = 'standardebooks';
    } else if (pdf.includes('gutenberg') || epub.includes('gutenberg')) {
      provider = 'gutenberg';
    } else if (pdf.includes('open.umn.edu') || pdf.includes('opentextbook')) {
      provider = 'opentextbook';
    } else if (pdf.includes('openstax')) {
      provider = 'openstax';
    } else if (pdf.includes('archive.org')) {
      provider = 'openlibrary';
    } else if (pdf.includes('books.google.com')) {
      provider = 'google';
    }
  }

  const isBroken = Boolean(evidence?.isBrokenLink || input.isBrokenLink);
  const isGooglePreview = Boolean(
    evidence?.isGooglePreview ||
    input.isGooglePreview ||
    provider.includes('google') ||
    (pdf && pdf.includes('books.google.com'))
  );

  const hasEpubFormat = Boolean(
    epub ||
    pdf.includes('.epub') ||
    pdf.includes('standardebooks') ||
    provider.includes('standardebooks') ||
    evidence?.hasReflowableEpub
  );

  // -------------------------------------------------------------
  // 1. Actual content integrity and readability (max 30 pts)
  // -------------------------------------------------------------
  let contentIntegrity = 0;
  if (isBroken) {
    contentIntegrity = 0;
    reasons.push('Broken or inaccessible content file (0/30)');
  } else if (isGooglePreview) {
    contentIntegrity = 5;
    reasons.push('Publisher snippet/preview only — not complete readable text (5/30)');
  } else if (hasEpubFormat) {
    contentIntegrity = 30;
    reasons.push('Verified reflowable EPUB with structural chapter hierarchy (+30)');
  } else if (pdf) {
    if (pdf.includes('gutenberg') || pdf.includes('open.umn.edu') || pdf.includes('openstax') || pdf.includes('supabase')) {
      contentIntegrity = 25;
      reasons.push('Verified complete full-text digital document (+25)');
    } else if (pdf.includes('archive.org')) {
      contentIntegrity = 20;
      reasons.push('Historical digital scan from Internet Archive (+20)');
    } else {
      contentIntegrity = 18;
      reasons.push('Direct document download link present (+18)');
    }
  } else {
    contentIntegrity = 0;
    reasons.push('No readable digital content file attached (0/30)');
  }

  // -------------------------------------------------------------
  // 2. Correct edition and bibliographic identity (max 20 pts)
  // -------------------------------------------------------------
  let bibliographicConfidence = 0;
  if (rawAuthor && rawAuthor.toLowerCase() !== 'unknown author' && rawAuthor.toLowerCase() !== 'anonymous') {
    bibliographicConfidence += 8;
    reasons.push('Verified author attribution (+8)');
  } else {
    reasons.push('Missing or anonymous contributor (0/8)');
  }

  const cleanIsbnDigits = rawIsbn.replace(/[^0-9X]/gi, '');
  if (cleanIsbnDigits.length === 10 || cleanIsbnDigits.length === 13) {
    bibliographicConfidence += 7;
    reasons.push('Valid international identifier (ISBN) present (+7)');
  }

  const pubYear = input.publicationYear || input.publication_year;
  if (pubYear && pubYear > 1400 && pubYear <= new Date().getFullYear()) {
    bibliographicConfidence += 3;
    reasons.push(`Specific publication year (${pubYear}) (+3)`);
  }

  if (rawTitle.length >= 2 && !/^(test|sample|untitled)/i.test(rawTitle)) {
    bibliographicConfidence += 2;
  }

  // -------------------------------------------------------------
  // 3. Verified access and format reliability (max 15 pts)
  // -------------------------------------------------------------
  let verifiedAccess = 0;
  if (isBroken) {
    verifiedAccess = 0;
  } else if (epub || (pdf && !isGooglePreview)) {
    verifiedAccess = 15;
    reasons.push('Immediate direct open access without paywall or login (+15)');
  } else if (isGooglePreview) {
    verifiedAccess = 4;
    reasons.push('Restricted external preview reader (+4)');
  } else {
    verifiedAccess = 0;
    reasons.push('Access unverified / no direct stream (0/15)');
  }

  // -------------------------------------------------------------
  // 4. Source provenance and editorial assurance (max 15 pts)
  // -------------------------------------------------------------
  let editorialAssurance = 0;
  if (provider.includes('standardebooks')) {
    editorialAssurance = 15;
    reasons.push('Curated, proofread and typographically designed by Standard Ebooks (+15)');
  } else if (provider.includes('opentextbook') || evidence?.isPeerReviewed || input.isPeerReviewed || provider.includes('openstax')) {
    editorialAssurance = 14;
    reasons.push('Peer-reviewed open educational curriculum (+14)');
  } else if (provider.includes('doab') || provider.includes('oapen')) {
    editorialAssurance = 13;
    reasons.push('Scholarly peer-reviewed academic monograph (+13)');
  } else if (provider.includes('gutenberg') || (pdf && pdf.includes('gutenberg'))) {
    editorialAssurance = 12;
    reasons.push('Project Gutenberg public-domain proofread text (+12)');
  } else if (provider.includes('openlibrary') || (pdf && pdf.includes('archive.org'))) {
    editorialAssurance = 9;
    reasons.push('Trusted open community library archive (+9)');
  } else {
    editorialAssurance = 4;
    reasons.push('General open source provider (+4)');
  }

  // -------------------------------------------------------------
  // 5. Metadata completeness and consistency (max 10 pts)
  // -------------------------------------------------------------
  let metadataCompleteness = 0;
  if (rawDesc && rawDesc.length >= 100) {
    metadataCompleteness += 4;
    reasons.push('Comprehensive synopsis (+4)');
  } else if (rawDesc) {
    metadataCompleteness += 2;
  }

  const genre = input.genre || '';
  if (genre.trim()) {
    metadataCompleteness += 2;
    reasons.push('Categorized subject/genre (+2)');
  }

  const pages = input.pages;
  if (pages && pages > 10) {
    metadataCompleteness += 2;
    reasons.push(`Verified page count (${pages} pp) (+2)`);
  }

  if (pubYear) {
    metadataCompleteness += 2;
  }

  // -------------------------------------------------------------
  // 6. Reading usability and accessibility (max 5 pts)
  // -------------------------------------------------------------
  let readingUsability = 0;
  if (epub || provider.includes('standardebooks') || evidence?.hasReflowableEpub) {
    readingUsability = 5;
    reasons.push('Reflowable fonts, chapter markers and responsive layout (+5)');
  } else if (pdf && !isGooglePreview) {
    readingUsability = 3;
    reasons.push('Standard pagination with fixed layout (+3)');
  } else if (isGooglePreview) {
    readingUsability = 1;
  }

  // -------------------------------------------------------------
  // 7. Cover accuracy and quality (max 5 pts)
  // -------------------------------------------------------------
  let presentation = 0;
  if (cover && !cover.includes('placeholder') && !cover.includes('default')) {
    if (cover.includes('-L.jpg') || cover.includes('supabase') || cover.includes('standardebooks') || cover.startsWith('http')) {
      presentation = 5;
      reasons.push('Verified high-resolution cover artwork (+5)');
    } else {
      presentation = 3;
      reasons.push('Standard cover image (+3)');
    }
  } else {
    reasons.push('No cover artwork (0/5)');
  }

  // -------------------------------------------------------------
  // Demotions & Eligibility Caps
  // -------------------------------------------------------------
  let demotions = 0;

  // Completely empty ghost record
  if (!cover && !pdf && !epub && (!rawDesc || rawDesc.length < 20)) {
    demotions += 40;
    reasons.push('Ghost record penalty: missing file, cover and description (-40)');
  }

  // Broken link penalty
  if (isBroken) {
    demotions += 35;
    reasons.push('Broken asset demotion (-35)');
  }

  // Calculate preliminary score
  const rawScore =
    contentIntegrity +
    bibliographicConfidence +
    verifiedAccess +
    editorialAssurance +
    metadataCompleteness +
    readingUsability +
    presentation -
    demotions;

  let finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Strict Cap: Previews can NEVER exceed 45/100
  if (isGooglePreview && finalScore > 45) {
    finalScore = 45;
    reasons.push('Score capped at 45: Preview-only access cannot masquerade as full ebook');
  }

  // Strict Cap: Broken links cannot exceed 35/100
  if (isBroken && finalScore > 35) {
    finalScore = 35;
    reasons.push('Score capped at 35: Inaccessible or broken link');
  }

  // Determine AccessStatus
  let accessStatus: AccessStatus = 'access_unverified';
  if (isBroken) {
    accessStatus = 'access_unverified';
  } else if (isGooglePreview) {
    accessStatus = 'preview_only';
  } else if (provider.includes('standardebooks')) {
    accessStatus = 'carefully_edited';
  } else if (provider.includes('opentextbook') || provider.includes('openstax')) {
    accessStatus = 'open_textbook';
  } else if (provider.includes('doab') || provider.includes('oapen')) {
    accessStatus = 'scholarly_oa';
  } else if (provider.includes('gutenberg') || (pdf && pdf.includes('gutenberg'))) {
    accessStatus = 'public_domain';
  } else if (pdf || epub) {
    accessStatus = 'verified_full_text';
  } else {
    accessStatus = 'metadata_only';
  }

  let licenseEvidence: LicenseEvidence = input.licenseEvidence || 'unknown';
  if (provider.includes('standardebooks') || provider.includes('gutenberg')) {
    licenseEvidence = 'public_domain';
  } else if (
    provider.includes('openstax') ||
    provider.includes('opentextbook') ||
    provider.includes('doab') ||
    input.isPeerReviewed ||
    evidence?.isPeerReviewed
  ) {
    licenseEvidence = 'open_access';
  } else if (isGooglePreview) {
    licenseEvidence = 'publisher_preview';
  } else if (pdf || epub) {
    licenseEvidence = 'open_access';
  }

  const whyThisEdition =
    reasons.length > 0 ? reasons.slice(0, 2).join('; ') : 'Complete catalog edition';

  let confidence: MatchConfidence = 'high';
  if (isBroken || (!pdf && !epub) || isGooglePreview) {
    confidence = 'low';
  } else if (!cleanIsbnDigits && !pubYear) {
    confidence = 'medium';
  }

  const breakdown: QualityScoreBreakdown = {
    contentIntegrity,
    bibliographicConfidence,
    verifiedAccess,
    editorialAssurance,
    metadataCompleteness,
    readingUsability,
    presentation,
    demotions,
  };

  return {
    score: finalScore,
    confidence,
    breakdown,
    reasons,
    accessStatus,
    licenseEvidence,
    whyThisEdition,
  };
}

/**
 * Builds array of asset options from format links
 */
export function buildAssetOptions(
  pdfUrl?: string | null,
  epubUrl?: string | null,
  sourceProvider: string = 'open_web'
): AssetOption[] {
  const assets: AssetOption[] = [];
  if (epubUrl) {
    assets.push({
      format: 'epub',
      downloadUrl: epubUrl,
      readerUrl: epubUrl,
      isDirectDownload: true,
      isDirectRead: true,
      verified: true,
      sourceProvider,
    });
  }
  if (pdfUrl) {
    const isGoogle = pdfUrl.includes('books.google.com');
    assets.push({
      format: 'pdf',
      downloadUrl: isGoogle ? undefined : pdfUrl,
      readerUrl: pdfUrl,
      isDirectDownload: !isGoogle,
      isDirectRead: true,
      verified: !isGoogle,
      sourceProvider,
    });
  }
  return assets;
}

/**
 * Convenience wrapper returning numeric score (for backward compatibility)
 */
export function calculateQualityScore(input: BookEvaluationInput | any): number {
  return evaluateBookQuality(input).score;
}

/**
 * Identifies if a book is a junk candidate (unusable placeholder or spam)
 */
export function identifyJunkCandidate(book: any): { isJunk: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const title = (book.title || '').trim().toLowerCase();
  const author = (book.author || '').trim().toLowerCase();
  const pdf = book.pdf_url || book.pdfUrl;
  const epub = book.epubUrl;
  const desc = book.description;
  const cover = book.cover_image_url || book.coverImageUrl;

  if (!title || title === 'untitled' || title === 'test' || title === 'sample') {
    reasons.push('Missing or placeholder title');
  }

  if (!author || author === 'unknown' || author === 'unknown author') {
    if (!pdf && !epub) {
      reasons.push('Anonymous author with no readable file');
    }
  }

  if (!pdf && !epub && !desc && !cover) {
    reasons.push('Completely empty ghost record with no digital assets or metadata');
  }

  return {
    isJunk: reasons.length >= 2 || (!pdf && !epub && !desc && !cover),
    reasons,
  };
}
