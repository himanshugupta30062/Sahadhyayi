/* eslint-disable no-misleading-character-class */
export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens, but keep Unicode letters and numbers
    .replace(/[\s\W&&[^\u0900-\u097F\u00C0-\u024F\u1E00-\u1EFF]]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Handle empty results by using original text
    || text.replace(/\s+/g, '-').toLowerCase();
};
