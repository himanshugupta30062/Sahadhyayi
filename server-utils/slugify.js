// src/utils/slugify.ts
var slugify = (text) => {
  if (!text)
    return "";
  return text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || text.replace(/\s+/g, "-").toLowerCase();
};
export {
  slugify
};
