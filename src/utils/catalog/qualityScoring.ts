import type {
  AccessStatus,
  AssetOption,
  Edition,
  LicenseEvidence,
  QualityScoreBreakdown,
} from '@/types/bookCatalog';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';

export interface QualityEvaluationResult {
  score: number;
  breakdown: QualityScoreBreakdown;
  accessStatus: AccessStatus;
  licenseEvidence: LicenseEvidence;
  reasons: string[];
  whyThisEdition: string;
}

export interface BookEvaluationInput {
  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  pdfUrl?: string | null;
  epubUrl?: string | null;
  isbn?: string | null;
  publicationYear?: number | null;
  pages?: number | null;
  genre?: string | null;
  language?: string | null;
  sourceProvider?: string | null;
  licenseEvidence?: LicenseEvidence;
  hasTableOfContents?: boolean;
  isPeerReviewed?: boolean;
}

/**
 * Evaluates book quality against the 100-point transparent rubric.
 * Every score component is justified with explicit reason codes.
 */
export function evaluateBookQuality(input: BookEvaluationInput): QualityEvaluationResult {
  const reasons: string[] = [];
  const whyReasons: string[] = [];

  const provider = (input.sourceProvider || '').toLowerCase();
  const pdf = input.pdfUrl || '';
  const epub = input.epubUrl || '';
  const cover = normalizeCoverUrl(input.coverImageUrl);
  const title = (input.title || '').trim();
  const author = (input.author || '').trim();
  const desc = (input.description || '').trim();

  // -------------------------------------------------------------
  // A. Content integrity and readability (max 25 pts)
  // -------------------------------------------------------------
  let contentIntegrity = 0;
  if (epub || provider.includes('standardebooks')) {
    contentIntegrity = 25;
    reasons.push('Verified reflowable EPUB with structural chapter hierarchy (+25)');
    whyReasons.push('clean typography and reflowable chapter navigation');
  } else if (pdf.includes('supabase') || pdf.includes('gutenberg') || pdf.includes('open.umn.edu') || pdf.includes('openstax')) {
    contentIntegrity = 20;
    reasons.push('Verified complete full-text PDF document (+20)');
    whyReasons.push('complete digital document with verified text');
  } else if (pdf.includes('archive.org')) {
    contentIntegrity = 14;
    reasons.push('Historical digitized text scan from Internet Archive (+14)');
    whyReasons.push('complete historical digital scan');
  } else if (provider.includes('google') || (pdf && pdf.includes('google'))) {
    contentIntegrity = 4;
    reasons.push('Publisher preview only — partial reading link (+4)');
  } else if (pdf) {
    contentIntegrity = 12;
    reasons.push('Direct download link present (+12)');
  } else {
    reasons.push('No readable digital content file found (0/25)');
  }

  // -------------------------------------------------------------
  // B. Edition correctness and bibliographic confidence (max 20 pts)
  // -------------------------------------------------------------
  let bibliographicConfidence = 0;
  if (author && author.toLowerCase() !== 'unknown author' && author.toLowerCase() !== 'anonymous') {
    bibliographicConfidence += 8;
    reasons.push('Verified contributor attribution (+8)');
  } else {
    reasons.push('Missing or uncredited author (0/8)');
  }

  if (input.isbn && input.isbn.replace(/[-\s]/g, '').length >= 10) {
    bibliographicConfidence += 6;
    reasons.push('Standard international identifier (ISBN) present (+6)');
  }

  if (input.publicationYear && input.publicationYear > 1400 && input.publicationYear <= new Date().getFullYear()) {
    bibliographicConfidence += 4;
    reasons.push(`Specific publication year (${input.publicationYear}) recorded (+4)`);
  }

  if (title.length >= 2 && !/^(test|sample|untitled)/i.test(title)) {
    bibliographicConfidence += 2;
  }

  // -------------------------------------------------------------
  // C. Editorial or scholarly assurance (max 15 pts)
  // -------------------------------------------------------------
  let editorialAssurance = 0;
  if (provider.includes('standardebooks')) {
    editorialAssurance = 15;
    reasons.push('Professionally edited & proofread by Standard Ebooks (+15)');
    whyReasons.push('curated proofreading and typographic standards');
  } else if (provider.includes('opentextbook') || input.isPeerReviewed || provider.includes('openstax')) {
    editorialAssurance = 14;
    reasons.push('Peer-reviewed open educational curriculum (+14)');
    whyReasons.push('peer-reviewed academic quality');
  } else if (provider.includes('doab') || provider.includes('oapen')) {
    editorialAssurance = 13;
    reasons.push('Scholarly open-access monograph from academic press (+13)');
    whyReasons.push('published by a recognized academic press');
  } else if (provider.includes('gutenberg')) {
    editorialAssurance = 10;
    reasons.push('Project Gutenberg proofread public-domain text (+10)');
    whyReasons.push('proven public-domain text integrity');
  } else if (provider.includes('openlibrary')) {
    editorialAssurance = 7;
    reasons.push('Community-verified bibliographic record from Open Library (+7)');
  } else {
    editorialAssurance = 3;
    reasons.push('General open source record (+3)');
  }

  // -------------------------------------------------------------
  // D. Metadata completeness and accuracy (max 15 pts)
  // -------------------------------------------------------------
  let metadataCompleteness = 0;
  if (desc && desc.length >= 100) {
    metadataCompleteness += 6;
    reasons.push('Comprehensive book description and synopsis (+6)');
  } else if (desc) {
    metadataCompleteness += 2;
  }

  if (cover) {
    metadataCompleteness += 5;
    reasons.push('High-resolution verified cover image (+5)');
  }

  if (input.genre && input.genre.trim()) {
    metadataCompleteness += 2;
    reasons.push('Categorized genre and subjects (+2)');
  }

  if (input.pages && input.pages > 10) {
    metadataCompleteness += 2;
    reasons.push(`Verified pagination (${input.pages} pages) (+2)`);
  }

  // -------------------------------------------------------------
  // E. Reading access and usability (max 10 pts)
  // -------------------------------------------------------------
  let readingAccess = 0;
  if (epub || provider.includes('standardebooks')) {
    readingAccess = 10;
    reasons.push('Seamless embedded reader with TOC & offline export (+10)');
  } else if (pdf) {
    readingAccess = 7;
    reasons.push('Direct in-browser reading & downloadable PDF (+7)');
  } else if (provider.includes('google')) {
    readingAccess = 3;
    reasons.push('External web preview reader (+3)');
  }

  // -------------------------------------------------------------
  // F. Rights and provenance clarity (max 10 pts)
  // -------------------------------------------------------------
  let rightsProvenance = 0;
  let license: LicenseEvidence = input.licenseEvidence || 'unknown';

  if (provider.includes('standardebooks') || provider.includes('gutenberg')) {
    rightsProvenance = 10;
    license = 'public_domain';
    reasons.push('Confirmed Public Domain work with verified rights (+10)');
  } else if (provider.includes('openstax') || provider.includes('opentextbook') || provider.includes('doab')) {
    rightsProvenance = 10;
    license = 'open_access';
    reasons.push('Confirmed Open Access / Creative Commons educational license (+10)');
  } else if (pdf.includes('archive.org')) {
    rightsProvenance = 7;
    license = 'public_domain';
    reasons.push('Historical archive digital scan (+7)');
  } else if (provider.includes('google')) {
    rightsProvenance = 4;
    license = 'publisher_preview';
    reasons.push('Publisher authorized preview only (+4)');
  } else {
    rightsProvenance = 2;
    license = 'unknown';
    reasons.push('Rights provenance unverified (2/10)');
  }

  // -------------------------------------------------------------
  // G. Presentation and accessibility (max 5 pts)
  // -------------------------------------------------------------
  let presentation = 0;
  if (cover && (cover.includes('-L.jpg') || cover.includes('supabase') || cover.includes('standardebooks'))) {
    presentation += 3;
    reasons.push('High-definition cover presentation (+3)');
  } else if (cover) {
    presentation += 1;
  }

  if (input.hasTableOfContents || provider.includes('standardebooks') || epub) {
    presentation += 2;
    reasons.push('Structured semantic navigation (+2)');
  }

  // -------------------------------------------------------------
  // Demotions & penalties
  // -------------------------------------------------------------
  let demotions = 0;

  // NCERT / CBSE school syllabus dumps
  const isNcertOrCbse =
    /ncert|cbse/i.test(title) ||
    /ncert|cbse/i.test(author) ||
    /ncert|cbse/i.test(desc) ||
    /ncert|cbse/i.test(input.genre || '');

  if (isNcertOrCbse) {
    demotions += 40;
    reasons.push('NCERT/CBSE school textbook dump demoted (-40)');
  }

  // Completely empty ghost record
  if (!cover && !pdf && !epub && (!desc || desc.length < 20)) {
    demotions += 30;
    reasons.push('Empty record penalty: no cover, no text, and no synopsis (-30)');
  }

  // Raw score calculation
  const rawScore =
    contentIntegrity +
    bibliographicConfidence +
    editorialAssurance +
    metadataCompleteness +
    readingAccess +
    rightsProvenance +
    presentation -
    demotions;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Derive AccessStatus based on evidence
  let accessStatus: AccessStatus = 'access_unverified';
  if (provider.includes('standardebooks') || (epub && editorialAssurance >= 12)) {
    accessStatus = 'carefully_edited';
  } else if (provider.includes('opentextbook') || provider.includes('openstax')) {
    accessStatus = 'open_textbook';
  } else if (provider.includes('doab') || provider.includes('oapen')) {
    accessStatus = 'scholarly_oa';
  } else if (provider.includes('google') || (pdf && pdf.includes('google.com/books'))) {
    accessStatus = 'preview_only';
  } else if (provider.includes('gutenberg') || (pdf && license === 'public_domain')) {
    accessStatus = 'public_domain';
  } else if (pdf || epub) {
    accessStatus = 'verified_full_text';
  } else if (provider.includes('openlibrary') && !pdf) {
    accessStatus = 'metadata_only';
  }

  // Build human-readable "Why this edition?" rationale
  let whyThisEdition = 'Complete edition matching search criteria.';
  if (whyReasons.length > 0) {
    whyThisEdition = `Recommended for its ${whyReasons.join(', ')}.`;
  }

  return {
    score,
    breakdown: {
      contentIntegrity,
      bibliographicConfidence,
      editorialAssurance,
      metadataCompleteness,
      readingAccess,
      rightsProvenance,
      presentation,
      demotions,
    },
    accessStatus,
    licenseEvidence: license,
    reasons,
    whyThisEdition,
  };
}

/**
 * Builds an AssetOption list from available links.
 */
export function buildAssetOptions(
  pdfUrl?: string | null,
  epubUrl?: string | null,
  sourceProvider?: string | null
): AssetOption[] {
  const assets: AssetOption[] = [];
  const provider = sourceProvider || 'open_web';

  if (epubUrl) {
    assets.push({
      format: 'epub',
      downloadUrl: epubUrl,
      isDirectDownload: true,
      isDirectRead: true,
      verified: true,
      sourceProvider: provider,
    });
  }

  if (pdfUrl) {
    const isGoogle = pdfUrl.includes('google') || provider.includes('google');
    assets.push({
      format: isGoogle ? 'external_reader' : 'pdf',
      downloadUrl: isGoogle ? undefined : pdfUrl,
      readerUrl: pdfUrl,
      isDirectDownload: !isGoogle,
      isDirectRead: true,
      verified: !isGoogle,
      sourceProvider: provider,
    });
  }

  return assets;
}
