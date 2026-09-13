// src/utils/normalizeCoverUrl.ts
function normalizeCoverUrl(url) {
  if (!url)
    return null;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined")
    return null;
  return trimmed;
}
export {
  normalizeCoverUrl
};
