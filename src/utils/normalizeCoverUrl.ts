export function normalizeCoverUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
}
