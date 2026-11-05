export const slugify = (text?: string | null) => {
  if (!text) return '';
  let cleaned = text
    .toLowerCase()
    .trim()
    // Replace whitespace and punctuation runs with hyphens; \p{M} keeps
    // combining marks (e.g. Devanagari matras) attached to their base letters
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-');

  // Strip leading and trailing hyphens in linear time without regex backtracking
  while (cleaned.startsWith('-')) cleaned = cleaned.slice(1);
  while (cleaned.endsWith('-')) cleaned = cleaned.slice(0, -1);

  return cleaned || text.replace(/\s+/g, '-').toLowerCase();
};
