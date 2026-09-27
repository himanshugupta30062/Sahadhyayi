// src/utils/getCoverQualityScore.ts
function getCoverQualityScore(url) {
  if (!url)
    return 0;
  if (url.includes("supabase"))
    return 500;
  if (url.includes("openlibrary") && url.includes("-L"))
    return 400;
  if (url.includes("openlibrary"))
    return 250;
  if (url.includes("googleusercontent") || url.includes("google.com/books"))
    return 200;
  return 100;
}
export {
  getCoverQualityScore
};
