const PLACEHOLDER_DESCRIPTION = /^(?:no description(?: available)?|description unavailable|coming soon|n\/?a|unknown|test book|not available|no summary(?: available)?|summary unavailable)$/i;

function plainText(value) {
  return String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Conservative sitemap eligibility for public book detail pages.
 * This is not a ranking score and does not prevent users from opening a book.
 * Records must have a stable ID, title, useful unique description, cover and author.
 */
export function getBookSitemapEligibility(book = {}) {
  const reasons = [];
  const id = String(book.id ?? "").trim();
  const title = plainText(book.title);
  const description = plainText(book.description);
  const author = plainText(book.author);
  const cover = String(book.cover_image_url ?? "").trim();

  if (!id || id.includes("/") || id === "." || id === "..') reasons.push("invalid_id");
  if (!title) reasons.push("missing_title");
  if (!description || description.length < 45 || PLACEHOLDER_DESCRIPTION.test(description) || description.toLowerCase() === title.toLowerCase()) {
    reasons.push("thin_or_placeholder_description");
  }
  if (!/^https:\/\//i.test(cover)) reasons.push("missing_or_invalid_cover");
  if (!author) reasons.push("missing_author");

  return { eligible: reasons.length === 0, reasons };
}

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
