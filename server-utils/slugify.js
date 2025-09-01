// src/utils/slugify.ts
var slugify = (text) => {
  return text.toLowerCase().trim().replace(/[\s\W&&[^\u0900-\u097F\u00C0-\u024F\u1E00-\u1EFF]]+/g, "-").replace(/^-+|-+$/g, "") || text.replace(/\s+/g, "-").toLowerCase();
};
export {
  slugify
};
