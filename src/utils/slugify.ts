export const slugify = (text?: string | null) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Replace whitespace and punctuation runs with hyphens; \p{M} keeps
    // combining marks (e.g. Devanagari matras) attached to their base letters
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Handle empty results by using original text
    || text.replace(/\s+/g, '-').toLowerCase();
};
