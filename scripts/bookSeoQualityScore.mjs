/**
 * Book SEO Quality Score — 100-point positive scoring system.
 *
 * Components:
 * - metadata (20): title, description, author, genre, language, publication_year, pages, isbn
 * - cover (15): valid HTTPS cover image
 * - reading file (20): working pdf_url / reader_link_status, verified PDF
 * - unique content (25): quality description (length, not placeholder), author_bio
 * - internal links (10): linked author profile, related entities
 * - accuracy (10): valid ISBN, reasonable year/pages, deduplicated PDF
 *
 * Threshold for sitemap inclusion: >= 85
 */

const PLACEHOLDER_DESCRIPTION = /^(?:no description(?: available)?|description unavailable|coming soon|n\/?a|unknown|test book|not available|no summary(?: available)?|summary unavailable)$/i;

function plainText(value) {
  return String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/"|&#34;/gi, '"')
    .replace(/'|&apos;/gi, "'")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidIsbn(value) {
  const isbn = String(value ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce((total, char, index) => total + (char === "X" ? 10 : Number(char)) * (10 - index), 0);
    return sum % 11 === 0;
  }
  if (/^\d{13}$/.test(isbn)) {
    const sum = [...isbn].reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
    return sum % 10 === 0;
  }
  return false;
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Calculate Book SEO Quality Score (0-100)
 * @param {Object} book - Book record from books_library
 * @param {Object|null} linkedAuthor - Author profile if author_id matches
 * @returns {Object} { score, breakdown, eligibleForSitemap }
 */
export function calculateBookSeoScore(book = {}, linkedAuthor = null) {
  const breakdown = {
    metadata: 0,      // max 20
    cover: 0,         // max 15
    readingFile: 0,   // max 20
    uniqueContent: 0, // max 25
    internalLinks: 0, // max 10
    accuracy: 0,      // max 10
  };

  const title = plainText(book.title);
  const description = plainText(book.description);
  const authorName = plainText(book.author);
  const authorBio = plainText(book.author_bio);
  const cover = String(book.cover_image_url ?? "").trim();
  const pdfUrl = String(book.pdf_url ?? "").trim();
  const readerLinkStatus = String(book.reader_link_status ?? "unchecked").trim();
  const pdfVerificationStatus = String(book.pdf_verification_status ?? "pending").trim();
  const genre = plainText(book.genre);
  const language = plainText(book.language);
  const isbn = String(book.isbn ?? "").trim();
  const year = Number(book.publication_year);
  const pages = Number(book.pages);
  const pdfSha256 = String(book.pdf_sha256 ?? "").trim();

  // === METADATA (max 20) ===
  // title (4), description (4), author (3), genre (2), language (2), year (2), pages (2), isbn (1)
  if (title) breakdown.metadata += 4;
  if (description && description.length >= 45 && !PLACEHOLDER_DESCRIPTION.test(description) && description.toLowerCase() !== title.toLowerCase()) breakdown.metadata += 4;
  if (authorName) breakdown.metadata += 3;
  if (genre) breakdown.metadata += 2;
  if (language) breakdown.metadata += 2;
  if (Number.isInteger(year) && year >= 1400 && year <= CURRENT_YEAR + 1) breakdown.metadata += 2;
  if (Number.isInteger(pages) && pages > 0) breakdown.metadata += 2;
  if (isbn) breakdown.metadata += 1;

  // === COVER (max 15) ===
  // valid HTTPS cover URL (15)
  if (/^https:\/\//i.test(cover)) breakdown.cover += 15;

  // === READING FILE (max 20) ===
  // working reader link (10), verified PDF (10)
  if (readerLinkStatus === 'working' || pdfUrl.startsWith('https://')) breakdown.readingFile += 10;
  if (pdfVerificationStatus === 'verified') breakdown.readingFile += 10;

  // === UNIQUE CONTENT (max 25) ===
  // quality description (15), author_bio (10)
  if (description && description.length >= 120 && !PLACEHOLDER_DESCRIPTION.test(description) && description.toLowerCase() !== title.toLowerCase()) {
    breakdown.uniqueContent += 15;
  } else if (description && description.length >= 45 && !PLACEHOLDER_DESCRIPTION.test(description) && description.toLowerCase() !== title.toLowerCase()) {
    breakdown.uniqueContent += 8; // partial credit for decent but shorter description
  }
  if (authorBio && authorBio.length >= 50) breakdown.uniqueContent += 10;

  // === INTERNAL LINKS (max 10) ===
  // linked author profile (10)
  if (linkedAuthor) breakdown.internalLinks += 10;

  // === ACCURACY (max 10) ===
  // valid ISBN (4), reasonable year (2), reasonable pages (2), deduplicated PDF (2)
  if (isbn && isValidIsbn(isbn)) breakdown.accuracy += 4;
  if (Number.isInteger(year) && year >= 1400 && year <= CURRENT_YEAR + 1) breakdown.accuracy += 2;
  if (Number.isInteger(pages) && pages > 0 && pages <= 10000) breakdown.accuracy += 2;
  if (pdfSha256) breakdown.accuracy += 2;

  const score = Math.min(100, Object.values(breakdown).reduce((sum, v) => sum + v, 0));

  return {
    score,
    breakdown,
    eligibleForSitemap: score >= 85,
    grade: score >= 95 ? "A+" : score >= 90 ? "A" : score >= 85 ? "B+" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F",
  };
}

/**
 * Get unique author sitemap entries (deduplicated by slug)
 * @param {Array} authors - Array of author records
 * @param {Function} slugify - Slugify function
 * @returns {Array} Deduplicated author entries with { name, slug }
 */
export function getUniqueAuthorSitemapEntries(authors = [], slugify) {
  const entries = [];
  const seen = new Set();
  for (const author of authors) {
    const name = plainText(author?.name);
    if (!name) continue;
    const slug = String(slugify(name) ?? "").trim();
    if (!slug || !/^[\p{L}\p{N}\p{M}-]+$/u.test(slug) || seen.has(slug)) continue;
    seen.add(slug);
    entries.push({ name, slug });
  }
  return entries;
}

/**
 * Check basic sitemap eligibility (legacy - kept for backwards compatibility)
 * @deprecated Use calculateBookSeoScore instead
 */
export function getBookSitemapEligibility(book = {}) {
  const reasons = [];
  const id = String(book.id ?? "").trim();
  const title = plainText(book.title);
  const description = plainText(book.description);
  const author = plainText(book.author);
  const cover = String(book.cover_image_url ?? "").trim();
  if (!id || id.includes("/") || id === "." || id === "..") reasons.push("invalid_id");
  if (!title) reasons.push("missing_title");
  if (!description || description.length < 45 || PLACEHOLDER_DESCRIPTION.test(description) || description.toLowerCase() === title.toLowerCase()) {
    reasons.push("thin_or_placeholder_description");
  }
  if (!/^https:\/\//i.test(cover)) reasons.push("missing_or_invalid_cover");
  if (!author) reasons.push("missing_author");

  return { eligible: reasons.length === 0, reasons };
}