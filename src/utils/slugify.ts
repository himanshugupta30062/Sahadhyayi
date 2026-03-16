/* eslint-disable no-misleading-character-class */
export const slugify = (text?: string | null) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Replace whitespace and punctuation runs with hyphens
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Handle empty results by using original text
    || text.replace(/\s+/g, '-').toLowerCase();
};
