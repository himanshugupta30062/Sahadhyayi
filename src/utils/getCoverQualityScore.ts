/** Source-based cover quality heuristic (no network requests). */
export function getCoverQualityScore(url?: string | null): number {
  if (!url) return 0;
  if (url.includes('supabase')) return 500;
  if (url.includes('openlibrary') && url.includes('-L')) return 400;
  if (url.includes('openlibrary')) return 250;
  if (url.includes('googleusercontent') || url.includes('google.com/books')) return 200;
  return 100;
}
