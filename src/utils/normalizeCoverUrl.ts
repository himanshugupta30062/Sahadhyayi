/**
 * Returns a usable HTTP(S) book-cover URL.
 *
 * Provider endpoints that return generic placeholders or scan backs must not
 * be treated as real covers. Archive.org's services/img endpoint is a
 * metadata thumbnail endpoint and commonly returns blank/scan-back imagery;
 * callers should resolve a jacket image from another source instead.
 */
export function normalizeCoverUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || /^(null|undefined)$/i.test(trimmed)) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  const fullPath = `${host}${path}`;

  if (
    /placeholder|no[-_]?cover|nocover|image[-_]?not[-_]?available|default[-_]?cover|blank[-_]?cover/i.test(fullPath) ||
    parsed.searchParams.get('id') === 'ryQBzwEACAAJ'
  ) {
    return null;
  }

  // Archive.org service thumbnails can be blank covers or scan backs. Do not
  // display them as book jackets; use a separately sourced cover instead.
  if (host === 'archive.org' && path.startsWith('/services/img/')) return null;

  return trimmed;
}
